/**
 * Utility class for calculating group balances and settlements
 */
export class BalanceCalculator {
  /**
   * Calculate balances for all members in a group based on expenses
   * @param {Array} expenses - Array of expense objects
   * @param {Object} members - Object of group members
   * @returns {Object} Balance information including individual and simplified balances
   */
  static calculateBalances(expenses = [], members = {}) {
    if (!expenses || !members) {
      return {
        individualBalances: {},
        settlements: [],
        totalExpenses: 0,
        summary: this.createBalanceSummary({})
      };
    }

    // Initialize balances for all members
    const balances = {};
    Object.keys(members).forEach(memberId => {
      balances[memberId] = 0;
    });

    // Calculate raw balances from expenses
    expenses.forEach(expense => {
      // Skip invalid expenses
      if (!expense || !expense.amount || !expense.paidBy || !expense.shares) {
        console.warn('Skipping invalid expense:', expense);
        return;
      }

      const { amount, paidBy, shares } = expense;
      
      // Add the full amount to payer's balance (positive = should receive money)
      balances[paidBy] = (balances[paidBy] || 0) + amount;

      // Subtract each person's share (negative = should pay money)
      Object.entries(shares || {}).forEach(([memberId, share]) => {
        if (typeof share === 'number' && !isNaN(share)) {
          balances[memberId] = (balances[memberId] || 0) - share;
        }
      });
    });

    // Round all balances to 2 decimal places
    Object.keys(balances).forEach(memberId => {
      balances[memberId] = Math.round(balances[memberId] * 100) / 100;
    });

    // Calculate simplified settlements
    const settlements = this.calculateSettlements(balances);

    return {
      individualBalances: balances,
      settlements: settlements,
      totalExpenses: expenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0),
      summary: this.createBalanceSummary(balances)
    };
  }

  /**
   * Calculate simplified settlement transactions
   * @param {Object} balances - Individual member balances
   * @returns {Array} Array of settlement transactions
   */
  static calculateSettlements(balances) {
    const settlements = [];
    const debtors = []; // People who owe money (negative balance)
    const creditors = []; // People who should receive money (positive balance)

    // Separate members into debtors and creditors
    Object.entries(balances).forEach(([memberId, balance]) => {
      if (balance < -0.01) { // Using -0.01 to handle floating point imprecision
        debtors.push({ id: memberId, amount: -balance });
      } else if (balance > 0.01) {
        creditors.push({ id: memberId, amount: balance });
      }
    });

    // Sort by amount (largest first) to minimize number of transactions
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Calculate settlements
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      
      // Calculate transaction amount
      const amount = Math.min(debtor.amount, creditor.amount);
      
      // Round to 2 decimal places
      const roundedAmount = Math.round(amount * 100) / 100;
      
      if (roundedAmount > 0) {
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: roundedAmount
        });
      }

      // Update remaining balances
      debtor.amount -= amount;
      creditor.amount -= amount;

      // Remove settled members
      if (debtor.amount < 0.01) debtors.shift();
      if (creditor.amount < 0.01) creditors.shift();
    }

    return settlements;
  }

  /**
   * Create a summary of the balance situation
   * @param {Object} balances - Individual member balances
   * @returns {Object} Summary information
   */
  static createBalanceSummary(balances) {
    let totalPositive = 0;
    let totalNegative = 0;
    let maxDebt = 0;
    let maxCredit = 0;

    Object.values(balances).forEach(balance => {
      if (balance > 0) {
        totalPositive += balance;
        maxCredit = Math.max(maxCredit, balance);
      } else if (balance < 0) {
        totalNegative += Math.abs(balance);
        maxDebt = Math.max(maxDebt, Math.abs(balance));
      }
    });

    return {
      totalPositive: Math.round(totalPositive * 100) / 100,
      totalNegative: Math.round(totalNegative * 100) / 100,
      maxDebt: Math.round(maxDebt * 100) / 100,
      maxCredit: Math.round(maxCredit * 100) / 100,
      isSettled: Math.abs(totalPositive - totalNegative) < 0.01
    };
  }
} 