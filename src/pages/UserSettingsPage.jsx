import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationSettings from '../components/Settings/NotificationSettings';

/**
 * User settings page component
 */
export default function UserSettingsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');

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
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              {currentUser?.displayName || 'User'}
            </h2>
            
            <p className="text-sm text-gray-500">
              {currentUser?.email || 'No email provided'}
            </p>
            
            <div className="mt-4 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium">
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                    : 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Login</span>
                <span className="font-medium">
                  {currentUser?.metadata?.lastSignInTime 
                    ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() 
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
              <div className="text-center py-8 text-gray-400">
                Profile settings coming soon
              </div>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Manage your account preferences
              </p>
              <div className="text-center py-8 text-gray-400">
                Account settings coming soon
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 