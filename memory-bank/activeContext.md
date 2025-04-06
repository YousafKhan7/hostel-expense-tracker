# Active Development Context

## Current Phase: Phase 1 - Expense Splitting & Balance Calculation
**Mode**: IMPLEMENT
**Step**: 1 - Enhance Expense Functionality & Data Model

### Current Objectives
1. Update expense data model in Firestore
2. Modify expense creation form
3. Implement split calculation logic

### Active Components
- GroupPage.jsx
- Modal.jsx (for expense creation)
- Firestore expense collection

### Technical Considerations
- Firestore data structure updates
- Real-time updates for expense splits
- UI/UX for split selection
- Data validation and error handling

### Next Steps
1. Update Firestore expense schema
2. Modify expense creation form
3. Implement default split logic
4. Test with multiple group members

### Questions/Decisions
- Should we allow custom split ratios in MVP?
- How to handle decimal places in split calculations?
- Should we show split details in the expense list?

### Resources
- Firebase Firestore documentation
- React component library
- Existing expense tracking logic 