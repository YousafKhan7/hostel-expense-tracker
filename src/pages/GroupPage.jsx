import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Common/Modal';

export default function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: ''
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
        setGroup({ id: groupDoc.id, ...groupDoc.data() });
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

    try {
      await addDoc(collection(db, 'expenses'), {
        groupId,
        description: newExpense.description.trim(),
        amount,
        paidBy: user.uid,
        splitAmong: group.members,
        createdAt: new Date(),
        createdBy: user.uid
      });

      setIsAddExpenseModalOpen(false);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: ''
      });
    } catch (error) {
      setError('Failed to add expense. Please try again.');
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
              <p className="text-gray-500 mt-1">{group?.members.length} members</p>
            </div>
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="btn btn-primary"
            >
              Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No expenses yet
              </h3>
              <p className="text-gray-500">
                Add your first expense to start tracking.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <li key={expense.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary-600 truncate">
                          {expense.description}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ${expense.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Paid by {expense.paidBy === user.uid ? 'you' : 'other'}
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

          <Modal
            isOpen={isAddExpenseModalOpen}
            onClose={() => {
              setIsAddExpenseModalOpen(false);
              setError('');
              setNewExpense({
                description: '',
                amount: '',
                paidBy: ''
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
                      paidBy: ''
                    });
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