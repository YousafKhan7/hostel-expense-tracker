const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Email configuration
// Note: In production, use Firebase environment variables to store these values securely
const emailConfig = {
  service: 'gmail', // Replace with your email service
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER || 'your-email@gmail.com', // Set this in Firebase config
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD || 'your-email-password' // Set this in Firebase config
  }
};

// Create a transporter for sending emails
const transporter = nodemailer.createTransport(emailConfig);

// Log email configuration status (without showing credentials)
console.log(`Email configuration loaded. Using service: ${emailConfig.service}, user: ${emailConfig.auth.user.split('@')[0]}...`);

/**
 * Process new notifications in the queue
 * Triggers on creation of new documents in the notificationQueue collection
 */
exports.processEmailNotifications = functions.firestore
  .document('notificationQueue/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notificationData = snapshot.data();
    const notificationId = context.params.notificationId;
    
    console.log(`Processing notification ${notificationId} of type ${notificationData.notificationType}`);
    
    // Skip if the notification has already been processed
    if (notificationData.status !== 'pending') {
      console.log(`Notification ${notificationId} is not pending, skipping`);
      return null;
    }
    
    try {
      // Get user information for recipient
      const userDoc = await db.collection('users').doc(notificationData.userId).get();
      
      if (!userDoc.exists) {
        await updateNotificationStatus(notificationId, 'failed', 'User not found');
        return null;
      }
      
      const userData = userDoc.data();
      const recipientEmail = userData.email;
      
      if (!recipientEmail) {
        await updateNotificationStatus(notificationId, 'failed', 'User email not found');
        return null;
      }
      
      // Get user settings to check email frequency preference
      const userSettingsDoc = await db.collection('userSettings').doc(notificationData.userId).get();
      const userSettings = userSettingsDoc.exists ? userSettingsDoc.data() : { emailFrequency: 'immediate' };
      
      // Check if notification should be sent immediately
      if (userSettings.emailFrequency !== 'immediate') {
        // Update status to 'batched' for later processing in a scheduled job
        await updateNotificationStatus(notificationId, 'batched', 'Queued for batch delivery');
        return null;
      }
      
      // Generate email content based on notification type
      const emailContent = generateEmailContent(notificationData, userData.name || userData.email);
      
      // Create mail options
      const mailOptions = {
        from: `"SplitIt Expense Tracker" <${emailConfig.auth.user}>`,
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.body
      };
      
      // Send the email
      await transporter.sendMail(mailOptions);
      
      // Update notification status to 'sent'
      await updateNotificationStatus(notificationId, 'sent');
      
      return { success: true };
    } catch (error) {
      console.error(`Error processing notification ${notificationId}:`, error);
      
      // Update notification status with error info
      await updateNotificationStatus(
        notificationId,
        'failed',
        error.message,
        (notificationData.attempts || 0) + 1
      );
      
      return { success: false, error: error.message };
    }
  });

/**
 * Scheduled function to process batched email notifications (daily)
 * Runs every day at 9:00 AM
 */
exports.processDailyEmails = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    return await processBatchedEmails('daily');
  });

/**
 * Scheduled function to process batched email notifications (weekly)
 * Runs every Sunday at 9:00 AM
 */
exports.processWeeklyEmails = functions.pubsub
  .schedule('0 9 * * 0')
  .timeZone('UTC')
  .onRun(async (context) => {
    return await processBatchedEmails('weekly');
  });

/**
 * Process batched emails by frequency type
 * @param {string} frequency - 'daily' or 'weekly'
 */
