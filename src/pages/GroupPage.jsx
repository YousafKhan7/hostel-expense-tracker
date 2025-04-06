import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Common/Modal';
import MemberList from '../components/Group/MemberList';

export default function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    splitType: 'EQUAL',
    splitAmong: [],
    shares: {}
  });
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch group details
    const fetchGroup = async () => {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() };
        setGroup(groupData);
        // Initialize splitAmong with all group members
        setNewExpense(prev => ({
          ...prev,
          splitAmong: groupData.members
        }));
      } else {
        navigate('/dashboard');
      }
    };

    fetchGroup();

    // Subscribe to expenses
    const q = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, user, navigate]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.description.trim() || !newExpense.amount) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (newExpense.splitAmong.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    try {
      // Calculate equal shares
      const shareAmount = amount / newExpense.splitAmong.length;
      const shares = {};
      newExpense.splitAmong.forEach(memberId => {
        shares[memberId] = shareAmount;
      });

      await addDoc(collection(db, 'expenses'), {
        groupId,
        description: newExpense.description.trim(),
        amount,
        paidBy: user.uid,
        splitAmong: newExpense.splitAmong,
        splitType: 'EQUAL',
        shares,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid
      });

      setIsAddExpenseModalOpen(false);
      setNewExpense({
        description: '',
        amount: '',
        splitType: 'EQUAL',
        splitAmong: group.members,
        shares: {}
      });
    } catch (error) {
      setError('Failed to add expense. Please try again.');
    }
  };

  const formatMemberName = (memberId) => {
    return memberId === user.uid ? 'you' : 'other'; // This will be enhanced later with actual names
  };

  const getSplitSummary = (expense) => {
    if (!expense.splitAmong || expense.splitAmong.length === 0) return 'Not split';
    
    const totalMembers = expense.splitAmong.length;
    const shareAmount = (expense.amount / totalMembers).toFixed(2);
    
    return `Split equally • $${shareAmount} each`;
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(groupId);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group?.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-gray-500">
                  {Object.keys(group?.members || {}).length} members
                </p>
                <span className="text-gray-400">•</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  group?.members[user.uid]?.role === 'admin'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group?.members[user.uid]?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="btn btn-secondary"
              >
                Share Group
              </button>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="btn btn-primary"
              >
                Add Expense
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expenses Section - 2/3 width on large screens */}
            <div className="lg:col-span-2">
              {expenses.length === 0 ? (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No expenses yet
                  </h3>
                  <p className="text-gray-500">
                    Add your first expense to start tracking.
                  </p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <li key={expense.id} className="hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <p className="text-sm font-medium text-primary-600 truncate">
                                {expense.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {getSplitSummary(expense)}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                ${expense.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {expense.splitType}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex flex-col">
                              <p className="flex items-center text-sm text-gray-500">
                                Paid by {formatMemberName(expense.paidBy)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Split with {expense.splitAmong?.length || 0} members
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                {new Date(expense.createdAt?.toDate()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Members Section - 1/3 width on large screens */}
            <div className="lg:col-span-1">
d               <MemberList group={group} />
            </div>
          </div>

          <Modal
            isOpen={isAddExpenseModalOpen}
            onClose={() => {
              setIsAddExpenseModalOpen(false);
              setError('');
              setNewExpense({
                description: '',
                amount: '',
                splitType: 'EQUAL',
                splitAmong: group?.members || [],
                shares: {}
              });
            }}
            title="Add New Expense"
          >
            <form onSubmit={handleAddExpense}>
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="input mt-1"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
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
                    step="0.01"
                    min="0"
                    className="input mt-1"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Split Among
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Currently split equally among all members
                  </p>
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
                  onClick={() => {
                    setIsAddExpenseModalOpen(false);
                    setError('');
                    setNewExpense({
                      description: '',
                      amount: '',
                      splitType: 'EQUAL',
                      splitAmong: group?.members || [],
                      shares: {}
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isInviteModalOpen}
            onClose={() => {
              setIsInviteModalOpen(false);
              setInviteCopied(false);
            }}
            title="Share Group"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Share this code with others to invite them to the group:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={groupId}
                  className="input flex-grow bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="btn btn-secondary"
                >
                  {inviteCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                They can use this code on the Join Group page to become a member.
              </p>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
} 