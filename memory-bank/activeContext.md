# Active Development Context

## Current Phase
Phase 1 - Core Features & Expense Splitting

## Current Step
Step 2.8 - Expense Categories Implementation

## Current Objectives
1. Design and implement expense category system
2. Create UI for category selection in ExpenseForm
3. Add category-based filtering and organization

## Active Components
- ExpenseForm.jsx (Adding category selection)
- ExpenseList.jsx (Adding category filtering)
- CategorySelector.jsx (New component needed)
- CategoryFilter.jsx (New component needed)

## Technical Considerations
1. Category Data Structure
   - Category name
   - Category icon/color
   - Category type (fixed/custom)
   - Parent category (for subcategories)

2. Database Updates
   - Add categories collection
   - Update expense document structure
   - Add category references

3. UI/UX Requirements
   - Category selection dropdown
   - Category creation modal
   - Category management interface
   - Visual indicators for categories

## Questions to Address
1. Should categories be group-specific or global?
2. How to handle default categories?
3. Should we allow category hierarchies?
4. How to handle category statistics?

## Next Steps
1. Create category data model
2. Implement category selection UI
3. Add category filtering
4. Update expense display with categories

## Dependencies
- Firestore database structure
- Expense component updates
- UI component library for icons

## Notes
- Consider using a predefined set of icons
- Plan for future category statistics
- Consider category-based reporting features 