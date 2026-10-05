import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { sendEmailNotification, sendSmsNotification } from '@/lib/notify'

// POST /api/admin/broadcast — send a notification to all (non-banned) users
// Body: { title, message, type, channel }
// channel: 'in_app' (default) | 'email' | 'sms' | 'all'
export async function POST(req: NextRequest) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { title?: string; message?: string; type?: string; channel?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  const message = (body.message || '').trim()
  const type = ['info', 'success', 'warning', 'error'].includes(body.type || '') ? body.type! : 'info'
  const channel = ['in_app', 'email', 'sms', 'all'].includes(body.channel || '') ? body.channel! : 'in_app'

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }
  if (title.length > 120 || message.length > 1000) {
    return NextResponse.json({ error: 'Title too long (max 120) or message too long (max 1000)' }, { status: 400 })
  }

  // find all non-banned, non-admin users with their KYC phone
  const users = await db.user.findMany({
    where: { role: 'user', banned: false },
    include: { kycProfile: { select: { phoneNumber: true } } },
  })

  if (users.length === 0) {
    return NextResponse.json({ error: 'No active users to broadcast to' }, { status: 400 })
  }

  let sentCount = 0
  const sendInApp = channel === 'in_app' || channel === 'all'
  const sendEmail = channel === 'email' || channel === 'all'
  const sendSms = channel === 'sms' || channel === 'all'

  for (const u of users) {
    // respect user's notification preferences
    const prefs = (u.notifPrefs || 'in_app,email,sms').split(',')

    if (sendInApp && prefs.includes('in_app')) {
      await db.notification.create({
        data: { userId: u.id, title, message, type, channel: 'in_app', deliveryStatus: 'delivered' },
      })
      sentCount++
    }
    if (sendEmail && prefs.includes('email') && u.email) {
      await sendEmailNotification(u.id, u.email, title, message)
      sentCount++
    }
    if (sendSms && prefs.includes('sms') && u.kycProfile?.phoneNumber) {
      await sendSmsNotification(u.id, u.kycProfile.phoneNumber, title, message)
      sentCount++
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount })
}
