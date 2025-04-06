import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function MemberList({ members, groupCreator }) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        const profiles = {};
        for (const memberId of members) {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            profiles[memberId] = userDoc.data();
          } else {
            // If no profile exists, use email from auth
            profiles[memberId] = { email: 'Unknown User' };
          }
        }
        setMemberProfiles(profiles);
      } catch (error) {
        console.error('Error fetching member profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (members.length > 0) {
      fetchMemberProfiles();
    }
  }, [members]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {[...Array(members.length)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Group Members</h3>
      <ul className="divide-y divide-gray-200 bg-white shadow rounded-lg">
        {members.map((memberId) => {
          const profile = memberProfiles[memberId] || {};
          const isCreator = memberId === groupCreator;
          const isCurrentUser = memberId === user.uid;

          return (
            <li
              key={memberId}
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-800 font-medium">
                      {(profile.email?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isCurrentUser ? 'You' : profile.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isCreator ? 'Group Admin' : 'Member'}
                  </p>
                </div>
              </div>
              {isCreator && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Admin
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 