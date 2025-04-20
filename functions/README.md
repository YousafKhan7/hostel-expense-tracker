# Firebase Cloud Functions for SplitIt Expense Tracker

This directory contains Firebase Cloud Functions for the SplitIt Expense Tracker application, focusing on email notification delivery.

## Features

- **Email Notification Processing**: Processes notifications from the Firestore `notificationQueue` collection
- **Scheduled Delivery**: Supports immediate, daily, and weekly email delivery based on user preferences
- **Email Templates**: HTML email templates for different notification types
- **Batch Processing**: Aggregates notifications into digest emails for daily/weekly delivery

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Firebase environment configuration for email sending:
   ```bash
   firebase functions:config:set email.user="your-email@example.com" email.password="your-email-password"
   ```

3. Test locally using the Firebase emulator:
   ```bash
   firebase emulators:start
   ```

## Deployment

Deploy to Firebase:
```bash
firebase deploy --only functions
```

## Function Descriptions

- **processEmailNotifications**: Triggered when a new notification is added to the queue
- **processDailyEmails**: Scheduled to run daily at 9:00 AM UTC
- **processWeeklyEmails**: Scheduled to run weekly on Sundays at 9:00 AM UTC

## Notification Types

- **newExpense**: Sent when a new expense is added to a group
- **settlement**: Sent when a payment is recorded
- **monthlySummary**: Sent with monthly expense summary and report link
- **balanceAlert**: Sent when a user's balance exceeds a threshold

## Email Frequency Options

- **immediate**: Sent as soon as the notification is created
- **daily**: Aggregated and sent in a daily digest
- **weekly**: Aggregated and sent in a weekly digest

## Security

Email credentials should be stored securely using Firebase environment configuration and not hardcoded in the source code.

## Notification Queue Document Structure

```javascript
{
  userId: string,           // Recipient user ID
  notificationType: string, // Type of notification
  data: Object,             // Data specific to the notification type
  status: string,           // 'pending', 'sent', 'failed', or 'batched'
  createdAt: timestamp,     // When the notification was created
  processedAt: timestamp,   // When the notification was processed
  attempts: number,         // Number of processing attempts
  errorMessage: string      // Error message if processing failed
}
``` 