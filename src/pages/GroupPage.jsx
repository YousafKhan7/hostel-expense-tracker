import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc, getDocs, runTransaction, serverTimestamp, deleteField } from 'firebase/firestore';
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
import { BalanceCalculator } from '../utils/BalanceCalculator';
import AdjustmentHistory from '../components/Balance/AdjustmentHistory';
import SettlementControls from '../components/Balance/SettlementControls';

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
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
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
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementError, setSettlementError] = useState('');
  const [processingSettlement, setProcessingSettlement] = useState(false);
  const [isAdjustmentHistoryOpen, setIsAdjustmentHistoryOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch group details
    const fetchGroup = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          
          // Convert members array to object if it's still in array format
          if (Array.isArray(groupData.members)) {
            const membersObj = {};
            groupData.members.forEach(memberId => {
              membersObj[memberId] = {
                role: memberId === groupData.createdBy ? 'admin' : 'member',
                joinedAt: groupData.createdAt,
                balance: 0,
                name: memberId === user.uid ? user.email : memberId // temporary name
              };
            });

            // Update the group document with new structure
            await updateDoc(doc(db, 'groups', groupId), {
              members: membersObj
            });

            groupData.members = membersObj;
          }

          setGroup({ id: groupDoc.id, ...groupData });
          
          // Initialize splitAmong with all member IDs
          setNewExpense(prev => ({
            ...prev,
            splitAmong: Object.keys(groupData.members)
          }));
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        setError('Failed to load group data');
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

  // Handle leaving the group
  const handleLeaveGroup = async () => {
    if (!group || leavingGroup || group.createdBy === user.uid) return;

    try {
      setLeavingGroup(true);
      setLeaveError('');

      // Check if the user has unsettled balances
      const hasUnsettledBalance = group.members[user.uid]?.balance !== 0;
      
      if (hasUnsettledBalance) {
        setLeaveError("You can't leave the group while you have unsettled balances. Please settle all balances first.");
        return;
      }

      await runTransaction(db, async (transaction) => {
        // Remove member from group
        const groupRef = doc(db, 'groups', groupId);
        transaction.update(groupRef, {
          [`members.${user.uid}`]: deleteField()
        });

        // Update all related expenses
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('groupId', '==', groupId),
          where('splitAmong', 'array-contains', user.uid)
        );
        
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.forEach(doc => {
          const expenseData = doc.data();
          const updatedSplitAmong = expenseData.splitAmong.filter(id => id !== user.uid);
          
          transaction.update(doc.ref, {
            splitAmong: updatedSplitAmong
          });
        });
      });

      setIsLeaveModalOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error leaving group:', error);
      setLeaveError('Failed to leave group: ' + error.message);
    } finally {
      setLeavingGroup(false);
    }
  };

  // Add new function to handle member removal (for admins)
  const handleRemoveMember = async (memberId) => {
    if (!group || group.members[user.uid]?.role !== 'admin') return;

    try {
      await runTransaction(db, async (transaction) => {
        // Check member balance
        const memberBalance = group.members[memberId]?.balance || 0;
        if (memberBalance !== 0) {
          throw new Error("Can't remove member with unsettled balance");
        }

        // Remove member from group
        const groupRef = doc(db, 'groups', groupId);
        transaction.update(groupRef, {
          [`members.${memberId}`]: deleteField()
        });

        // Update related expenses
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('groupId', '==', groupId),
          where('splitAmong', 'array-contains', memberId)
        );
        
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.forEach(doc => {
          const expenseData = doc.data();
          const updatedSplitAmong = expenseData.splitAmong.filter(id => id !== memberId);
          
          transaction.update(doc.ref, {
            splitAmong: updatedSplitAmong
          });
        });
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  const handleSettlement = async (memberId, amount, comment) => {
    if (!group || processingSettlement) return;

    setProcessingSettlement(true);
    setSettlementError('');

    try {
      await runTransaction(db, async (transaction) => {
        const memberBalance = group.members[memberId]?.balance || 0;

        if (amount > Math.abs(memberBalance)) {
          throw new Error("Settlement amount cannot exceed current balance");
        }

        // Create settlement record
        const settlementRef = doc(collection(db, 'settlements'));
        transaction.set(settlementRef, {
          groupId,
          memberId,
          adminId: user.uid,
          amount: Number(amount),
          comment,
          createdAt: serverTimestamp(),
          balanceBefore: memberBalance
        });

        // Update member's balance
        const groupRef = doc(db, 'groups', groupId);
        const newBalance = memberBalance > 0 
          ? memberBalance - Number(amount)
          : memberBalance + Number(amount);

        transaction.update(groupRef, {
          [`members.${memberId}.balance`]: newBalance,
          [`members.${memberId}.lastSettlement`]: serverTimestamp()
        });

        // Create adjustment record
        const adjustmentRef = doc(collection(db, 'adjustments'));
        transaction.set(adjustmentRef, {
          groupId,
          memberId,
          adminId: user.uid,
          amount: Number(amount),
          type: memberBalance > 0 ? 'DEDUCT' : 'ADD',
          comment: `Settlement: ${comment}`,
          createdAt: serverTimestamp(),
          isSettlement: true
        });
      });

      setIsSettlementModalOpen(false);
    } catch (error) {
      setSettlementError(error.message);
    } finally {
      setProcessingSettlement(false);
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
              {/* Only show Leave Group button if the user is not the creator */}
              {group?.createdBy !== user.uid && (
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="btn btn-outline-red"
                >
                  Leave Group
                </button>
              )}
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
              {group?.members[user.uid]?.role === 'admin' && (
                <button
                  onClick={() => setIsSettlementModalOpen(true)}
                  className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Record Settlement
                </button>
              )}
              {group?.members[user.uid]?.role === 'admin' && (
                <button
                  onClick={() => setIsAdjustmentHistoryOpen(true)}
                  className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  View History
                </button>
              )}
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
                <MemberList 
                  group={group}
                  expenses={expenses}
                  onRemoveMember={handleRemoveMember}
                />
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

          {/* Leave Group Confirmation Modal */}
          <Modal
            isOpen={isLeaveModalOpen}
            onClose={() => {
              setIsLeaveModalOpen(false);
              setLeaveError('');
            }}
            title="Leave Group"
          >
            <div className="space-y-4">
              {leaveError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {leaveError}
                </div>
              )}
              <p className="text-gray-700">
                Are you sure you want to leave this group? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-500">
                All your expenses in this group will be deleted, and your shares in other expenses will be removed.
              </p>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLeaveModalOpen(false);
                    setLeaveError('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  disabled={leavingGroup}
                  className="btn btn-red"
                >
                  {leavingGroup ? 'Leaving...' : 'Leave Group'}
                </button>
              </div>
            </div>
          </Modal>

          {isAdjustmentHistoryOpen && (
            <Modal
              isOpen={isAdjustmentHistoryOpen}
              onClose={() => setIsAdjustmentHistoryOpen(false)}
              title="Adjustment History"
            >
              <AdjustmentHistory group={group} />
            </Modal>
          )}

          {isSettlementModalOpen && (
            <Modal
              isOpen={isSettlementModalOpen}
              onClose={() => setIsSettlementModalOpen(false)}
              title="Settlement Controls"
            >
              <SettlementControls 
                group={group} 
                onClose={() => setIsSettlementModalOpen(false)}
              />
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
} 
