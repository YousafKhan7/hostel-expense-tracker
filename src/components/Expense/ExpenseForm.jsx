import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { validateExpense, getMonthKey } from '../../utils/ExpenseSchema';
import { updateMonthlyData, getMonthlyData } from '../../services/firestoreService';
import SplitTypeSelector from './SplitTypeSelector';
import CustomSplitInput from './CustomSplitInput';
import CategorySelector from '../Category/CategorySelector';

export default function ExpenseForm({ groupId, onSuccess }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [splitType, setSplitType] = useState('equal');
  const [customShares, setCustomShares] = useState({});
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState('');

  // Set today's date as initial value, ensuring noon time to avoid timezone issues
  useEffect(() => {
    try {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
   
      
      setExpenseDate(today);
    } catch (err) {
      console.error('Error setting initial date:', err);
    }
  }, []);

  // Fetch member profiles
  useEffect(() => {
    const fetchGroupAndMembers = async () => {
      try {
        // First get the group to get member IDs
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (!groupDoc.exists()) {
          throw new Error('Group not found');
        }

        const groupData = groupDoc.data();
        const memberIds = Object.keys(groupData.members || {});
        setAllMembers(memberIds);
        // Initially select all members including current user
        setSelectedMembers(memberIds);

        // Then fetch each member's profile
        const profiles = {};
        const memberPromises = memberIds.map(async (memberId) => {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            profiles[memberId] = userDoc.data();
          }
        });

        await Promise.all(memberPromises);
        setMemberProfiles(profiles);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching member profiles:', err);
        setError('Failed to load member profiles');
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupAndMembers();
    }
  }, [groupId]);

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        // Don't allow deselecting if only one member is selected
        if (prev.length <= 1) {
          return prev;
        }
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebug('');

    try {
      if (!amount || isNaN(parseFloat(amount))) {
        throw new Error('Please enter a valid amount');
      }

      if (selectedMembers.length === 0) {
        throw new Error('Please select at least one member to split with');
      }

      // Validate expense date first
      if (!expenseDate || !(expenseDate instanceof Date) || isNaN(expenseDate.getTime())) {
        console.error('Invalid expense date before normalization:', expenseDate);
        throw new Error('Please select a valid date');
      }

      let shares = {};
      const totalAmount = parseFloat(amount);

    

      if (splitType === 'equal') {
        const shareAmount = Math.floor((totalAmount / selectedMembers.length) * 100) / 100;
        selectedMembers.forEach((memberId, index) => {
          if (index === selectedMembers.length - 1) {
            shares[memberId] = Math.round((totalAmount - (shareAmount * (selectedMembers.length - 1))) * 100) / 100;
          } else {
            shares[memberId] = shareAmount;
          }
        });
      } else {
        const totalShares = Object.values(customShares).reduce((sum, share) => sum + (share || 0), 0);
        if (Math.abs(totalShares - totalAmount) > 0.01) {
          throw new Error('The sum of shares must equal the total amount');
        }
        shares = customShares;
      }

      // Create a new date object at noon to avoid timezone issues
      const normalizedDate = new Date(expenseDate);
      normalizedDate.setHours(12, 0, 0, 0);

  

      const expenseData = validateExpense({
        description: description.trim(),
        amount: totalAmount,
        paidBy: user.uid,
        groupId,
        shares,
        splitType,
        expenseDate: normalizedDate,
        category: categoryId
      });

      // Log validated expense data
    
      // Add expense to Firestore
      const expenseRef = await addDoc(collection(db, 'expenses'), expenseData);

      // Update monthly data
      const monthKey = getMonthKey(normalizedDate);

      const monthlyData = await getMonthlyData(groupId, monthKey);
      
      // Update total expenses
      const newTotal = monthlyData.totalExpenses + totalAmount;
      
      // Update member balances
      const newBalances = { ...monthlyData.memberBalances };
      newBalances[user.uid] = (newBalances[user.uid] || 0) + totalAmount;
      
      Object.entries(shares).forEach(([memberId, share]) => {
        newBalances[memberId] = (newBalances[memberId] || 0) - share;
      });

      // Log monthly updates
   
      await updateMonthlyData(groupId, monthKey, {
        totalExpenses: newTotal,
        memberBalances: newBalances,
        lastExpenseId: expenseRef.id
      });

      // Clear form
      setDescription('');
      setAmount('');
      setCustomShares({});
      setSplitType('equal');
      
      // Set a fresh date (today at noon)
      const freshDate = new Date();
      freshDate.setHours(12, 0, 0, 0);
      setExpenseDate(freshDate);
      
    
      
      setError('');
      setDebug('');
      onSuccess?.();
    } catch (err) {
      console.error('Error creating expense:', err);
      setError(err.message);
      
      // Create detailed debug info
      let dateDebugInfo = '';
      try {
        if (expenseDate) {
          dateDebugInfo = `
Date object: ${expenseDate}
Date instanceof Date: ${expenseDate instanceof Date}
Date isNaN: ${isNaN(expenseDate.getTime())}
Date ISO string: ${expenseDate instanceof Date ? expenseDate.toISOString() : 'N/A'}
Date for input: ${expenseDate instanceof Date ? expenseDate.toISOString().substring(0, 10) : 'N/A'}`;
        } else {
          dateDebugInfo = 'Date is null or undefined';
        }
      } catch (debugErr) {
        dateDebugInfo = `Error getting date debug: ${debugErr.message}`;
      }
      
      setDebug(`Debug info: ${err.message}
${dateDebugInfo}
Normalized: ${new Date().toISOString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    setCustomShares({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
          {debug && (
            <pre className="mt-2 text-xs text-red-500 overflow-auto">{debug}</pre>
          )}
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input mt-1"
          placeholder="What's this expense for?"
          required
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input pl-7"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="expenseDate"
          value={expenseDate instanceof Date ? expenseDate.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            // Create new date at noon to avoid timezone issues
            const selectedDate = new Date(e.target.value);
            selectedDate.setHours(12, 0, 0, 0);
            setExpenseDate(selectedDate);
          }}
          className="input mt-1"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <CategorySelector 
          groupId={groupId}
          selectedCategoryId={categoryId}
          onChange={setCategoryId}
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Split With
        </span>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex flex-wrap gap-2">
            {allMembers.map((memberId) => {
              const profile = memberProfiles[memberId] || {};
              const isCurrentUser = memberId === user.uid;
              const isSelected = selectedMembers.includes(memberId);
              
              return (
                <button
                  key={memberId}
                  type="button"
                  className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                    isSelected 
                      ? 'bg-primary-100 text-primary-800 border border-primary-300' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
                  }`}
                  onClick={() => handleMemberToggle(memberId)}
                >
                  {profile.name || (isCurrentUser ? 'You' : 'Unknown')}
                  {isCurrentUser && ' (you)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <SplitTypeSelector 
          value={splitType}
          onChange={handleSplitTypeChange}
        />
      </div>

      {splitType === 'custom' && (
        <CustomSplitInput
          members={allMembers.filter(id => selectedMembers.includes(id))}
          memberProfiles={memberProfiles}
          totalAmount={parseFloat(amount) || 0}
          shares={customShares}
          onChange={setCustomShares}
          currentUserId={user.uid}
        />
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
} 