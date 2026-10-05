import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// POST /api/support — submit a support ticket (creates notifications to all admins + the user)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { subject?: string; message?: string; category?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const subject = (body.subject || '').trim()
  const message = (body.message || '').trim()
  const category = (body.category || 'general').trim()
  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }
  if (subject.length > 120 || message.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  // notify all admins
  const admins = await db.user.findMany({ where: { role: 'admin' } })
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: `Support: ${subject}`,
      message: `From ${user.email} (${category}): ${message.slice(0, 180)}`,
      type: 'info',
    })),
  })

  // confirm to user
  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Support ticket received',
      message: `We received your message "${subject}" and will get back to you shortly.`,
      type: 'success',
    },
  })

  return NextResponse.json({ ok: true })
}
