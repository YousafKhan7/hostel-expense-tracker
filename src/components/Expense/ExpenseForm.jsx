import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function ExpenseForm({ group, onSubmit, onClose }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [selectedMembers, setSelectedMembers] = useState({});
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Initialize selected members with all group members
  useEffect(() => {
    if (group?.members) {
      const initialSelected = {};
      Object.keys(group.members).forEach(memberId => {
        initialSelected[memberId] = true;
      });
      setSelectedMembers(initialSelected);
    }
  }, [group?.members]);

  // Fetch member profiles
  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        const profiles = {};
        for (const memberId of Object.keys(group.members)) {
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching member profiles:', error);
        setError('Failed to load member profiles');
        setLoading(false);
      }
    };

    if (group?.members) {
      fetchMemberProfiles();
    }
  }, [group?.members]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Get selected member IDs
    const splitAmong = Object.entries(selectedMembers)
      .filter(([_, isSelected]) => isSelected)
      .map(([memberId]) => memberId);

    if (splitAmong.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    // Calculate shares based on split type
    const shares = {};
    if (splitType === 'EQUAL') {
      const shareAmount = amountValue / splitAmong.length;
      splitAmong.forEach(memberId => {
        shares[memberId] = shareAmount;
      });
    }

    onSubmit({
      description: description.trim(),
      amount: amountValue,
      splitType,
      splitAmong,
      shares,
      paidBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="description"
          className="input mt-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this expense for?"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          className="input mt-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Type
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-md ${
              splitType === 'EQUAL'
                ? 'bg-primary-100 text-primary-800 border-2 border-primary-500'
                : 'bg-gray-100 text-gray-800 border-2 border-transparent'
            }`}
            onClick={() => setSplitType('EQUAL')}
          >
            Split Equally
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md ${
              splitType === 'CUSTOM'
                ? 'bg-primary-100 text-primary-800 border-2 border-primary-500'
                : 'bg-gray-100 text-gray-800 border-2 border-transparent opacity-50 cursor-not-allowed'
            }`}
            disabled={true}
            title="Coming soon"
          >
            Custom Split
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Between
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(group.members).map(([memberId, memberData]) => {
            const profile = memberProfiles[memberId];
            const isCurrentUser = memberId === user.uid;

            return (
              <div key={memberId} className="flex items-center">
                <input
                  type="checkbox"
                  id={`member-${memberId}`}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                  checked={selectedMembers[memberId]}
                  onChange={(e) => {
                    setSelectedMembers(prev => ({
                      ...prev,
                      [memberId]: e.target.checked
                    }));
                  }}
                />
                <label htmlFor={`member-${memberId}`} className="ml-2 block text-sm text-gray-900">
                  {isCurrentUser ? 'You' : profile.name}
                  <span className="text-xs text-gray-500 ml-1">
                    ({profile.email})
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="submit"
          className="btn btn-primary w-full sm:w-auto sm:ml-3"
        >
          Add Expense
        </button>
        <button
          type="button"
          className="btn btn-secondary mt-3 sm:mt-0 w-full sm:w-auto"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 