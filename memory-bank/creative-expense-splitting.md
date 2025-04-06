# Expense Splitting Design Decisions

## Data Model

### Expense Document Structure
```javascript
{
  id: string,
  groupId: string,
  description: string,
  amount: number,
  paidBy: string, // userId
  splitAmong: string[], // array of userIds
  splitType: 'EQUAL' | 'CUSTOM', // for future custom split ratios
  shares: {
    [userId: string]: number // for future custom split amounts
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## UI/UX Decisions

### Expense Creation Flow
1. User clicks "Add Expense" button
2. Modal opens with form
3. User enters amount and description
4. By default, expense is split equally among all group members
5. (Future) Option to select specific members or custom split ratios

### Balance Display
1. Show individual balances in group view
2. Color coding for positive/negative balances
3. Simplified view of who owes whom
4. Quick actions for settlement

## Implementation Approach

### Phase 1 (MVP)
1. Equal splits only
2. All group members included in split
3. Basic balance calculation
4. Simple balance display

### Phase 2 (Future)
1. Custom split ratios
2. Select specific members for split
3. Percentage-based splits
4. Split templates

## Technical Considerations

### Real-time Updates
- Use Firestore listeners for live balance updates
- Batch updates for performance
- Handle concurrent modifications

### Calculations
- Store amounts in cents/smallest currency unit
- Round splits to 2 decimal places
- Handle remainder amounts

### Error Handling
1. Validate total split amount matches expense
2. Ensure all selected members are in group
3. Prevent negative amounts
4. Handle offline scenarios

## User Experience Goals
1. Make splitting intuitive
2. Minimize clicks for common actions
3. Clear visibility of balances
4. Easy settlement process

## Testing Strategy
1. Unit tests for calculations
2. Integration tests for Firestore
3. UI tests for common flows
4. Edge case validation 