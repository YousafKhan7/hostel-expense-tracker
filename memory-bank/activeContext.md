# Active Development Context

## Current Phase
Phase 1 - Core Features & Expense Splitting

## Current Step
Step 2.8 - Monthly Calendar System & UI Enhancements

## Current Objectives
1. Design and implement monthly calendar view
   - UTC timestamp storage
   - Local timezone display
   - Month-based filtering
   - Continuous balance tracking

2. Add monthly expense grouping and totals
   - No manual balance adjustments
   - Automatic balance carry-forward
   - Monthly activity summary
   - Cumulative balance display

3. Implement monthly report generation
   - Period summary
   - Total group spending
   - Individual contributions
   - Balance changes
   - Transaction list

4. Enhance expense display UI
   - Show full user details
   - Clickable member shares
   - Improved expense list

5. Add notification system foundation
   - User preferences structure
   - Basic email templates
   - Notification types definition

## Active Components
- ExpenseCalendar.jsx (New component)
  - Month selection
  - Expense filtering
  - Activity summary

- MonthlyReport.jsx (New component)
  - Report generation
  - PDF export
  - Email delivery

- ExpenseList.jsx (Updates)
  - Date-based grouping
  - Enhanced user details
  - Share details popup

- UserSettings.jsx (New component)
  - Notification preferences
  - Email frequency
  - Display settings

## Technical Considerations
1. Data Structure Updates
   - Add MonthlyData collection
   - Update Expense schema
   - Add UserSettings collection
   - Implement proper indexing

2. UI/UX Requirements
   - Clear date navigation
   - Visible total balances
   - Monthly activity summary
   - Intuitive filtering

3. Performance Optimization
   - Query optimization
   - Balance caching
   - Report pre-generation
   - Batch updates

## Implementation Phases
1. Phase 1: Core Monthly System
   - Date handling
   - Basic filtering
   - Monthly grouping

2. Phase 2: Enhanced Display
   - User details
   - Share popups
   - Activity summaries

3. Phase 3: Reporting
   - Report generation
   - PDF export
   - Email delivery

4. Phase 4: Notifications
   - User preferences
   - Email integration
   - Delivery rules

## Dependencies
- Firebase Cloud Functions
- Email service integration
- PDF generation library
- Date handling library

## Notes
- Start with local timezone display
- Implement group timezone later
- Focus on performance optimization
- Consider mobile experience
- Plan for data migration

## Questions to Address
1. How to handle ongoing expenses across months?
2. Should we allow balance adjustments between months?
3. What details to include in monthly reports?
4. How to handle timezone differences in monthly transitions?
5. Should email notifications be configurable?

## Next Steps
1. Create ExpenseCalendar component
2. Implement monthly data grouping
3. Design email notification system
4. Update expense display UI
5. Add share details modal

## Dependencies
- ExpenseList component
- User profile system
- Email service integration
- Balance calculation system

## Notes
- Consider email delivery reliability
- Plan for scalable report generation
- Consider data archival strategy
- Ensure mobile-responsive calendar
- Consider offline support for reports 