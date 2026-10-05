import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// POST /api/admin/broadcast — send a notification to all (non-banned) users
export async function POST(req: NextRequest) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { title?: string; message?: string; type?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  const message = (body.message || '').trim()
  const type = ['info', 'success', 'warning', 'error'].includes(body.type || '') ? body.type! : 'info'

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }
  if (title.length > 120 || message.length > 1000) {
    return NextResponse.json({ error: 'Title too long (max 120) or message too long (max 1000)' }, { status: 400 })
  }

  // find all non-banned, non-admin users
  const users = await db.user.findMany({
    where: { role: 'user', banned: false },
    select: { id: true },
  })

  if (users.length === 0) {
    return NextResponse.json({ error: 'No active users to broadcast to' }, { status: 400 })
  }

  // create in-app notification for each user
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      channel: 'in_app',
      deliveryStatus: 'delivered',
    })),
  })

  return NextResponse.json({ ok: true, sent: users.length })
}
