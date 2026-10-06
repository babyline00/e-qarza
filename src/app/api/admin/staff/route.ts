import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

async function requireAdmin() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return null
  return u
}

const ALL_TABS = ['analytics', 'kyc', 'payments', 'applications', 'withdrawals', 'manage', 'users', 'settings']

// GET /api/admin/staff — list all staff members
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const staff = await db.user.findMany({
    where: { role: 'staff' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      staffAccess: true,
      banned: true,
      createdAt: true,
    },
  })

  const data = staff.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    phone: s.phone,
    banned: s.banned,
    access: s.staffAccess ? s.staffAccess.split(',').filter(Boolean) : [],
    createdAt: s.createdAt.toISOString(),
  }))

  return NextResponse.json({ staff: data, allTabs: ALL_TABS })
}

// POST /api/admin/staff — create or update staff { id?, email, name, password?, access[] }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { id?: string; email?: string; name?: string; password?: string; access?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  const name = (body.name || '').trim()
  if (!email || !name) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
  }

  // validate access tabs
  const access = (body.access || []).filter((t) => ALL_TABS.includes(t))
  const accessStr = access.join(',')

  if (body.id) {
    // update existing staff
    const existing = await db.user.findUnique({ where: { id: body.id } })
    if (!existing) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    if (existing.role !== 'staff') return NextResponse.json({ error: 'Can only edit staff accounts' }, { status: 400 })

    const updateData: Record<string, unknown> = { name, staffAccess: accessStr }
    if (body.password && body.password.length >= 6) {
      updateData.passwordHash = hashPassword(body.password)
    }
    await db.user.update({ where: { id: body.id }, data: updateData })
    return NextResponse.json({ ok: true })
  }

  // create new staff
  if (!body.password || body.password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const dup = await db.user.findUnique({ where: { email } })
  if (dup) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })

  await db.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(body.password),
      role: 'staff',
      stage: 'active',
      staffAccess: accessStr,
    },
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/staff?id=<id> — delete staff
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const staff = await db.user.findUnique({ where: { id } })
  if (!staff) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (staff.role !== 'staff') return NextResponse.json({ error: 'Can only delete staff accounts' }, { status: 400 })

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
