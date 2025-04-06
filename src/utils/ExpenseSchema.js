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
  const parsedDate = expenseDate ? new Date(expenseDate) : new Date();
  if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');
  if (parsedDate > new Date()) throw new Error('Cannot create expenses for future dates');

  // Validate total shares equals amount
  const totalShares = Object.values(shares).reduce((sum, share) => sum + (share || 0), 0);
  if (Math.abs(totalShares - amount) > 0.01) {
    throw new Error('Total shares must equal the expense amount');
  }

  // Format the expense object
  return {
    description: description.trim(),
    amount: Number(amount),
    paidBy,
    groupId,
    shares,
    splitType: splitType || 'equal',
    expenseDate: parsedDate, // Use the parsed date
    category: category || 'uncategorized',
    createdAt: new Date(),
    updatedAt: new Date(),
    month: getMonthKey(parsedDate), // Use the parsed date
    settled: false,
    settledAt: null
  };
}

/**
 * Generates a month key in YYYY-MM format for an expense
 * @param {Date} date - The date to generate the key for
 * @returns {string} - The month key in YYYY-MM format
 */
export function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
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