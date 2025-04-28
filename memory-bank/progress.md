# Development Progress

## Current Focus
- Balance Management System Implementation
  - Admin balance control
  - Member removal enhancement
  - Leave group functionality
  - Balance adjustment tracking

## In Progress
- Member Management Enhancement
  - [ ] Member removal UI
  - [ ] Leave group functionality
  - [ ] Balance verification
  - [ ] Data cleanup process

- Admin Balance Controls
  - [ ] Balance adjustment interface
  - [ ] Comment system
  - [ ] Settlement controls
  - [ ] History tracking

## In Progress
- Group Management
  - Create new groups
  - Join existing groups via invite code
  - Member role management (admin/member)
  - Member list display with user info
    - Proper user inclusion in splits

## In Progress
- Monthly Calendar System Implementation
  - Core System Design:
    - [x] UTC timestamp storage
    - [x] Local timezone display
    - [x] Month-based filtering
    - [x] Continuous balance tracking
  - Data Structure Updates:
    - [x] MonthlyData collection design
    - [x] UserSettings schema
    - [x] Expense schema updates
  - UI Components:
    - [x] ExpenseCalendar development
    - [x] Enhanced expense display
    - [x] Share details modal
  - Next Features:
    - [x] Monthly report generation
      - [x] PDF report design
      - [x] Member summaries
      - [x] Expense details table
      - [x] Report storage in Firebase
    - [x] Email notifications
      - [x] Notification preferences UI
      - [x] Email service implementation
      - [x] Firebase Cloud Functions setup
    - [x] Expense categories
      - [x] Category management UI
      - [x] Default categories
      - [x] Category selection in expense form
      - [x] Category filtering and display
    - [ ] Monthly totals export
- [ ] add group categories
- [ ] add expense attachments

## Next
1.  Monthly System Phases:
    - [x] Phase 1: Core date handling and filtering
    - [x] Phase 2: Enhanced UI and user details
    - [x] Phase 3: Report generation and export
    - [x] Phase 4: Email notifications

2.  Additional Features:
    - [x] Expense categories
    - [ ] Expense attachments
    - [ ] Enhanced filtering and sorting
    - [ ] Group Categories
## Technical Implementation Decisions
1. Date Handling:
   - [x] Store all timestamps in UTC
   - [x] Display in user's local timezone
   - [ ] Future support for group timezones

2. Balance Management:
   - [x] No manual balance adjustments
   - [x] Automatic monthly transitions
   - [x] Continuous balance calculation

3. Notification System:
   - [x] User-configurable preferences
   - [x] Multiple notification types
   - [x] Flexible delivery options
   - [x] Firebase Cloud Functions for processing
   

## Testing Status
- Manual testing of core features complete. including group member removal.
- Need automated tests for:
  - Balance calculation
    - Split validation
  - Custom split functionality
  - Monthly transitions
  - Email notifications
  - User authentication
  - Group management
  - Date handling and timezone logic

## Technical Debt
- Optimize database queries for member profiles
- Add error boundaries
- Implement comprehensive input validation
- Add loading states for async operations
- Improve error handling and user feedback
- Add unit tests for split calculations
- Ensure email delivery reliability
- Handle timezone edge cases ✓
- Implement proper data indexing
- Add performance monitoring

## Known Issues
- Large member lists may cause performance issues
- Settlement calculations may have minor rounding differences
- Need to handle offline state better
- Month transition edge cases need consideration
- ✓ Fixed: Date parsing issues in expense creation
- ✓ Fixed: Timezone handling issues in date validation
- New expense notifications not being sent - email service not called during expense creation
- Members cannot leave groups - functionality not implemented

## Next Actions
1. Update MemberList component with removal controls
2. Create BalanceAdjustment component
3. Implement adjustment history tracking
4. Add admin settlement controls
5. Create MonthlyData collection structure
6. Update expense schema with proper date fields ✓
7. Implement basic month-based filtering
8. Enhance expense display with user details
9. Add share details modal
10. Set up email notification foundation

## Recent Updates
1. Fixed date handling issues in expense creation:
   - Improved date parsing in ExpenseSchema.js validateExpense function
   - Added robust date validation and normalization
   - Enhanced error handling and logging for date-related issues
   - Implemented fallback behavior for invalid dates
   - Fixed timezone inconsistencies by ensuring consistent noon time setting

2. Fixed frontend date display issues:
   - Improved date input handling with proper formatting
   - Fixed date string formatting for HTML date input
   - Added comprehensive date validation and error handling
   - Enhanced debug logging for date-related issues
   - Ensured consistent date format across all components
   - Fixed date parsing for different input formats

