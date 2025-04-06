# Active Development Context

## Current Phase: Phase 1 - Core Group Features & Expense Splitting
**Mode**: IMPLEMENT
**Step**: 1.2 - Member Display

### Current Objectives
1. Add member display with emails/names
2. Implement member role management
3. Create member list UI

### Active Components
- GroupPage.jsx
- New components needed:
  - MemberList.jsx
  - MemberCard.jsx

### Technical Considerations
- Need to fetch user profiles for member display
- Consider caching member data for performance
- Real-time updates for member list
- UI/UX for member roles and permissions

### Next Steps
1. Create MemberList component
2. Fetch user profiles for members
3. Add member role indicators
4. Implement member management UI

### Questions/Decisions
- How to handle member profile data storage?
- What member roles do we need?
- How to display member status?
- Should we show member join dates?

### Resources
- Firebase Authentication docs
- Firestore security rules
- User profile data structure
- Existing group structure 