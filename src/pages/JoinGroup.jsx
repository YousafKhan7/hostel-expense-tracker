import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

export default function JoinGroup() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Get group document using invite code
      const groupDoc = await getDoc(doc(db, 'groups', inviteCode));

      if (!groupDoc.exists()) {
        setError('Invalid invite code');
        return;
      }

      // Check if user is already a member
      const groupData = groupDoc.data();
      if (groupData.members.includes(user.uid)) {
        setError('You are already a member of this group');
        return;
      }

      // Add user to group members
      await updateDoc(doc(db, 'groups', inviteCode), {
        members: arrayUnion(user.uid)
      });

      // Navigate to the group page
      navigate(`/group/${inviteCode}`);
    } catch (error) {
      setError('Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join a Group
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the invite code to join an existing group
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleJoinGroup}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="inviteCode" className="sr-only">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              required
              className="input"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 