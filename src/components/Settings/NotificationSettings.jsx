import { useState, useEffect } from 'react';
import { getUserNotificationSettings, updateUserNotificationSettings } from '../../services/emailService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component for managing user notification settings
 */
export default function NotificationSettings() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    notifications: {
      newExpense: true,
      settlements: true,
      monthlySummary: true,
      balanceAlerts: false
    },
    emailFrequency: 'immediate',
  });

  // Fetch user settings on component mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        setError('');

        if (!currentUser) {
          setLoading(false);
          return;
        }

        const userSettings = await getUserNotificationSettings(currentUser.uid);
        setSettings({
          notifications: {
            ...userSettings.notifications
          },
          emailFrequency: userSettings.emailFrequency
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading notification settings:', err);
        setError('Failed to load notification settings. Please try again.');
        setLoading(false);
      }
    }

    fetchSettings();
  }, [currentUser]);

  // Handle notification toggle changes
  const handleNotificationToggle = (notificationType) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [notificationType]: !settings.notifications[notificationType]
      }
    });
  };

  // Handle frequency changes
  const handleFrequencyChange = (e) => {
    setSettings({
      ...settings,
      emailFrequency: e.target.value
    });
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!currentUser) {
        setError('You must be logged in to save settings.');
        setSaving(false);
        return;
      }

      await updateUserNotificationSettings(currentUser.uid, settings);
      
      setSuccess('Notification settings saved successfully!');
      setSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save notification settings. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
      <p className="text-sm text-gray-500 mt-1">
        Choose which notifications you want to receive
      </p>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
          {success}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox"
              className="rounded text-indigo-600 focus:ring-indigo-500"
              checked={settings.notifications.newExpense}
              onChange={() => handleNotificationToggle('newExpense')}
            />
            <span>New Expense Notifications</span>
          </label>
          <span className="text-xs text-gray-500">
            Notifies you when a new expense is added to your group
          </span>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox"
              className="rounded text-indigo-600 focus:ring-indigo-500"
              checked={settings.notifications.settlements}
              onChange={() => handleNotificationToggle('settlements')}
            />
            <span>Settlement Notifications</span>
          </label>
          <span className="text-xs text-gray-500">
            Notifies you when someone settles a payment with you
          </span>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox"
              className="rounded text-indigo-600 focus:ring-indigo-500"
              checked={settings.notifications.monthlySummary}
              onChange={() => handleNotificationToggle('monthlySummary')}
            />
            <span>Monthly Summary Notifications</span>
          </label>
          <span className="text-xs text-gray-500">
            Receive a monthly summary of your expenses and balances
          </span>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox"
              className="rounded text-indigo-600 focus:ring-indigo-500"
              checked={settings.notifications.balanceAlerts}
              onChange={() => handleNotificationToggle('balanceAlerts')}
            />
            <span>Balance Alert Notifications</span>
          </label>
          <span className="text-xs text-gray-500">
            Get notified when your balance exceeds a threshold
          </span>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700">Email Frequency</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={settings.emailFrequency}
            onChange={handleFrequencyChange}
          >
            <option value="immediate">Immediate (As events occur)</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Summary</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choose how often you want to receive email notifications
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${saving
              ? 'bg-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
} 