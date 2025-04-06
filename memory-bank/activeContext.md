# Active Development Context

## Current Phase: Phase 1 - Core Group Features & Expense Splitting
**Mode**: IMPLEMENT
**Step**: 1.3 - Enhance Expense Functionality

### Current Objectives
1. Implement split member selection
2. Add split type options (equal/custom)
3. Add split amount validation

### Active Components
- GroupPage.jsx
- ExpenseForm.jsx (to be created)
- ExpenseSplitSelector.jsx (to be created)

### Technical Considerations
- Need to handle different split types
- Validate split amounts match total
- Real-time updates for split changes
- UI/UX for split member selection
- Performance with larger member lists

### Next Steps
1. Create ExpenseForm component with split options
2. Implement member selection in splits
3. Add split type selector
4. Add split amount validation

### Questions/Decisions
- How to handle uneven splits?
- Should we allow percentage-based splits?
- How to display split information in expense list?
- Should we allow split templates?

### Resources
- Firestore expense structure
- Split calculation patterns
- Member selection UI patterns
- Existing expense components 