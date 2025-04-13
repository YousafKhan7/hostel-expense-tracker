# Hostel Expense Tracker - Project Overview

## Current State

### Core Features Implemented
1. **User Authentication**
   - Email/password signup and login
   - Email verification
   - Protected routes

2. **Group Management**
   - Create expense groups
   - View list of groups
   - Real-time updates using Firestore

3. **Basic Expense Tracking**
   - Add expenses to groups
   - Track amount and description
   - Show who paid
   - Real-time expense updates

### Tech Stack
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase
  - Authentication
  - Firestore Database
- **State Management**: React Context
- **Routing**: React Router

### Project Structure
```
src/
├── components/         # Reusable UI components
│   └── Common/
│       └── Modal.jsx  # Reusable modal component
├── contexts/
│   └── AuthContext.jsx # Authentication context
├── pages/
│   ├── SignupPage.jsx    # User registration
│   ├── LoginPage.jsx     # User login
│   ├── DashboardPage.jsx # Groups listing
│   └── GroupPage.jsx     # Group expenses
├── services/
│   └── firebaseConfig.js # Firebase setup
└── App.jsx           # Main component
```

## Development Phases

### Phase 1: Expense Splitting (Current)
- Enhancing expense model
- Implementing split calculations
- Adding balance display.
- **Member Removal**: completed

### Phase 2: Group Management
- Member display
- Invite system
- Group Categories
- Permissions management

### Phase 3: Settlement
- Payment recording
- Settlement flow
- Transaction history

## Current Data Models

### Users (Firebase Auth)
- Email/password authentication
- User profiles (future)

### Groups Collection
```javascript
{
  id: string,
  name: string,
  members: string[], // userIds
  createdAt: timestamp,
  createdBy: string // userId
}
```

### Expenses Collection (Current)
```javascript
{
  id: string,
  groupId: string,
  description: string,
  amount: number,
  paidBy: string, // userId
  createdAt: timestamp
}
```

### Expenses Collection (Planned Update)
```javascript
{
  id: string,
  groupId: string,
  description: string,
  amount: number,
  paidBy: string, // userId
  splitAmong: string[], // array of userIds
  splitType: 'EQUAL', // future: 'CUSTOM'
  shares: {}, // future: custom split amounts
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Next Major Features
1. Expense splitting functionality
2. Balance calculations
3. Member management
4. Settlement system

## Technical Goals
1. Maintain real-time synchronization
2. Ensure data consistency
3. Optimize performance
4. Enhance user experience 