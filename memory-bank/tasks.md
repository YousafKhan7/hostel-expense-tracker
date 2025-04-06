# Project Tasks

## Phase 1: Core Features & Expense Splitting

### Step 1: User Profile & Member Management
- [x] Implement user profiles with names and emails
- [x] Display member information in groups
- [x] Show member join dates
- [x] Add member role management
- [ ] Allow removing members from groups

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
- [ ] Expense categories
- [ ] Expense attachments

### Step 3: Group Management
- [x] Create new groups
- [x] Join existing groups
- [x] Group invitation system
- [ ] Group settings
- [ ] Group categories/tags

## Current Focus
- Implementing Monthly Report Generation ✓
- Setting up Email Notification System
- Adding Expense Categories

## Next Steps
1. [x] Implement monthly calendar view
2. [x] Add monthly totals and filtering
3. [x] Enhance expense display with user details
4. [x] Add member share details popup
5. [x] Implement monthly report generation
   - [x] PDF generation with jsPDF
   - [x] Report layout and design
   - [x] Member summary section
   - [x] Detailed expense listing
6. [ ] Set up email notification system
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