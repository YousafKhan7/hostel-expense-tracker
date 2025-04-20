import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../Common/Modal';

// Constants for text strings
const TEXT = {
  OTHER_MEMBERS: 'Other Members',
  MEMBER: 'member',
  MEMBERS: 'members',
  UNKNOWN_USER: 'Unknown User',
  NO_EMAIL_AVAILABLE: 'No email available',
  ADMIN: 'Admin',
  MEMBER_ROLE: 'Member',
  CREATOR: 'Creator',
  REMOVE: 'Remove',
  REMOVING: 'Removing...',
  REMOVE_CONFIRMATION_TITLE: 'Remove Member',
  REMOVE_CONFIRMATION_MESSAGE: 'Are you sure you want to remove {memberName} from the group? This action cannot be undone.',
  CANCEL: 'Cancel',
  REMOVE_MEMBER: 'Remove',
};

export default function MemberList({ group }) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const { user } = useAuth();

  // Function to check if the current user is an admin or not
  const checkIfUserIsAdmin = () => group?.members[user.uid]?.role === 'admin';

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        const profiles = {};
        // Get all member IDs
        const memberIds = Object.keys(group.members).filter(id => id !== user.uid);
        
        for (const memberId of memberIds) {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            profiles[memberId] = userDoc.data();
          } else {
            profiles[memberId] = {
              name: TEXT.UNKNOWN_USER,
              email: 'No email available'
            };
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
  }, [group?.members, user.uid]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date.toDate()).toLocaleDateString();
  };

  // Function to handle confirmation before removing a member
  const handleConfirmRemove = (memberId) => {
    setMemberToRemove(memberId);
    setShowConfirmationModal(true);
  };

  const handleRemoveMember = async (memberId) => {
    if (!group || removing || !memberId) return;

    try {
      setRemoving(memberId);

      // Delete all expenses related to the user
      const expensesQuery = query(collection(db, 'expenses'), where('groupId', '==', group.id), where('paidBy', '==', memberId));
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesToDelete = expensesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

      for (const expenseToDelete of expensesToDelete) {
        await deleteDoc(doc(db, 'expenses', expenseToDelete.id));
      }

      // Delete all expenses shares related to the user
      const expensesSharesQuery = query(collection(db, 'expenses'), where('groupId', '==', group.id), where('splitAmong', 'array-contains', memberId));
      const expensesSharesSnapshot = await getDocs(expensesSharesQuery);
      const expensesSharesToDelete = expensesSharesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

      for (const expenseShareToDelete of expensesSharesToDelete) {
        // Remove memberId from splitAmong
        const updatedSplitAmong = expenseShareToDelete.data.splitAmong.filter(id => id !== memberId);

        // Remove the share object from shares
        const updatedShares = expenseShareToDelete.data.shares.filter(share => share.memberId !== memberId);


        // Update the expense document
        await updateDoc(doc(db, 'expenses', expenseShareToDelete.id), {
          splitAmong: updatedSplitAmong,
          shares: updatedShares,
        });
      }

      // Create a new members object without the removed member
      const updatedMembers = { ...group.members };
      delete updatedMembers[memberId];

      // Update the group document and memberIds
      await updateDoc(doc(db, 'groups', group.id), {
        members: updatedMembers,
        memberIds: Object.keys(updatedMembers),
      });

      // Close the modal
      setShowConfirmationModal(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setRemoving(null);
    }
  };

  // Filter out the current user from other members
  const otherMembers = Object.entries(group.members)
    .filter(([memberId]) => memberId !== user.uid);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {[...Array(Object.keys(group?.members || {}).length - 1)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{TEXT.OTHER_MEMBERS}</h3>
        <span className="text-sm text-gray-500">
          {otherMembers.length} {otherMembers.length === 1 ? TEXT.MEMBER : TEXT.MEMBERS}
        </span>
      </div>
      
      <ul className="divide-y divide-gray-200 bg-white shadow rounded-lg">
        {otherMembers.map(([memberId, memberData]) => {
          const profile = memberProfiles[memberId] || {};
          const isAdmin = memberData.role === 'admin';
          const isCreator = group.createdBy === memberId; // Check if the current member is the creator
          
          return (
            <li
              key={memberId}
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-800 font-medium">
                      {(profile.name?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 truncate">
                    <p className="text-sm font-medium text-gray-900">
                      {profile.name || TEXT.UNKNOWN_USER}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isAdmin ? TEXT.ADMIN : TEXT.MEMBER_ROLE}
                    </span>
                    {isCreator && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {TEXT.CREATOR}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {profile.email || TEXT.NO_EMAIL_AVAILABLE}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined {formatDate(memberData.joinedAt)}
                  </p>
                </div>
              </div>
                {/* Remove member confirmation modal */}
                {showConfirmationModal && memberToRemove === memberId && (
                  <Modal onClose={() => setShowConfirmationModal(false)}>
                    <h3 className="text-lg font-medium text-gray-900">{TEXT.REMOVE_CONFIRMATION_TITLE}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {TEXT.REMOVE_CONFIRMATION_MESSAGE.replace('{memberName}', profile.name || TEXT.UNKNOWN_USER)}
                    </p>
                    <div className="mt-4 space-x-2">
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setShowConfirmationModal(false)}
                      >
                        {TEXT.CANCEL}
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => handleRemoveMember(memberToRemove)}
                      >
                        {TEXT.REMOVE_MEMBER}
                      </button>
                    </div>
                  </Modal>
                )}
              {checkIfUserIsAdmin() && memberId !== group.createdBy && (
                <button
                  className={`text-red-600 hover:text-red-800 text-sm ${
                    removing === memberId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmRemove(memberId);
                  }}
                  disabled={removing === memberId}
                >
                  {removing === memberId ? TEXT.REMOVING : TEXT.REMOVE}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 