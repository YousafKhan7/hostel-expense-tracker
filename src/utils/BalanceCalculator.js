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
        totalSpentByMember: {},
        summary: this.createBalanceSummary({})
      };
    }

    // Initialize balances and total spent for all members
    const balances = {};
    const totalSpentByMember = {};
    Object.keys(members).forEach(memberId => {
      balances[memberId] = 0;
      totalSpentByMember[memberId] = 0;
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
      totalSpentByMember[paidBy] = (totalSpentByMember[paidBy] || 0) + amount;

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
      totalSpentByMember[memberId] = Math.round(totalSpentByMember[memberId] * 100) / 100;
    });

    // Calculate simplified settlements
    const settlements = this.calculateSettlements(balances);

    return {
      individualBalances: balances,
      settlements: settlements,
      totalExpenses: expenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0),
      totalSpentByMember,
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
    const debtors = [];
    const creditors = [];

    // Separate members into debtors and creditors
    Object.entries(balances).forEach(([memberId, balance]) => {
      if (balance < 0) {
        debtors.push({ id: memberId, amount: Math.abs(balance) });
      } else if (balance > 0) {
        creditors.push({ id: memberId, amount: balance });
      }
    });

    // Sort by amount (largest first)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Create settlements
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0) {
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(amount * 100) / 100
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

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
    const summary = {
      totalPositive: 0,
      totalNegative: 0,
      maxDebt: 0,
      maxCredit: 0,
      isSettled: true
    };

    Object.values(balances).forEach(balance => {
      if (balance > 0) {
        summary.totalPositive += balance;
        summary.maxCredit = Math.max(summary.maxCredit, balance);
      } else if (balance < 0) {
        summary.totalNegative += Math.abs(balance);
        summary.maxDebt = Math.max(summary.maxDebt, Math.abs(balance));
      }
      if (Math.abs(balance) > 0.01) {
        summary.isSettled = false;
      }
    });

    return summary;
  }
} 