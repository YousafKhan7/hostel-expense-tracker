// ExpenseSchema.js
// Defines the structure and validation for expenses in the system

/**
 * Validates and formats an expense object before saving to Firestore
 * @param {Object} expenseData - The expense data to validate
 * @returns {Object} - The validated and formatted expense data
 * @throws {Error} - If validation fails
 */
export function validateExpense(expenseData) {
  console.log('Validating expense data:', expenseData);

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
  console.log('Validating expense date:', {
    originalDate: expenseDate,
    type: typeof expenseDate,
    isDate: expenseDate instanceof Date
  });

  let parsedDate;
  if (expenseDate instanceof Date) {
    parsedDate = new Date(expenseDate);
  } else if (typeof expenseDate === 'string') {
    // Create date at noon to avoid timezone issues
    const [year, month, day] = expenseDate.split('-').map(Number);
    parsedDate = new Date(year, month - 1, day, 12, 0, 0);
  } else {
    parsedDate = new Date();
  }

  console.log('Parsed date:', {
    parsedDate,
    time: parsedDate.getTime(),
    isValid: !isNaN(parsedDate.getTime())
  });

  if (isNaN(parsedDate.getTime())) {
    console.error('Invalid date:', {
      originalDate: expenseDate,
      parsedDate,
      error: 'Invalid date format'
    });
    throw new Error('Invalid date format. Please use YYYY-MM-DD');
  }

  // Set time to noon to avoid timezone issues
  parsedDate.setHours(12, 0, 0, 0);

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
  console.log('Generated month key:', {
    date: parsedDate,
    monthKey,
    month: parsedDate.getMonth() + 1,
    year: parsedDate.getFullYear()
  });

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

  console.log('Formatted expense:', formattedExpense);
  return formattedExpense;
}

/**
 * Generates a month key in YYYY-MM format for an expense
 * @param {Date|Timestamp} date - The date to generate the key for
 * @returns {string} - The month key in YYYY-MM format
 */
export function getMonthKey(date) {
  console.log('Generating month key for date:', date);
  
  let d;
  if (date && typeof date === 'object') {
    // Handle Firestore Timestamp
    if (date.seconds !== undefined && date.nanoseconds !== undefined) {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date);
    }
  } else {
    d = new Date();
  }

  if (isNaN(d.getTime())) {
    console.error('Invalid date in getMonthKey:', { originalDate: date, parsedDate: d });
    return '';
  }

  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  console.log('Generated key:', key);
  return key;
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
  console.log('Getting month boundaries for:', monthKey);
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  
  console.log('Month boundaries:', {
    monthKey,
    startDate,
    endDate,
    year,
    month
  });
  
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