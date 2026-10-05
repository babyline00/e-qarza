import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return null
  return u
}

// GET /api/admin/users?q=<search> — list all non-admin users with their KYC status + loan count
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const q = new URL(req.url).searchParams.get('q')?.trim() || ''
  const where = {
    role: 'user',
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      kycProfile: { select: { status: true, cnicName: true } },
      _count: { select: { applications: true } },
    },
  })

  const data = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    stage: u.stage,
    banned: u.banned,
    createdAt: u.createdAt.toISOString(),
    kycStatus: u.kycProfile?.status || null,
    cnicName: u.kycProfile?.cnicName || null,
    applicationCount: u._count.applications,
  }))

  return NextResponse.json({ users: data })
}

// POST /api/admin/users — ban / unban / delete { userId, action }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { userId?: string; action?: 'ban' | 'unban' | 'delete' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!body.userId || !['ban', 'unban', 'delete'].includes(body.action || '')) {
    return NextResponse.json({ error: 'userId and action (ban|unban|delete) required' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id: body.userId! } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Cannot modify admin accounts' }, { status: 400 })

  if (body.action === 'ban') {
    await db.user.update({ where: { id: target.id }, data: { banned: true } })
    await db.notification.create({
      data: {
        userId: target.id,
        title: 'Account Suspended',
        message: 'Your account has been suspended by the administrator. Please contact support.',
        type: 'error',
      },
    })
  } else if (body.action === 'unban') {
    await db.user.update({ where: { id: target.id }, data: { banned: false } })
    await db.notification.create({
      data: {
        userId: target.id,
        title: 'Account Restored',
        message: 'Your account has been restored. You can now use E-Qarza again.',
        type: 'success',
      },
    })
  } else {
    // delete: cascade removes KYC, applications, payments, notifications
    await db.user.delete({ where: { id: target.id } })
  }

  return NextResponse.json({ ok: true })
}
