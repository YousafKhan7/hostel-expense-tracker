import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAmount, getMonthKey } from '../../utils/ExpenseSchema';
import ShareDetailsModal from './ShareDetailsModal';
import CategoryFilter from '../Category/CategoryFilter';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

export default function ExpenseList({ expenses, members, groupId }) {
  const { user } = useAuth();
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  // Load categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [groupId]);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      // Query for group-specific categories
      const categoryQuery = query(
        collection(db, 'categories'),
        where('groupId', '==', groupId)
      );
      
      const querySnapshot = await getDocs(categoryQuery);
      const categoriesObj = {};
      
      querySnapshot.docs.forEach(doc => {
        categoriesObj[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });
      
      setCategories(categoriesObj);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setLoading(false);
    }
  };

  // Filter expenses by category if filter is active
  const filteredExpenses = categoryFilter 
    ? expenses.filter(expense => expense.category === categoryFilter)
    : expenses;

  // Group expenses by month
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
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
    try {
      let dateObj;
      
      // Handle different date formats
      if (!date) {
        console.error('Null or undefined date provided to formatDate');
        return 'Invalid Date';
      }
      
      // Handle Firestore Timestamp
      if (typeof date === 'object' && date.seconds !== undefined && date.nanoseconds !== undefined) {
        dateObj = new Date(date.seconds * 1000);
      }
      // Handle Date object
      else if (date instanceof Date) {
        dateObj = new Date(date);
      }
      // Handle ISO string
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      }
      // Handle other objects with toDate method (like Firestore Timestamp)
      else if (typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      }
      // Fallback
      else {
        dateObj = new Date(date);
      }
      
      // Validate the date
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date in formatDate:', { originalDate: date, parsedDate: dateObj });
        return 'Invalid Date';
      }
      
      // Format the date
      return dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err, { date });
      return 'Invalid Date';
    }
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

  // Get category display for an expense
  const getCategoryDisplay = (expense) => {
    if (!expense.category || !categories[expense.category]) {
      return null;
    }

    const category = categories[expense.category];
    return (
      <div 
        className="flex items-center text-xs px-2 py-1 rounded-full"
        style={{ 
          backgroundColor: `${category.color}20`, // Add transparency
          color: category.color 
        }}
      >
        <span className="mr-1">{category.icon}</span>
        <span>{category.name}</span>
      </div>
    );
  };

  const handleFilterChange = (categoryId) => {
    setCategoryFilter(categoryId);
  };

  return (
    <div>
      {/* Category filter */}
      <div className="mb-6">
        <CategoryFilter 
          groupId={groupId}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* No expenses message */}
      {sortedMonths.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {categoryFilter 
              ? 'No expenses found in this category' 
              : 'No expenses yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {categoryFilter 
              ? 'Try selecting a different category or clear the filter'
              : 'Get started by adding a new expense'}
          </p>
          {categoryFilter && (
            <div className="mt-3">
              <button
                onClick={() => setCategoryFilter(null)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expense list by month */}
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
                                <div className="mt-1 flex items-center flex-wrap">
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
                                  
                                  {getCategoryDisplay(expense) && (
                                    <div className="mt-1 sm:mt-0 sm:ml-2">
                                      {getCategoryDisplay(expense)}
                                    </div>
                                  )}
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
      </div>

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