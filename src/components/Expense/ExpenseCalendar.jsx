import { useState, useEffect } from 'react';
import { getMonthKey, getMonthBoundaries } from '../../utils/ExpenseSchema';
import { getMonthlyData } from '../../services/firestoreService';

export default function ExpenseCalendar({ groupId, expenses, onMonthChange }) {
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const data = await getMonthlyData(groupId, selectedMonth);
        setMonthlyData(data);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId && selectedMonth) {
      fetchMonthlyData();
    }
  }, [groupId, selectedMonth]);

  const navigateMonth = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + offset, 1);
    const newMonthKey = getMonthKey(newDate);
    setSelectedMonth(newMonthKey);
    onMonthChange?.(newMonthKey);
  };

  const getMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  };

  const getExpenseStats = () => {
    if (!expenses) return { count: 0, total: 0 };
    
    const { startDate, endDate } = getMonthBoundaries(selectedMonth);
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    return {
      count: monthExpenses.length,
      total: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    };
  };

  const stats = getExpenseStats();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h3 className="text-lg font-medium text-gray-900">
          {getMonthDisplay(selectedMonth)}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-semibold text-gray-900">
            ${stats.total.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.count} {stats.count === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Monthly Balance</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mt-1"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-semibold text-gray-900">
                ${monthlyData?.totalExpenses.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {monthlyData?.settlements?.length || 0} settlements
              </p>
            </>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Activity Summary</h4>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : stats.count === 0 ? (
          <p className="text-sm text-gray-500">
            No expenses recorded for this month
          </p>
        ) : (
          <div className="text-sm text-gray-600 space-y-1">
            <p>• {stats.count} expenses recorded</p>
            <p>• Average expense: ${(stats.total / stats.count).toFixed(2)}</p>
            {monthlyData?.settlements?.length > 0 && (
              <p>• {monthlyData.settlements.length} settlements made</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 