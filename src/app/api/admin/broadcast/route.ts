import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { sendEmailNotification, sendSmsNotification } from '@/lib/notify'

// GET /api/admin/broadcast — list scheduled broadcasts
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const scheduled = await db.scheduledBroadcast.findMany({
    orderBy: { scheduledFor: 'desc' },
    take: 20,
  })

  return NextResponse.json({
    scheduled: scheduled.map((s) => ({
      id: s.id,
      title: s.title,
      message: s.message,
      type: s.type,
      channel: s.channel,
      scheduledFor: s.scheduledFor.toISOString(),
      sent: s.sent,
      createdAt: s.createdAt.toISOString(),
    })),
  })
}

// POST /api/admin/broadcast — send or schedule a broadcast
// Body: { title, message, type, channel, scheduledFor? }
// If scheduledFor is provided and in the future, stores for later sending; otherwise sends immediately.
export async function POST(req: NextRequest) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { title?: string; message?: string; type?: string; channel?: string; scheduledFor?: string }
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

  // Check if scheduling
  if (body.scheduledFor) {
    const scheduledDate = new Date(body.scheduledFor)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 })
    }
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
    }
    await db.scheduledBroadcast.create({
      data: { title, message, type, channel, scheduledFor: scheduledDate },
    })
    return NextResponse.json({ ok: true, scheduled: true, scheduledFor: scheduledDate.toISOString() })
  }

  // Immediate broadcast
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

// DELETE /api/admin/broadcast?id=<id> — cancel a scheduled broadcast
export async function DELETE(req: NextRequest) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const scheduled = await db.scheduledBroadcast.findUnique({ where: { id } })
  if (!scheduled) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (scheduled.sent) return NextResponse.json({ error: 'Already sent' }, { status: 400 })

  await db.scheduledBroadcast.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
