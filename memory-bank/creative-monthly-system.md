# Monthly System Design Decisions

## 1. Expense Date Handling
- Store all timestamps in UTC (Firestore default)
- Display in user's local timezone by default
- Future enhancement: Add group-specific timezone setting
- Implement date filtering based on local midnight boundaries

## 2. Balance Management
### Core Principles
- No manual balance adjustments allowed
- All balances calculated from transaction history
- Maintain continuous expense stream with date filtering

### Implementation Details
1. Overall Balance
   - Always show cumulative total from all transactions
   - Calculate based on all unsettled expenses/payments
   - Visible regardless of month filter

2. Monthly View
   - Filter expenses by selected month
   - Show monthly activity starting from zero
   - Display monthly change in balances
   - Keep cumulative balance visible separately

## 3. Monthly Reports
### Required Components
1. Header Information
   - Period (Month/Year)
   - Group name and details
   - Total group spending

2. Financial Summary
   - Total group spending for the month
   - Individual member contributions
   - Balance changes for each member
   - Settlement payments recorded

3. Detailed Information
   - Chronological list of expenses
   - Category-wise breakdown (future)
   - Member-wise spending analysis

### Report Generation
- Generate on-demand and month-end
- Store report data for quick access
- Allow PDF export option

## 4. Email Notification System
### Configuration Options
1. User Preferences
   - Store in userSettings collection
   - Individual toggles for different notification types
   - Group-specific settings

2. Notification Types
   - New expense added
   - Settlement recorded
   - Monthly summary
   - Balance threshold alerts

### Technical Implementation
1. Backend
   - Use Firebase Cloud Functions
   - Trigger on Firestore events
   - Integrate with email service (SendGrid/Mailgun)

2. Delivery Rules
   - Check user preferences before sending
   - Rate limiting for notifications
   - Batch similar notifications

## 5. Data Structure
```typescript
interface MonthlyData {
  month: string;            // YYYY-MM format
  groupId: string;
  totalSpent: number;
  expenses: ExpenseRef[];   // References to expense documents
  memberBalances: {
    [userId: string]: {
      startBalance: number;
      endBalance: number;
      totalPaid: number;
    }
  };
  settlements: SettlementRef[];
  reportGenerated: boolean;
  reportUrl?: string;
}

interface UserSettings {
  userId: string;
  notifications: {
    newExpense: boolean;
    settlements: boolean;
    monthlySummary: boolean;
    balanceAlerts: boolean;
  };
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  timezone?: string;        // For future use
}
```

## 6. Performance Considerations
1. Caching
   - Cache monthly calculations
   - Store pre-calculated balances
   - Update on new transactions

2. Query Optimization
   - Index by date ranges
   - Batch load monthly data
   - Paginate expense lists

## 7. Migration Strategy
1. Initial Implementation
   - Add date fields to expenses
   - Set up monthly data structure
   - Implement basic filtering

2. Future Enhancements
   - Group timezone support
   - Advanced reporting
   - Notification system 