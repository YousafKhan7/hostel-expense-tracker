import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const GroupPage = lazy(() => import('./pages/GroupPage'))
const JoinGroup = lazy(() => import('./pages/JoinGroup'))
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage'))

// Loading component for Suspense fallback
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
  </div>
)

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/join" element={<JoinGroup />} />
        <Route path="/settings" element={<UserSettingsPage />} />
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </Suspense>
  )
}

export default App 