# Hostel Expense Tracker

A web application for tracking shared expenses in hostels. Built with React, Firebase, and Tailwind CSS.

## Features

- User authentication (signup/login)
- Create and manage expense groups
- Add and track expenses within groups
- Real-time updates using Firebase
- Responsive design

## Tech Stack

- React + Vite
- Firebase (Authentication & Firestore)
- Tailwind CSS
- React Router

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Setup

1. Clone the repository
```bash
git clone [repository-url]
cd hostel-app
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server
```bash
npm run dev
```

## Project Structure

```
src/
├── components/         # Reusable UI components
├── contexts/          # React contexts
├── pages/            # Route components
├── services/         # External service configs
└── App.jsx          # Main component
```

## Firebase Setup

1. Create a new Firebase project
2. Enable Email/Password authentication
3. Create a Firestore database
4. Add your Firebase configuration to `.env`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 