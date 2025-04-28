# Active Development Context

## Current Phase
Phase 1 - Core Features & Balance Management

## Current Focus
Balance Management System Implementation

## Detailed Requirements Analysis
1. Member Removal/Leave System
   - Admin can remove members
   - Members can leave group
   - Both actions blocked if member has unsettled balance
   - Proper cleanup of member data
   - Clear error messages

2. Balance Adjustment System
   - Admin-only feature
   - Can modify balances with comments
   - Track adjustment history
   - Settlement functionality
   - Offline payment tracking

## Component Structure
1. MemberList.jsx (Enhancement)
   - Remove member button (admin)
   - Leave group button (member)
   - Balance verification
   - Confirmation modals

2. BalanceAdjustment.jsx (New)
   - Amount input
   - Comment input
   - Type selection (Add/Deduct)
   - Member selection
   - Submit controls

3. AdjustmentHistory.jsx (New)
   - List of adjustments
   - Comment display
   - Date and amount
   - Admin actions

4. SettlementControls.jsx (New)
   - Settlement marking
   - Balance verification
   - Confirmation flow

## Data Model Updates
1. Adjustments Collection (New)
```javascript
{
  id: string,
  groupId: string,
  memberId: string,
  adminId: string,
  amount: number,
  type: 'ADD' | 'DEDUCT',
  comment: string,
  createdAt: timestamp
}
```

2. Group Members (Update)
```javascript
members: {
  [userId]: {
    role: string,
    joinedAt: timestamp,
    balance: number,
    lastAdjustment: timestamp
  }
}
```

## Implementation Order
1. Member Management
2. Balance Adjustment
3. History Tracking
4. Settlement Controls
