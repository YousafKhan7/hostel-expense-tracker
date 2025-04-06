import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAmount, getMonthKey } from '../../utils/ExpenseSchema';
import ShareDetailsModal from './ShareDetailsModal';

export default function ExpenseList({ expenses, members, groupId }) {
  const { user } = useAuth();
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Group expenses by month
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const monthKey = getMonthKey(expense.expenseDate);
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(expense);
    return groups;
  }, {});

  // Sort months in descending order
  const sortedMonths = Object.keys(groupedExpenses).sort().reverse();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  };

  const getMemberCount = (shares) => {
    const count = Object.keys(shares).length;
    return `${count} member${count !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-8">
      {sortedMonths.map(monthKey => (
        <div key={monthKey} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {getMonthDisplay(monthKey)}
          </h3>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {groupedExpenses[monthKey].map((expense) => {
                const paidByUser = members[expense.paidBy];
                return (
                  <li key={expense.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-800">
                                {(paidByUser?.name?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {expense.description}
                              </p>
                              <div className="mt-1 flex items-center">
                                <p className="text-sm text-gray-500">
                                  Paid by{' '}
                                  <span className="font-medium">
                                    {expense.paidBy === user.uid
                                      ? 'you'
                                      : paidByUser?.name || 'Unknown User'}
                                  </span>
                                </p>
                                <span className="mx-2 text-gray-500">&middot;</span>
                                <button
                                  onClick={() => setSelectedExpense(expense)}
                                  className="text-sm text-primary-600 hover:text-primary-500"
                                >
                                  {getMemberCount(expense.shares)}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className={`text-sm font-medium ${
                            expense.paidBy === user.uid ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            ${formatAmount(expense.amount)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(expense.expenseDate)}
                          </p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1">
                            {expense.splitType.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}

      <ShareDetailsModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        members={members}
        currentUserId={user.uid}
      />
    </div>
  );
} 