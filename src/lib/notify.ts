import { db } from './db'

// Simulated email/SMS sender.
// In production this would integrate with SendGrid/Twilio/etc.
// Here we log the "sent" message to a notification record with channel + deliveryStatus.

export interface SendResult {
  channel: 'email' | 'sms'
  status: 'sent' | 'failed'
  recipient: string
  message: string
}

// Simulate sending an email. Returns the (fake) delivery result.
// Records a Notification row with channel='email' so the user can see it was "sent".
export async function sendEmailNotification(
  userId: string,
  email: string,
  title: string,
  message: string
): Promise<SendResult> {
  // Simulate 95% delivery success
  const success = Math.random() < 0.95
  const status = success ? 'sent' : 'failed'

  await db.notification.create({
    data: {
      userId,
      title,
      message,
      type: 'info',
      channel: 'email',
      deliveryStatus: status,
    },
  })

  return { channel: 'email', status, recipient: maskEmail(email), message }
}

// Simulate sending an SMS.
export async function sendSmsNotification(
  userId: string,
  phone: string,
  title: string,
  message: string
): Promise<SendResult> {
  const success = Math.random() < 0.95
  const status = success ? 'sent' : 'failed'

  await db.notification.create({
    data: {
      userId,
      title,
      message,
      type: 'info',
      channel: 'sms',
      deliveryStatus: status,
    },
  })

  return { channel: 'sms', status, recipient: maskPhone(phone), message }
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`
}

function maskPhone(phone: string): string {
  if (phone.length < 4) return phone
  return phone.slice(0, 4) + '*'.repeat(Math.max(phone.length - 4, 0))
}