3. Implemented Monthly Report Generation:
   - Created MonthlyReport component with HTML-to-PDF approach
   - Replaced jsPDF with html2pdf.js for more reliable PDF generation
   - Added report template with styled tables and sections
   - Implemented member expense summaries and balances
   - Created chronological expense listing with formatting
   - Added report service functions for future Firebase storage
   - Fixed module loading issues:
     - ✓ Changed from dynamic imports to static imports for html2pdf.js
     - ✓ Properly installed html2pdf.js dependency
     - ✓ Implemented lazy loading for the MonthlyReport component
     - ✓ Added proper error handling for PDF generation
   - Enhanced PDF formatting:
     - ✓ Improved table styling for better readability
     - ✓ Fixed pagination to prevent table breaks
     - ✓ Added proper margins and spacing
     - ✓ Implemented more professional color scheme
   - Added Report Storage:
     - ✓ Integrated Firebase Storage for saving reports
     - ✓ Created reportService.js with save/retrieve/delete functions
     - ✓ Updated MonthlyReport component to check for existing reports
     - ✓ Added UI for viewing saved reports vs. generating new ones
     - ✓ Implemented appropriate error handling and loading states
     - ✓ Added reportUrl to monthlyData documents for persistence

4. Implemented Email Notification System:
   - Created email service with functions for different notification types:
     - New expense notifications
     - Settlement notifications
     - Monthly summary notifications
     - Balance alert notifications
   - Added notification queue for Firebase processing
   - Implemented user notification preferences:
     - Toggle controls for different notification types
     - Email frequency settings (immediate, daily, weekly)
   - Created user settings page with notification management
   - Added route to access settings from dashboard
   - Set up Firebase Cloud Functions for email delivery:
     - ✓ Created functions directory with necessary configuration
     - ✓ Implemented email sending functionality with Nodemailer
     - ✓ Added notification queue processing on document create
     - ✓ Created scheduled functions for daily and weekly digest emails
     - ✓ Implemented HTML email templates for different notification types
     - ✓ Added error handling and retry mechanisms
     - ✓ Integrated with MonthlyReport for report sharing

5. Implemented Expense Categories:
   - Created CategoryManager component for CRUD operations:
     - Default category creation for new groups
     - Category customization with colors and icons
     - Category editing and deletion
   - Added CategorySelector component for expense form:
     - Integrated category selection in expense creation
     - Visual display with icons and colors
   - Implemented category filtering in expense lists:
     - Created CategoryFilter component
     - Added category display in expense items
     - Filter expenses by selected category
   - Added dedicated Categories tab in GroupPage:
     - Tab-based interface for group features
     - Separated expenses, categories, and reports

6. Enhanced User Profile and Settings:
   - Added application-wide Header component with:
     - App navigation
     - User profile menu
     - Logout functionality
   - Fixed notification settings issues:
     - Corrected authentication state access
     - Properly handled user session state
     - Improved error handling for unauthenticated users
   - Implemented Profile Settings:
     - Display name update functionality
     - User profile management
     - Firestore profile synchronization
   - Added Account Settings:
     - Email address update
     - Password change functionality
     - Secure reauthentication flow
     - Proper validation and error handling
   - Improved user experience:
     - Success/error feedback
     - Form validation
     - Security best practices
     - Consistent UI styling

7. UI Improvements and Branding:
   - Updated application name to "SplitIt"
   - Enhanced password fields with show/hide functionality:
     - Added to login page
     - Added to signup page
     - Added to account settings
   - Improved dropdown menu in header:
     - Added outside click detection to close menu
     - Removed duplicate settings button
   - Streamlined dashboard interface:
     - Removed redundant settings button
     - Improved visual organization
     - Enhanced mobile responsiveness
   - Enhanced form security and usability:
     - Password visibility toggling for better user experience
     - Proper validation feedback on forms
     - Consistent styling across all password fields

8. Security Enhancements:
   - Improved account security:
     - Removed pre-filled current password fields in settings
     - Required current password verification for email updates
     - Required current password verification for password changes
     - Added proper validation for all security-sensitive operations
   - Implemented password recovery:
     - Added "Forgot Password" functionality to login page
     - Integrated Firebase password reset email service
     - Added user feedback for password reset process
     - Implemented proper error handling for password reset
   - Enhanced authentication flow:
     - Proper reauthentication for sensitive operations
     - Clear error messages for authentication failures
     - Secure handling of user credentials 

9. Group Member Management Fixes:
   - Fixed admin member removal permissions:
     - Changed member removal button visibility to allow any admin to remove members
     - Previously only the group creator could remove members, even if other users had admin roles
   - Added balance checking for group leaving:
     - Prevented members from leaving a group with unsettled balances
     - Added balance verification using BalanceCalculator utility
     - Implemented clear error message when trying to leave with unsettled balance
     - Required settling all debts before leaving a group
   - Enhanced user experience:
     - Added proper error handling for group exit process
     - Implemented secure data cleanup when removing/leaving groups 
