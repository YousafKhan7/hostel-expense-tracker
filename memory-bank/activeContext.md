# Active Development Context

## Current Phase
Phase 1 - Core Features & Expense Splitting
  
## Current Step
Expense Attachments
  
## Current Objectives
1. [x] add report storage functionality
   - ✓ PDF report format
   - ✓ Expense summary
   - ✓ Member contributions
   - ✓ Balance changes
   - ✓ Report storage

2. ✓ Set up notification system
   - ✓ Email service integration
   - ✓ User preferences
   - ✓ Notification templates
   - ✓ Delivery rules
   - [ ] Fix missing expense notification calls

3. ✓ Add expense categories
   - ✓ Category management
   - ✓ Category-based reporting
   - ✓ Expense filtering
   - ✓ Category statistics

4. ✓ Enhance user profile management
   - ✓ Header with user menu
   - ✓ Logout functionality 
   - ✓ Profile settings
   - ✓ Allow removing members from groups
   - ✓ Account management
   - ✓ Add group exit functionality for members
     - ✓ Balance verification before leaving
     - ✓ Admin removal permissions

5. [ ] Add expense attachments
   - [ ] File upload component
   - [ ] Firebase Storage integration
   - [ ] Image preview
   - [ ] Attachment display in expense details

## Active Components
- ✓ MonthlyReport.jsx (Updated component)
  - ✓ Report generation
  - ✓ PDF export
  - ✓ Firebase Storage integration
  - ✓ Email delivery

- ✓ NotificationSettings.jsx (New component)
  - ✓ Email preferences
  - ✓ Notification types
  - ✓ Delivery frequency

- ✓ UserSettingsPage.jsx (New component)
  - ✓ Notification settings
  - ✓ Profile settings
  - ✓ Account settings

- ✓ CategoryManager.jsx (New component)
  - ✓ Category CRUD
  - ✓ Category assignment
  - ✓ Category stats

- ✓ CategorySelector.jsx (New component)
  - ✓ Category selection for expenses
  - ✓ Visual icons and colors
  - ✓ Default category fallback

- ✓ CategoryFilter.jsx (New component)
  - ✓ Filter expenses by category
  - ✓ Clear filters
  - ✓ Category chip display

- ✓ Header.jsx (New component)
  - ✓ App navigation
  - ✓ User profile menu
  - ✓ Logout functionality

- ✓ MemberList.jsx
  - ✓ Allow removing members
  
## Technical Considerations
1. ✓ Report Generation
   - ✓ PDF library selection (html2pdf.js)
   - ✓ Report template design
   - ✓ Performance optimization
   - ✓ Data aggregation
   - ✓ Firebase Storage integration

2. ✓ Email Integration
   - ✓ Email service architecture
   - ✓ Email service provider selection (nodemailer)
   - ✓ Template system
   - ✓ Delivery tracking
   - ✓ Error handling

3. ✓ Category System
   - ✓ Data structure (Categories collection)
   - ✓ UI/UX design (color-coded, icon-based)
   - ✓ Default categories for new groups
   - ✓ Integration with expense creation

4. [] Expense Attachments
   - [] Firebase Storage integration
   - [] File type validation
   - [] Size limits
   - [] Security rules

## Implementation Phases
1. Phase 1: Core Monthly System
   - Date handling ✓
   - Basic filtering ✓
   - Monthly grouping ✓

2. Phase 2: Enhanced Display
   - User details ✓
   - Share popups ✓
   - Activity summaries ✓

3. Phase 3: Reporting
   - Report generation ✓
   - PDF export ✓
   - Report storage ✓
   - Email delivery ✓

4. Phase 4: Notifications
   - ✓ User preferences
   - ✓ Email integration
   - ✓ Delivery rules

## Dependencies
- ✓ Email service integration (Firebase Cloud Functions)
- ✓ PDF generation library (html2pdf.js)
- ✓ Date handling library
- ✓ Firebase Storage for reports

## Notes
- Start with local timezone display ✓
- Implement group timezone later
- Focus on performance optimization
- Consider mobile experience
- Plan for data migration
- Date handling improvements implemented ✓
- PDF report generation implemented ✓
- Email notification system implemented ✓
- Expense categories implemented ✓
- Report storage in Firebase implemented ✓
- Firebase Cloud Functions for email notifications implemented ✓
- Next: focus on expense attachments functionality

## Questions to Address
1. ✓ Which PDF library to use? (html2pdf.js)
2. ✓ How to handle large reports? (Firebase Storage)
3. ✓ What email service to integrate? (Nodemailer with Firebase Functions)
4. ✓ How to handle timezone differences in monthly transitions? (Using noon-based dates)
5. ✓ What default categories to provide? (Created a set of 10 common categories)
6. What file types should be allowed for expense attachments?
7. What should be the maximum file size for attachments?

## Next Steps
1. ✓ Research and select PDF library
2. ✓ Design report templates
3. ✓ Set up email service integration
4. ✓ Create notification preferences UI
5. ✓ Implement category system
6. ✓ Implement report storage in Firebase
7. ✓ Set up Firebase Cloud Functions for email delivery
8. [ ] Implement expense attachments feature 