async function processBatchedEmails(frequency) {
  try {
    // Get all users with this email frequency preference
    const userSettingsSnapshot = await db.collection('userSettings')
      .where('emailFrequency', '==', frequency)
      .get();
    
    if (userSettingsSnapshot.empty) {
      console.log(`No users found with ${frequency} email frequency`);
      return { success: true, processed: 0 };
    }
    
    let processedCount = 0;
    
    // Process each user's batched notifications
    for (const userSettingsDoc of userSettingsSnapshot.docs) {
      const userId = userSettingsDoc.id;
      
      // Get user info
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) continue;
      
      const userData = userDoc.data();
      if (!userData.email) continue;
      
      // Get batched notifications for this user
      const notificationsSnapshot = await db.collection('notificationQueue')
        .where('userId', '==', userId)
        .where('status', '==', 'batched')
        .get();
      
      if (notificationsSnapshot.empty) continue;
      
      // Group notifications by type
      const notificationsByType = {};
      notificationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!notificationsByType[data.notificationType]) {
          notificationsByType[data.notificationType] = [];
        }
        notificationsByType[data.notificationType].push({
          id: doc.id,
          ...data
        });
      });
      
      // Generate digest email for this user
      const digestEmail = generateDigestEmail(notificationsByType, userData.name || userData.email, frequency);
      
      // Send the digest email
      const mailOptions = {
        from: `"SplitIt Expense Tracker" <${emailConfig.auth.user}>`,
        to: userData.email,
        subject: digestEmail.subject,
        html: digestEmail.body
      };
      
      await transporter.sendMail(mailOptions);
      
      // Update all notifications to 'sent'
      const batch = db.batch();
      notificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'sent',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      processedCount += notificationsSnapshot.size;
    }
    
    return { success: true, processed: processedCount };
  } catch (error) {
    console.error(`Error processing ${frequency} batched emails:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Update the status of a notification
 * @param {string} notificationId - The notification ID
 * @param {string} status - The new status
 * @param {string} errorMessage - Optional error message
 * @param {number} attempts - Number of attempts made to process
 */
async function updateNotificationStatus(notificationId, status, errorMessage = null, attempts = 0) {
  const updateData = {
    status,
    processedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  if (attempts > 0) {
    updateData.attempts = attempts;
  }
  
  await db.collection('notificationQueue').doc(notificationId).update(updateData);
}

/**
 * Generate email content based on notification type
 * @param {Object} notification - The notification data
 * @param {string} recipientName - The recipient's name
 * @returns {Object} - The email subject and body
 */
function generateEmailContent(notification, recipientName) {
  const { notificationType, data } = notification;
  let subject = '';
  let body = '';
  
  switch (notificationType) {
    case 'newExpense':
      subject = `New Expense in ${data.groupName}: ${data.expenseDescription}`;
      body = `
        <h2>New Expense Added</h2>
        <p>Hello ${recipientName},</p>
        <p>A new expense has been added to your group <strong>${data.groupName}</strong>.</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
          <p><strong>Description:</strong> ${data.expenseDescription}</p>
          <p><strong>Amount:</strong> $${formatAmount(data.expenseAmount)}</p>
          <p><strong>Your share:</strong> $${formatAmount(data.shareAmount)}</p>
          <p><strong>Date:</strong> ${formatDate(data.date)}</p>
        </div>
        <p>Log in to SplitIt to see more details.</p>
      `;
      break;
    
    case 'settlement':
      subject = `Payment Received in ${data.groupName}`;
      body = `
        <h2>Payment Received</h2>
        <p>Hello ${recipientName},</p>
        <p>A payment has been recorded in your group <strong>${data.groupName}</strong>.</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
          <p><strong>Amount:</strong> $${formatAmount(data.amount)}</p>
          <p><strong>Date:</strong> ${formatDate(data.date)}</p>
          ${data.note ? `<p><strong>Note:</strong> ${data.note}</p>` : ''}
        </div>
        <p>Log in to SplitIt to see more details.</p>
      `;
      break;
    
    case 'monthlySummary':
      subject = `Monthly Summary for ${data.groupName}`;
      body = `
        <h2>Monthly Expense Summary</h2>
        <p>Hello ${recipientName},</p>
        <p>Here's your monthly summary for <strong>${data.groupName}</strong>.</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
          <p><strong>Total group spending:</strong> $${formatAmount(data.totalSpent)}</p>
          <p><strong>Your balance:</strong> $${formatAmount(data.memberBalance)}</p>
          <p><strong>Status:</strong> ${getBalanceStatusText(data.memberBalance)}</p>
        </div>
        ${data.reportUrl ? 
          `<p><a href="${data.reportUrl}" style="display: inline-block; padding: 10px 15px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Detailed Report</a></p>`
          : 
          `<p>Log in to SplitIt to generate a detailed report.</p>`
        }
      `;
      break;
    
    case 'balanceAlert':
      subject = `Balance Alert for ${data.groupName}`;
      body = `
        <h2>Balance Alert</h2>
        <p>Hello ${recipientName},</p>
        <p>Your balance in <strong>${data.groupName}</strong> has reached a significant amount.</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
          <p><strong>Current balance:</strong> $${formatAmount(data.balance)}</p>
          <p><strong>Status:</strong> ${getBalanceStatusText(data.balance)}</p>
          <p><strong>As of:</strong> ${formatDate(data.date)}</p>
        </div>
        <p>Log in to SplitIt to settle up or see more details.</p>
      `;
      break;
    
    default:
      subject = 'Notification from SplitIt';
      body = `
        <h2>Notification</h2>
        <p>Hello ${recipientName},</p>
        <p>You have a new notification from SplitIt.</p>
        <p>Log in to your account to see more details.</p>
      `;
  }
  
  // Add email footer
  body += `
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
    <p style="color: #888; font-size: 12px;">
      This email was sent from SplitIt Expense Tracker. 
      To manage your notification preferences, log in to your account settings.
    </p>
  `;
  
  return { subject, body };
}

/**
 * Generate a digest email with multiple notifications
 * @param {Object} notificationsByType - Notifications grouped by type
 * @param {string} recipientName - The recipient's name
 * @param {string} frequency - 'daily' or 'weekly'
 * @returns {Object} - The email subject and body
 */
function generateDigestEmail(notificationsByType, recipientName, frequency) {
  const capitalizedFrequency = frequency.charAt(0).toUpperCase() + frequency.slice(1);
  const subject = `${capitalizedFrequency} Summary from SplitIt`;
  
  let body = `
    <h2>${capitalizedFrequency} Summary</h2>
    <p>Hello ${recipientName},</p>
    <p>Here's a summary of your recent activity on SplitIt:</p>
  `;
  
  // New Expenses
  if (notificationsByType.newExpense && notificationsByType.newExpense.length > 0) {
    body += `
      <h3>New Expenses (${notificationsByType.newExpense.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Group</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Description</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Your Share</th>
        </tr>
    `;
    
    notificationsByType.newExpense.forEach(notification => {
      const { data } = notification;
      body += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.groupName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.expenseDescription}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${formatAmount(data.expenseAmount)}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${formatAmount(data.shareAmount)}</td>
        </tr>
      `;
    });
    
    body += `</table>`;
  }
  
  // Settlements
  if (notificationsByType.settlement && notificationsByType.settlement.length > 0) {
    body += `
      <h3>Settlements (${notificationsByType.settlement.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Group</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date</th>
        </tr>
    `;
    
    notificationsByType.settlement.forEach(notification => {
      const { data } = notification;
      body += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.groupName}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${formatAmount(data.amount)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(data.date)}</td>
        </tr>
      `;
    });
    
    body += `</table>`;
  }
  
  // Monthly Summaries
  if (notificationsByType.monthlySummary && notificationsByType.monthlySummary.length > 0) {
    body += `
      <h3>Monthly Summaries (${notificationsByType.monthlySummary.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Group</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total Spent</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Your Balance</th>
          <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Status</th>
        </tr>
    `;
    
    notificationsByType.monthlySummary.forEach(notification => {
      const { data } = notification;
      body += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.groupName}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${formatAmount(data.totalSpent)}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${formatAmount(data.memberBalance)}</td>
          <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${getBalanceStatusText(data.memberBalance)}</td>
        </tr>
      `;
      
      if (data.reportUrl) {
        body += `
          <tr>
            <td colspan="4" style="padding: 8px; border: 1px solid #ddd;">
              <a href="${data.reportUrl}" style="display: inline-block; padding: 5px 10px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 3px;">View Report</a>
            </td>
          </tr>
        `;
      }
    });
    
    body += `</table>`;
  }
  
  // Balance Alerts
  if (notificationsByType.balanceAlert && notificationsByType.balanceAlert.length > 0) {
    body += `
      <h3>Balance Alerts (${notificationsByType.balanceAlert.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Group</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Balance</th>
          <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Status</th>
        </tr>
    `;
    
    notificationsByType.balanceAlert.forEach(notification => {
      const { data } = notification;
      body += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.groupName}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${formatAmount(data.balance)}</td>
          <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${getBalanceStatusText(data.balance)}</td>
        </tr>
      `;
    });
    
    body += `</table>`;
  }
  
  // Add email footer
  body += `
    <p>Log in to SplitIt to see more details and take action.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
    <p style="color: #888; font-size: 12px;">
      This email was sent from SplitIt Expense Tracker. 
      To manage your notification preferences, log in to your account settings.
    </p>
  `;
  
  return { subject, body };
}

/**
 * Format an amount with 2 decimal places
 * @param {number} amount - The amount to format
 * @returns {string} - The formatted amount
 */
function formatAmount(amount) {
  return parseFloat(amount).toFixed(2);
}

/**
 * Format a date for display
 * @param {Date|Object|string} date - The date to format
 * @returns {string} - The formatted date
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  let dateObj;
  if (typeof date === 'object' && date.seconds) {
    dateObj = new Date(date.seconds * 1000);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get the balance status text
 * @param {number} balance - The balance amount
 * @returns {string} - The status text
 */
function getBalanceStatusText(balance) {
  if (balance > 0) return 'To Receive';
  if (balance < 0) return 'To Pay';
  return 'Settled';
}