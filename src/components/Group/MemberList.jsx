import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { BalanceCalculator } from '../../utils/BalanceCalculator';
import Modal from '../Common/Modal';

export default function MemberList({ group, expenses, onRemoveMember }) {
  const { user } = useAuth();
  const [confirmationModal, setConfirmationModal] = useState({ open: false, type: null, memberId: null });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  const isAdmin = group?.members[user.uid]?.role === 'admin';

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        const profiles = {};
        // Get all member IDs from the group members object
        const memberIds = Object.keys(group.members || {});
        
        for (const memberId of memberIds) {
          // If we already have member data in the group object, use it as a base
          profiles[memberId] = {
            name: group.members[memberId].name || 'Unknown User',
            email: group.members[memberId].email || 'No email available',
            role: group.members[memberId].role || 'member',
            balance: group.members[memberId].balance || 0,
            joinedAt: group.members[memberId].joinedAt
          };

          // Fetch additional user details if needed
          try {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[memberId] = {
                ...profiles[memberId],
                name: userData.name || profiles[memberId].name,
                email: userData.email || profiles[memberId].email,
                photoURL: userData.photoURL
              };
            }
          } catch (error) {
            console.error(`Error fetching details for member ${memberId}:`, error);
          }
        }
        setMemberProfiles(profiles);
      } catch (error) {
        console.error('Error fetching member profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (group?.members) {
      fetchMemberProfiles();
    }
  }, [group?.members]);

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin || processing) return;
    
    setProcessing(true);
    setError('');

    try {
      const hasUnsettledBalance = BalanceCalculator.hasMemberUnsettledBalance(expenses, group.members, memberId);
      
      if (hasUnsettledBalance) {
        throw new Error("Cannot remove member with unsettled balance");
      }

      await onRemoveMember(memberId);
      setConfirmationModal({ open: false, type: null, memberId: null });
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {[...Array(Object.keys(group?.members || {}).length)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Group Members</h3>
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <ul className="mt-4 divide-y divide-gray-200">
          {Object.entries(group?.members || {}).map(([memberId, memberData]) => {
            const profile = memberProfiles[memberId] || {};
            const isCurrentUser = memberId === user.uid;
            
            return (
              <li key={memberId} className="py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {profile.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.name} 
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg text-gray-600">
                        {(profile.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.name || 'Unknown User'}
                      {isCurrentUser && " (You)"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {profile.email || 'No email available'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {memberData.role || 'Member'}
                    </p>
                    <p className={`text-sm ${
                      memberData.balance > 0 
                        ? 'text-green-600' 
                        : memberData.balance < 0 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                    }`}>
                      Balance: ${(memberData.balance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {isAdmin && !isCurrentUser && (
                    <button
                      onClick={() => setConfirmationModal({ 
                        open: true, 
                        type: 'remove', 
                        memberId 
                      })}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Modal
        isOpen={confirmationModal.open}
        onClose={() => setConfirmationModal({ open: false, type: null, memberId: null })}
        title="Remove Member"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500">
            Are you sure you want to remove this member? This action cannot be undone.
          </p>

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setConfirmationModal({ open: false, type: null, memberId: null })}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRemoveMember(confirmationModal.memberId)}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 
