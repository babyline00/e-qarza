import { db } from './db'
import { sendEmailNotification, sendSmsNotification } from './notify'

// Process scheduled broadcasts whose time has come.
// Called lazily from admin data-loading endpoints.
export async function processScheduledBroadcasts(): Promise<number> {
  const now = new Date()
  const due = await db.scheduledBroadcast.findMany({
    where: { sent: false, scheduledFor: { lte: now } },
  })

  let sentCount = 0
  for (const item of due) {
    const users = await db.user.findMany({
      where: { role: 'user', banned: false },
      include: { kycProfile: { select: { phoneNumber: true } } },
    })

    const sendInApp = item.channel === 'in_app' || item.channel === 'all'
    const sendEmail = item.channel === 'email' || item.channel === 'all'
    const sendSms = item.channel === 'sms' || item.channel === 'all'

    for (const u of users) {
      const prefs = (u.notifPrefs || 'in_app,email,sms').split(',')
      if (sendInApp && prefs.includes('in_app')) {
        await db.notification.create({
          data: { userId: u.id, title: item.title, message: item.message, type: item.type, channel: 'in_app', deliveryStatus: 'delivered' },
        })
      }
      if (sendEmail && prefs.includes('email') && u.email) {
        await sendEmailNotification(u.id, u.email, item.title, item.message)
      }
      if (sendSms && prefs.includes('sms') && u.kycProfile?.phoneNumber) {
        await sendSmsNotification(u.id, u.kycProfile.phoneNumber, item.title, item.message)
      }
    }

    await db.scheduledBroadcast.update({ where: { id: item.id }, data: { sent: true } })
    sentCount++
  }

  return sentCount
}
