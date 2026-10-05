import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      channel: n.channel,
      deliveryStatus: n.deliveryStatus,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  })
}

// mark all as read
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { id?: string; all?: boolean } = {}
  try {
    body = await req.json()
  } catch {
    /* ignore */
  }
  if (body.all) {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
  } else if (body.id) {
    await db.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}
