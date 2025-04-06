import { useState, useEffect } from 'react';
import { getMonthKey } from '../../utils/ExpenseSchema';

export default function ExpenseCalendar({ expenses, onMonthChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [debug, setDebug] = useState('');

  useEffect(() => {
    // Notify parent of month change when currentDate changes
    const monthKey = getMonthKey(currentDate);
    console.log('Calendar month changed:', {
      currentDate,
      monthKey,
      currentMonth: currentDate.getMonth(),
      currentYear: currentDate.getFullYear()
    });
    onMonthChange(monthKey);
  }, [currentDate, onMonthChange]);

  const navigateMonth = (direction) => {
    console.log('Navigating month:', { direction, currentDate });
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      console.log('New date after navigation:', newDate);
      return newDate;
    });
  };

  // Filter expenses for current month, ensuring proper date handling
  console.log('Filtering expenses:', {
    totalExpenses: expenses.length,
    currentMonth: currentDate.getMonth(),
    currentYear: currentDate.getFullYear()
  });

  const monthExpenses = expenses.filter(expense => {
    if (!expense.expenseDate) {
      console.log('Expense missing date:', expense);
      return false;
    }

    let expenseDate;
    // Handle Firestore Timestamp
    if (expense.expenseDate.seconds !== undefined && expense.expenseDate.nanoseconds !== undefined) {
      expenseDate = new Date(expense.expenseDate.seconds * 1000);
    } else {
      expenseDate = new Date(expense.expenseDate);
    }
    
    if (isNaN(expenseDate.getTime())) {
      console.log('Invalid expense date:', {
        expense,
        parsedDate: expenseDate,
        originalDate: expense.expenseDate
      });
      return false;
    }
    
    const isMatch = expenseDate.getMonth() === currentDate.getMonth() &&
                   expenseDate.getFullYear() === currentDate.getFullYear();
    
    if (isMatch) {
      console.log('Matched expense:', {
        expenseId: expense.id,
        expenseDate,
        expenseMonth: expenseDate.getMonth(),
        expenseYear: expenseDate.getFullYear(),
        amount: expense.amount
      });
    }
    
    return isMatch;
  });

  console.log('Filtered expenses:', {
    total: expenses.length,
    filtered: monthExpenses.length,
    month: currentDate.toLocaleString('default', { month: 'long' }),
    year: currentDate.getFullYear()
  });

  // Calculate total amount with proper validation
  const totalAmount = monthExpenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) {
      console.log('Invalid expense amount:', {
        expense,
        amount: expense.amount
      });
      return sum;
    }
    return sum + amount;
  }, 0);

  console.log('Calculated totals:', {
    totalAmount,
    expenseCount: monthExpenses.length
  });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <h2 className="text-lg font-medium text-gray-900">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>

        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-semibold text-gray-900">
            ${totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Number of Expenses</p>
          <p className="text-2xl font-semibold text-gray-900">
            {monthExpenses.length}
          </p>
        </div>
      </div>
    </div>
  );
} 