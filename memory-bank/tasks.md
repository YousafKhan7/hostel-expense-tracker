# Project Tasks

## Phase 1: Core Features & Expense Splitting

### Step 1: User Profile & Member Management
- [x] Implement user profiles with names and emails
- [x] Display member information in groups
- [x] Show member join dates
- [x] Add member role management
- [x] Allow profile settings and updates
- [x] Implement account settings (email/password)
- [x] Allow removing members from groups

### Step 2: Expense Management
- [x] Basic expense creation
- [x] Split member selection
- [x] Split type selection (Equal/Custom)
- [x] Split amount validation
- [x] Balance calculation implementation
- [x] Balance display UI with settlements
- [x] Custom split implementation
- [x] Monthly Calendar System
  - [x] Month-wise expense grouping
  - [x] Monthly total calculations
  - [x] Monthly report generation
    - [x] PDF report creation
    - [x] Member summary
    - [x] Expense details
    - [ ] Report storage
  - [ ] Monthly email notifications
  - [x] Zero balance start for new months
  - [x] Robust date handling and timezone fixes
- [x] Expense UI Improvements
  - [x] Replace "Paid by you/other" with user details
  - [x] Clickable member count with share details
  - [x] Enhanced expense details view
- [x] Expense categories
- [ ] Expense attachments

### Step 3: Group Management
- [x] Create new groups
- [x] Join existing groups
- [x] Group invitation system
- [ ] add group categories
- [ ] Group settings
- [ ] Group categories/tags

## Current Focus
- Implementing Monthly Report Generation ✓
- Setting up Email Notification System ✓
- Adding Expense Categories

## Next Steps
1. [x] Implement monthly calendar view
2. [x] Add monthly totals and filtering
3. [x] Enhance expense display with user details
4. [x] Add member share details popup
5. [x] Implement monthly report generation
   - [x] PDF generation with html2pdf.js
   - [x] Report layout and design
   - [x] Member summary section
   - [x] Detailed expense listing
   - [x] Enhanced PDF formatting and pagination
6. [x] Set up email notification system
   - [x] Email service architecture
   - [x] User notification preferences
   - [x] User settings page
   - [ ] Firebase Cloud Functions implementation
7. [ ] Add expense categories and tags

## Technical Debt
- Add error boundaries for component failures
- Implement proper loading states
- Add comprehensive input validation
- Optimize database queries
- Add automated tests for:
  - Monthly calculations
  - Date handling ✓
  - Balance transitions
  - Report generation
  - Split functionality

### Features

#### Monthly Calendar System
- [x] Create basic monthly view
- [x] Display expenses per date
- [x] Add month navigation
- [x] Integrate with expense system
- [x] Add summary statistics

#### Report Generation
- [x] Create monthly report layout
- [x] Implement expense calculation logic
- [x] Add PDF export functionality
- [x] Design printer-friendly report
- [ ] Implement report saving to Firebase storage

#### Expense Categories
- [x] Design category data structure
- [x] Create category selection component
- [x] Add category filtering
- [x] Implement category management screen
- [x] Update expense form with category
- [x] Create initial set of default categories
- [x] Add color-coding for categories
- [x] Implement category-based statistics

#### Email Notifications
- [x] Set up email service
- [x] Create notification options in user settings
- [x] Design email templates
- [ ] Implement scheduled notifications
- [ ] Add immediate notifications for important events

#### User Profile Management
- [x] Add user settings page
- [x] Implement profile updates
- [x] Add account settings
- [x] Create authentication flow
- [x] Add logout functionality
- [x] Implement header with user menu 