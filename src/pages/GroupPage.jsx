import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Common/Modal';
import MemberList from '../components/Group/MemberList';
import ExpenseForm from '../components/Expense/ExpenseForm';
import BalanceDisplay from '../components/Balance/BalanceDisplay';
import ExpenseList from '../components/Expense/ExpenseList';
import ExpenseCalendar from '../components/Expense/ExpenseCalendar';
import CategoryManager from '../components/Category/CategoryManager';
import { getMonthKey, getMonthBoundaries } from '../utils/ExpenseSchema';
import { lazy, Suspense } from 'react';

// Lazy load the MonthlyReport component
const MonthlyReport = lazy(() => import('../components/Report/MonthlyReport'));

// Simple loading component for the report
const ReportLoading = () => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="text-lg font-medium text-gray-900">Monthly Report</h3>
    <p className="text-sm text-gray-500 mt-1">Loading report component...</p>
    <div className="mt-4 flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  </div>
);

export default function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [activeTab, setActiveTab] = useState('expenses');
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
    const { startDate, endDate } = getMonthBoundaries(selectedMonth);
    const q = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
      where('expenseDate', '>=', startDate),
      where('expenseDate', '<=', endDate)
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
  }, [groupId, user, navigate, selectedMonth]);

  const handleAddExpense = async (expenseData) => {
    try {
      await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        groupId: groupId
      });
      setIsAddExpenseModalOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      // Error will be handled by the ExpenseForm component
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

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'expenses'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reports
              </button>
            </nav>
          </div>

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Calendar and Expenses */}
              <div className="lg:col-span-2 space-y-6">
                <ExpenseCalendar
                  groupId={groupId}
                  expenses={expenses}
                  onMonthChange={setSelectedMonth}
                />
                
                <ExpenseList
                  expenses={expenses}
                  members={group?.members || {}}
                  groupId={groupId}
                />
              </div>

              {/* Right Column - Members and Balance */}
              <div className="lg:col-span-1 space-y-6">
                <MemberList group={group} />
                <BalanceDisplay group={group} expenses={expenses} />
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="bg-white shadow rounded-lg p-6">
              <CategoryManager 
                groupId={groupId} 
                onCategorySelect={(category) => {
                  // Switch to expenses tab and filter by this category
                  setActiveTab('expenses');
                }}
              />
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-white shadow rounded-lg p-6">
              <Suspense fallback={<ReportLoading />}>
                <MonthlyReport
                  groupId={groupId}
                  groupName={group?.name || 'Group'}
                  monthKey={selectedMonth}
                  expenses={expenses}
                  members={group?.members || {}}
                />
              </Suspense>
            </div>
          )}

          {/* Add Expense Modal */}
          <Modal
            isOpen={isAddExpenseModalOpen}
            onClose={() => setIsAddExpenseModalOpen(false)}
            title="Add Expense"
          >
            <ExpenseForm
              groupId={groupId}
              onSuccess={() => setIsAddExpenseModalOpen(false)}
            />
          </Modal>

          {/* Invite Modal */}
          <Modal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            title="Share Group"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Share this group code with others to invite them to your group.
              </p>
              
              <div className="flex rounded-md shadow-sm">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    readOnly
                    value={groupId}
                    className="input block w-full pr-10 sm:text-sm"
                    onClick={(e) => e.target.select()}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {inviteCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <p className="text-xs text-gray-500">
                Others can join by going to the dashboard and clicking "Join Group".
              </p>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
} 