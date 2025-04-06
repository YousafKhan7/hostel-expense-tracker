# Active Development Context

## Current Phase: Phase 1 - Core Group Features & Expense Splitting
**Mode**: IMPLEMENT
**Step**: 1.3 - Split Amount Validation

### Current Objectives
1. Implement split amount validation
2. Enhance split summary display
3. Prepare for balance calculation

### Active Components
- GroupPage.jsx
- ExpenseForm.jsx
- ExpenseSplitSelector.jsx
- New components needed:
  - ExpenseSummary.jsx

### Technical Considerations
- Validate total split amount matches expense total
- Handle rounding errors in split calculations
- Real-time validation feedback
- Clear error messaging
- Performance with larger member lists

### Next Steps
1. Add split amount validation to ExpenseForm
2. Create ExpenseSummary component
3. Enhance expense display with split details
4. Prepare for balance calculation implementation

### Questions/Decisions
- How to handle rounding differences?
- Should we show individual share amounts?
- How to display validation errors?
- When to start balance calculation?

### Resources
- Firestore expense structure
- Split calculation patterns
- Validation patterns
- Existing expense components 