import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function MemberList({ group }) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        const profiles = {};
        // Get all member IDs except current user
        const memberIds = Object.keys(group.members).filter(id => id !== user.uid);
        
        for (const memberId of memberIds) {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            profiles[memberId] = userDoc.data();
          } else {
            profiles[memberId] = { 
              name: 'Unknown User',
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

  // Get other members (excluding current user)
  const otherMembers = Object.entries(group.members)
    .filter(([memberId]) => memberId !== user.uid);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Other Members</h3>
        <span className="text-sm text-gray-500">
          {otherMembers.length} {otherMembers.length === 1 ? 'member' : 'members'}
        </span>
      </div>
      
      <ul className="divide-y divide-gray-200 bg-white shadow rounded-lg">
        {otherMembers.map(([memberId, memberData]) => {
          const profile = memberProfiles[memberId] || {};
          const isAdmin = memberData.role === 'admin';
          const isCreator = group.createdBy === memberId;

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
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {profile.name || 'Unknown User'}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isAdmin ? 'Admin' : 'Member'}
                    </span>
                    {isCreator && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Creator
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {profile.email || 'No email available'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined {formatDate(memberData.joinedAt)}
                  </p>
                </div>
              </div>
              {group.createdBy === user.uid && (
                <button
                  className="text-red-600 hover:text-red-800 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Remove member functionality will be added here
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 