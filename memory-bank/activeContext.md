# Active Development Context

## Current Phase
Phase 1 - Core Features & Expense Splitting

## Current Step
Step 2.7 - Custom Split Implementation

## Current Objectives
1. Design and implement custom split UI
2. Add custom split amount validation
3. Update expense creation flow for custom splits

## Active Components
- ExpenseForm.jsx (Adding custom split UI)
- SplitTypeSelector.jsx (Enhancing split type options)
- CustomSplitInput.jsx (New component needed)
- ExpenseSummary.jsx (Update for custom splits)

## Technical Considerations
1. Split Amount Validation
   - Ensure total equals expense amount
   - Handle rounding differences
   - Real-time validation feedback

2. UI/UX Requirements
   - Intuitive amount input for each member
   - Clear total/remaining amount display
   - Visual feedback for validation
   - Easy switching between split types

3. Data Structure
   - Update expense document structure
   - Store custom split amounts
   - Handle percentage vs fixed amounts

## Questions to Address
1. Should we support both fixed amounts and percentages?
2. How to handle rounding differences?
3. Should we allow uneven splits by default?
4. How to handle member changes after split?

## Next Steps
1. Create CustomSplitInput component
2. Implement split amount validation
3. Update expense creation flow
4. Add split type switching logic

## Dependencies
- ExpenseForm component
- Balance calculation system
- Member selection system

## Notes
- Consider UX for large member groups
- Plan for future split types
- Consider mobile-friendly input methods 