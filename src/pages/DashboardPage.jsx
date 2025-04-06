import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Common/Modal';

export default function DashboardPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    try {
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        members: [user.uid],
        createdAt: new Date(),
        createdBy: user.uid
      });
      
      setIsCreateModalOpen(false);
      setNewGroupName('');
      navigate(`/group/${groupRef.id}`);
    } catch (error) {
      setError('Failed to create group. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/join')}
                className="btn btn-secondary"
              >
                Join Group
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary"
              >
                Create New Group
              </button>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No groups yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create a new group or join an existing one to start tracking expenses with friends.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/join')}
                  className="btn btn-secondary"
                >
                  Join Existing Group
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn btn-primary"
                >
                  Create New Group
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate(`/group/${group.id}`)}
                  className="cursor-pointer bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {group.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {group.members.length} members
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setError('');
              setNewGroupName('');
            }}
            title="Create New Group"
          >
            <form onSubmit={handleCreateGroup}>
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  className="input mt-1"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto sm:ml-3"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 w-full sm:w-auto"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setError('');
                    setNewGroupName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}