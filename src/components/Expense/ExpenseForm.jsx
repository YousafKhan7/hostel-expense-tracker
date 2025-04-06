import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { validateExpense, getMonthKey } from '../../utils/ExpenseSchema';
import { updateMonthlyData, getMonthlyData } from '../../services/firestoreService';
import SplitTypeSelector from './SplitTypeSelector';
import CustomSplitInput from './CustomSplitInput';

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
        expenseDate: normalizedDate
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          {debug && (
            <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
              {debug}
            </pre>
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
          className="mt-1 input"
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
            id="amount"
            min="0"
            step="0.01"
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
          value={expenseDate instanceof Date && !isNaN(expenseDate.getTime())
            ? expenseDate.toISOString().substring(0, 10)
            : new Date().toISOString().substring(0, 10)}
          onChange={(e) => {
            try {
              // Parse the selected date and set time to noon
              const dateValue = e.target.value;
              console.log('Date input value:', dateValue);
              
              if (!dateValue) {
                throw new Error('Empty date value');
              }
              
              // Create date using the YYYY-MM-DD format directly
              const [year, month, day] = dateValue.split('-').map(Number);
              if (!year || !month || !day) {
                throw new Error('Invalid date format');
              }
              
              const selectedDate = new Date(year, month - 1, day, 12, 0, 0);
              
              if (isNaN(selectedDate.getTime())) {
                throw new Error('Invalid date selected');
              }
              
          
              
              setExpenseDate(selectedDate);
            } catch (err) {
              console.error('Error setting date:', err);
              // Fall back to today's date on error
              const today = new Date();
              today.setHours(12, 0, 0, 0);
              setExpenseDate(today);
            }
          }}
          className="mt-1 input"
          required
          max={new Date().toISOString().substring(0, 10)}
        />
      </div>

      <div>
        <SplitTypeSelector
          value={splitType}
          onChange={handleSplitTypeChange}
        />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : amount ? (
        <div>
          {splitType === 'equal' ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Split With</h4>
              <div className="bg-white rounded-lg border border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {allMembers.map(memberId => (
                    <li key={memberId} className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(memberId)}
                          onChange={() => handleMemberToggle(memberId)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                        />
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800">
                            {(memberProfiles[memberId]?.name?.[0] || '?').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {memberId === user.uid ? 'You' : (memberProfiles[memberId]?.name || 'Unknown User')}
                          </p>
                          <p className="text-xs text-gray-500">{memberProfiles[memberId]?.email}</p>
                        </div>
                        {selectedMembers.includes(memberId) && (
                          <div className="ml-auto text-sm text-gray-500">
                            ${(parseFloat(amount) / selectedMembers.length).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <CustomSplitInput
              members={memberProfiles}
              totalAmount={parseFloat(amount)}
              selectedMembers={selectedMembers}
              onSplitChange={setCustomShares}
              currentUserId={user.uid}
            />
          )}
        </div>
      ) : null}

      <div>
        <button
          type="submit"
          className="w-full btn-primary"
          disabled={loading || !description || !amount || selectedMembers.length === 0}
        >
          {loading ? 'Creating Expense...' : 'Create Expense'}
        </button>
      </div>
    </form>
  );
} 