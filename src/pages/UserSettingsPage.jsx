import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationSettings from '../components/Settings/NotificationSettings';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

/**
 * User settings page component
 */
export default function UserSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');
  
  // Profile settings state
  const [displayName, setDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Account settings state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setNewEmail(user.email || '');
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Define available tabs
  const tabs = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' }
  ];

  // Switch between tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      // Update display name in Firebase Auth
      await updateProfile(user, { displayName });
      
      // Update display name in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: displayName });
      
      setProfileSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Update email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');

    try {
      if (!currentPassword) {
        setAccountError('Please enter your current password to update email.');
        setAccountLoading(false);
        return;
      }

      if (!newEmail) {
        setAccountError('Please enter a new email address.');
        setAccountLoading(false);
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      
      // Update email in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { email: newEmail });
      
      setAccountSuccess('Email updated successfully!');
      setCurrentPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setAccountSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        setAccountError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setAccountError('Email already in use by another account.');
      } else if (error.code === 'auth/invalid-email') {
        setAccountError('Invalid email format.');
      } else {
        setAccountError('Failed to update email. Please try again.');
      }
    } finally {
      setAccountLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');

    try {
      if (!currentPassword) {
        setAccountError('Please enter your current password.');
        setAccountLoading(false);
        return;
      }

      if (!newPassword) {
        setAccountError('Please enter a new password.');
        setAccountLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setAccountError('New passwords do not match.');
        setAccountLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setAccountError('Password should be at least 6 characters long.');
        setAccountLoading(false);
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setAccountSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setAccountSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setAccountError('Incorrect password. Please try again.');
      } else {
        setAccountError('Failed to update password. Please try again.');
      }
    } finally {
      setAccountLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Settings</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* User settings content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User information sidebar */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 h-fit">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <span className="text-3xl text-indigo-600">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              {user?.displayName || 'User'}
            </h2>
            
            <p className="text-sm text-gray-500">
              {user?.email || 'No email provided'}
            </p>
            
            <div className="mt-4 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium">
                  {user?.metadata?.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString() 
                    : 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Login</span>
                <span className="font-medium">
                  {user?.metadata?.lastSignInTime 
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString() 
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings content */}
        <div className="md:col-span-2">
          {activeTab === 'notifications' && <NotificationSettings />}
          
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Update your profile information
              </p>
              
              {profileError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">
                  {profileSuccess}
                </div>
              )}
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter your display name"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${profileLoading
                      ? 'bg-indigo-300 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                  >
                    {profileLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Manage your account preferences
              </p>
              
              {accountError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {accountError}
                </div>
              )}

              {accountSuccess && (
                <div className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">
                  {accountSuccess}
                </div>
              )}
              
              <div className="space-y-6">
                {/* Email update section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Email Address</h4>
                  <form onSubmit={handleUpdateEmail} className="space-y-3">
                    <div>
                      <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                        New Email
                      </label>
                      <input
                        type="email"
                        id="newEmail"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter new email address"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPasswordEmail"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter your current password"
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={accountLoading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${accountLoading
                          ? 'bg-indigo-300 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                      >
                        {accountLoading ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Password update section */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Password</h4>
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter your current password"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={accountLoading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${accountLoading
                          ? 'bg-indigo-300 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                      >
                        {accountLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 