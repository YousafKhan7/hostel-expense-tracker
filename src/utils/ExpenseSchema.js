// ExpenseSchema.js
// Defines the structure and validation for expenses in the system

/**
 * Validates and formats an expense object before saving to Firestore
 * @param {Object} expenseData - The expense data to validate
 * @returns {Object} - The validated and formatted expense data
 * @throws {Error} - If validation fails
 */
export function validateExpense(expenseData) {

  const {
    description,
    amount,
    paidBy,
    groupId,
    shares,
    splitType,
    expenseDate,
    category
  } = expenseData;

  // Basic validation
  if (!description?.trim()) throw new Error('Description is required');
  if (!amount || isNaN(amount) || amount <= 0) throw new Error('Valid amount is required');
  if (!paidBy) throw new Error('Payer information is required');
  if (!groupId) throw new Error('Group ID is required');
  if (!shares || Object.keys(shares).length === 0) throw new Error('Shares information is required');
  
  // Validate date
  let parsedDate;
  try {
    if (expenseDate instanceof Date) {
      parsedDate = new Date(expenseDate);
    } else if (typeof expenseDate === 'string') {
      // Create date at noon to avoid timezone issues
      const [year, month, day] = expenseDate.split('-').map(Number);
      if (!year || !month || !day) {
        throw new Error('Invalid date format');
      }
      parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    } else if (expenseDate && typeof expenseDate === 'object' && expenseDate.seconds) {
      // Handle Firestore timestamp
      parsedDate = new Date(expenseDate.seconds * 1000);
    } else {
      parsedDate = new Date();
    }

    // Ensure valid date
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format');
    }

    // Ensure proper time for consistent date comparison
    parsedDate.setHours(12, 0, 0, 0);
  } catch (err) {
    console.error('Date parsing error:', {
      originalDate: expenseDate,
      error: err.message
    });
    throw new Error('Invalid date format. Please use YYYY-MM-DD');
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsedDate > today) {
    console.error('Future date detected:', {
      expenseDate: parsedDate,
      today,
      difference: parsedDate - today
    });
    throw new Error('Cannot create expenses for future dates');
  }

  // Validate total shares equals amount
  const totalShares = Object.values(shares).reduce((sum, share) => sum + (share || 0), 0);
  if (Math.abs(totalShares - amount) > 0.01) {
    console.error('Share amount mismatch:', {
      totalShares,
      amount,
      difference: Math.abs(totalShares - amount)
    });
    throw new Error('Total shares must equal the expense amount');
  }

  const monthKey = getMonthKey(parsedDate);


  // Format the expense object
  const formattedExpense = {
    description: description.trim(),
    amount: Number(amount),
    paidBy,
    groupId,
    shares,
    splitType: splitType || 'equal',
    expenseDate: parsedDate,
    category: category || 'uncategorized',
    createdAt: new Date(),
    updatedAt: new Date(),
    month: monthKey,
    settled: false,
    settledAt: null
  };

  return formattedExpense;
}

/**
 * Generates a month key in YYYY-MM format for an expense
 * @param {Date|Timestamp} date - The date to generate the key for
 * @returns {string} - The month key in YYYY-MM format
 */
export function getMonthKey(date) {
  try {
    let d;
    
 
    
    if (!date) {
      // Default to current date if no date provided
      d = new Date();
      console.warn('No date provided to getMonthKey, using current date');
    } else if (typeof date === 'string') {
      // Handle ISO string dates
      // If it's a date string in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        d = new Date(date);
      }
    } else if (date instanceof Date) {
      // Handle Date objects
      d = new Date(date);
    } else if (typeof date === 'object') {
      // Handle Firestore Timestamp
      if (date.seconds !== undefined && date.nanoseconds !== undefined) {
        d = new Date(date.seconds * 1000);
      } else if (date.toDate && typeof date.toDate === 'function') {
        // Handle Firestore Timestamp with toDate method
        d = date.toDate();
      } else {
        // Try to convert other date-like objects
        d = new Date(date);
      }
    } else {
      // Default fallback
      d = new Date();
      console.warn('Unrecognized date format in getMonthKey:', { originalDate: date });
    }

    if (isNaN(d.getTime())) {
      console.error('Invalid date in getMonthKey:', { 
        originalDate: date, 
        parsedDate: d,
        type: typeof date,
        isDate: date instanceof Date
      });
      // Return current month as fallback
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Ensure consistent date representation by setting to noon
    d.setHours(12, 0, 0, 0);
    
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
  
    
    return key;
  } catch (err) {
    console.error('Error in getMonthKey:', { 
      originalDate: date, 
      error: err.message 
    });
    // Return current month as fallback
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

/**
 * Formats an amount for display with proper rounding
 * @param {number} amount - The amount to format
 * @returns {string} - The formatted amount
 */
export function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

/**
 * Gets the start and end dates for a given month
 * @param {string} monthKey - The month key in YYYY-MM format
 * @returns {Object} - The start and end dates for the month
 */
export function getMonthBoundaries(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  
 
  
  return { startDate, endDate };
}

/**
 * Structure for the MonthlyData collection
 */
export const monthlyDataStructure = {
  month: '', // YYYY-MM format
  groupId: '',
  totalSpent: 0,
  expenses: [], // Array of expense references
  memberBalances: {}, // userId -> { startBalance, endBalance, totalPaid }
  settlements: [], // Array of settlement references
  reportGenerated: false,
  reportUrl: null,
  createdAt: null,
  updatedAt: null
};

/**
 * Structure for the UserSettings collection
 */
export const userSettingsStructure = {
  userId: '',
  notifications: {
    newExpense: true,
    settlements: true,
    monthlySummary: true,
    balanceAlerts: false
  },
  emailFrequency: 'immediate', // 'immediate' | 'daily' | 'weekly'
  timezone: null, // For future use
  createdAt: null,
  updatedAt: null
}; 