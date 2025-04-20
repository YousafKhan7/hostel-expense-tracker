import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { userSettingsStructure } from '../utils/ExpenseSchema';

/**
 * Gets user notification settings
 * @param {string} userId - The user ID
 * @returns {Object} - The user's notification settings
 */
export const getUserNotificationSettings = async (userId) => {
  try {
    if (!userId) {
      console.error('getUserNotificationSettings called with no userId');
      return null;
    }
    
    console.log(`Getting notification settings for user ${userId}`);
    const userSettingsRef = doc(db, 'userSettings', userId);
    const userSettingsDoc = await getDoc(userSettingsRef);
    
    if (!userSettingsDoc.exists()) {
      console.log(`No settings found for user ${userId}, creating default settings`);
      // Create default settings if none exist
      const defaultSettings = {
        ...userSettingsStructure,
        userId,
        notifications: {
          newExpense: true,
          settlements: true,
          monthlySummary: true,
          balanceAlerts: false
        },
        emailFrequency: 'immediate',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      try {
        await setDoc(userSettingsRef, defaultSettings);
        console.log(`Created default settings for user ${userId}`);
        return defaultSettings;
      } catch (setError) {
        console.error(`Failed to create default settings for user ${userId}:`, setError);
        return null;
      }
    }
    
    const settings = userSettingsDoc.data();
    console.log(`Retrieved settings for user ${userId}:`, settings.notifications);
    return settings;
  } catch (error) {
    console.error(`Error getting user notification settings for ${userId}:`, error);
    return null;
  }
};

/**
 * Updates user notification settings
 * @param {string} userId - The user ID
 * @param {Object} settings - The updated settings
 * @returns {boolean} - Whether the update was successful
 */
export const updateUserNotificationSettings = async (userId, settings) => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    const userSettingsDoc = await getDoc(userSettingsRef);
    
    if (!userSettingsDoc.exists()) {
      // Create settings if none exist
      const newSettings = {
        ...userSettingsStructure,
        ...settings,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(userSettingsRef, newSettings);
    } else {
      // Update existing settings
      await updateDoc(userSettingsRef, {
        ...settings,
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user notification settings:', error);
    throw error;
  }
};

/**
 * Queues an email notification (for Firebase Cloud Functions to process)
 * @param {string} userId - The recipient user ID
 * @param {string} notificationType - Type of notification (newExpense, settlement, monthlySummary, balanceAlert)
 * @param {Object} data - The notification data
 * @returns {string} - The ID of the queued notification
 */
export const queueEmailNotification = async (userId, notificationType, data) => {
  try {
    console.log(`Queueing ${notificationType} notification for user ${userId}`, data);
    
    // Check if user wants this notification type
    const userSettings = await getUserNotificationSettings(userId);
    
    if (!userSettings) {
      console.error(`Failed to get user settings for ${userId}`);
      return null;
    }
    
    if (!userSettings.notifications || !userSettings.notifications[notificationType]) {
      // User has disabled this notification type
      console.log(`User ${userId} has disabled ${notificationType} notifications`);
      return null;
    }
    
    // Create a new notification document in the notification queue
    const notificationRef = doc(collection(db, 'notificationQueue'));
    
    const notificationData = {
      userId,
      notificationType,
      data,
      status: 'pending',
      createdAt: new Date(),
      processedAt: null,
      attempts: 0
    };
    
    await setDoc(notificationRef, notificationData);
    console.log(`Notification queued with ID: ${notificationRef.id}`);
    
    return notificationRef.id;
  } catch (error) {
    console.error('Error queueing email notification:', error);
    throw error;
  }
};

/**
 * Sends a new expense notification
 * @param {string} groupId - The group ID
 * @param {Object} expense - The expense data
 * @param {Array} memberIds - Array of member IDs to notify
 */
export const sendNewExpenseNotification = async (groupId, expense, memberIds) => {
  try {
    // Get group details
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data();
    
    // Queue notifications for each member
    for (const memberId of memberIds) {
      // Skip the expense creator
      if (memberId === expense.paidBy) continue;
      
      await queueEmailNotification(memberId, 'newExpense', {
        groupId,
        groupName: groupData.name,
        expenseId: expense.id,
        expenseDescription: expense.description,
        expenseAmount: expense.amount,
        paidBy: expense.paidBy,
        date: expense.expenseDate,
        shareAmount: expense.shares[memberId] || 0
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error sending new expense notifications:', error);
    throw error;
  }
};

/**
 * Sends a settlement notification
 * @param {string} groupId - The group ID
 * @param {Object} settlement - The settlement data
 */
export const sendSettlementNotification = async (groupId, settlement) => {
  try {
    // Get group details
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data();
    
    // Queue notification for the recipient
    await queueEmailNotification(settlement.to, 'settlement', {
      groupId,
      groupName: groupData.name,
      settlementId: settlement.id,
      amount: settlement.amount,
      from: settlement.from,
      date: settlement.date,
      note: settlement.note || ''
    });
    
    return true;
  } catch (error) {
    console.error('Error sending settlement notification:', error);
    throw error;
  }
};

/**
 * Sends a monthly summary notification
 * @param {string} groupId - The group ID
 * @param {string} monthKey - The month key
 * @param {Array} memberIds - Member IDs to notify
 * @param {string} reportUrl - URL to the generated report (optional)
 */
export const sendMonthlySummaryNotification = async (groupId, monthKey, memberIds, reportUrl = null) => {
  try {
    // Get group details
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data();
    
    // Get monthly data
    const monthlyDataRef = doc(db, 'monthlyData', `${groupId}_${monthKey}`);
    const monthlyDataDoc = await getDoc(monthlyDataRef);
    
    if (!monthlyDataDoc.exists()) {
      throw new Error('Monthly data not found');
    }
    
    const monthlyData = monthlyDataDoc.data();
    
    // Queue notifications for each member
    for (const memberId of memberIds) {
      const memberBalance = monthlyData.memberBalances[memberId] || { endBalance: 0 };
      
      await queueEmailNotification(memberId, 'monthlySummary', {
        groupId,
        groupName: groupData.name,
        monthKey,
        totalSpent: monthlyData.totalExpenses || 0,
        memberBalance: memberBalance.endBalance,
        reportUrl
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error sending monthly summary notifications:', error);
    throw error;
  }
};

/**
 * Sends a balance alert notification when a user's balance exceeds a threshold
 * @param {string} groupId - The group ID
 * @param {string} userId - The user ID
 * @param {number} balance - The current balance
 */
export const sendBalanceAlertNotification = async (groupId, userId, balance) => {
  try {
    // Check if user has enabled balance alerts
    const userSettings = await getUserNotificationSettings(userId);
    
    if (!userSettings.notifications.balanceAlerts) {
      return null;
    }
    
    // Get group details
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data();
    
    // Queue notification
    await queueEmailNotification(userId, 'balanceAlert', {
      groupId,
      groupName: groupData.name,
      balance,
      date: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending balance alert notification:', error);
    throw error;
  }
}; 