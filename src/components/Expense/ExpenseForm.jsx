import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import SplitTypeSelector from './SplitTypeSelector';
import CustomSplitInput from './CustomSplitInput';

export default function ExpenseForm({ group, onSubmit, onClose }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customShares, setCustomShares] = useState({});
  const { user } = useAuth();

  // Initialize selected members with all group members
  useEffect(() => {
    if (group?.members) {
      const initialSelected = [];
      Object.keys(group.members).forEach(memberId => {
        initialSelected.push(memberId);
      });
      setSelectedMembers(initialSelected);
    }
  }, [group?.members]);

  // Calculate and validate split amounts
  useEffect(() => {
    if (!amount || isNaN(parseFloat(amount))) {
      setCustomShares({});
      return;
    }

    const amountValue = parseFloat(amount);
    const selectedCount = selectedMembers.length;

    if (selectedCount === 0) {
      setCustomShares({});
      return;
    }

    if (splitType === 'equal') {
      const shareAmount = Math.floor((amountValue / selectedCount) * 100) / 100;
      const totalShares = shareAmount * (selectedCount - 1);
      
      const shares = {};
      selectedMembers.forEach((memberId, index) => {
        // Last member gets the remaining amount to handle rounding
        if (index === selectedCount - 1) {
          shares[memberId] = Math.round((amountValue - totalShares) * 100) / 100;
        } else {
          shares[memberId] = shareAmount;
        }
      });

      setCustomShares(shares);
    }
  }, [amount, selectedMembers, splitType]);

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

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (!expenseAmount || expenseAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    // Calculate shares based on split type
    let shares = {};
    if (splitType === 'equal') {
      const shareAmount = Math.floor((expenseAmount / selectedMembers.length) * 100) / 100;
      const totalShares = shareAmount * (selectedMembers.length - 1);
      
      selectedMembers.forEach((memberId, index) => {
        // Last member gets the remaining amount to handle rounding
        if (index === selectedMembers.length - 1) {
          shares[memberId] = Math.round((expenseAmount - totalShares) * 100) / 100;
        } else {
          shares[memberId] = shareAmount;
        }
      });
    } else {
      // Validate custom shares
      const totalShares = Object.values(customShares).reduce((sum, share) => sum + (share || 0), 0);
      if (Math.abs(totalShares - expenseAmount) > 0.01) {
        setError('The sum of shares must equal the total amount');
        return;
      }
      shares = customShares;
    }

    const expense = {
      description: description.trim(),
      amount: expenseAmount,
      splitType,
      paidBy: user.uid,
      shares,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSubmit(expense);
  };

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => {
      const newSelection = prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      
      // Update shares when members change
      if (splitType === 'equal') {
        const shareAmount = amount ? Math.floor((parseFloat(amount) / newSelection.length) * 100) / 100 : 0;
        const shares = {};
        newSelection.forEach(id => {
          shares[id] = shareAmount;
        });
        setCustomShares(shares);
      } else {
        // For custom split, initialize new member with 0
        setCustomShares(prev => ({
          ...prev,
          [memberId]: prev[memberId] || 0
        }));
      }

      return newSelection;
    });
  };

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (type === 'equal' && selectedMembers.length > 0) {
      const shareAmount = amount ? Math.floor((parseFloat(amount) / selectedMembers.length) * 100) / 100 : 0;
      const shares = {};
      selectedMembers.forEach(id => {
        shares[id] = shareAmount;
      });
      setCustomShares(shares);
    }
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
          placeholder="Enter expense description"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            className="input pl-7"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split With
        </label>
        <div className="bg-white rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {Object.entries(group.members).map(([memberId, member]) => (
              memberId !== user.uid && (
                <li key={memberId} className="px-4 py-3">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(memberId)}
                        onChange={() => handleMemberToggle(memberId)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-300"
                      />
                    </div>
                    <div className="ml-3 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-800">
                          {(member.name?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {member.name || 'Unknown User'}
                      </span>
                    </div>
                  </div>
                </li>
              )
            ))}
          </ul>
        </div>
      </div>

      {selectedMembers.length > 0 && (
        <>
          <SplitTypeSelector
            value={splitType}
            onChange={handleSplitTypeChange}
          />

          {splitType === 'custom' && amount && (
            <CustomSplitInput
              members={group.members}
              totalAmount={parseFloat(amount)}
              selectedMembers={selectedMembers}
              onSplitChange={setCustomShares}
              initialShares={customShares}
            />
          )}
        </>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
} 