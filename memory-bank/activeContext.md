# Active Development Context

## Current Phase: Phase 1 - Expense Splitting & Balance Calculation
**Mode**: IMPLEMENT
**Step**: 1.2 - Enhance Expense Display & UI

### Current Objectives
1. Enhance expense display to show split information
2. Add member selection UI for splits
3. Implement split type selection UI

### Active Components
- GroupPage.jsx
- Modal.jsx (for expense creation)
- Expense list display

### Technical Considerations
- UI/UX for split member selection
- Split amount validation
- Real-time updates for split information
- Performance with larger member lists

### Next Steps
1. Update expense list to show split details
2. Add member selection component
3. Implement split type selector
4. Add split validation

### Questions/Decisions
- How to display split information in the expense list?
- Should we show individual shares in the main list or in a detail view?
- How to handle uneven splits in the future?
- Should we allow editing splits after creation?

### Resources
- Tailwind UI components
- Firebase Firestore documentation
- React form handling patterns
- Existing expense tracking logic 