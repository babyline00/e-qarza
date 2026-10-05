import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth'

// POST /api/auth/password — change current user's password
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { current?: string; next?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const current = body.current || ''
  const next = body.next || ''
  if (!current || !next) {
    return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
  }
  if (next.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
  }
  if (current === next) {
    return NextResponse.json({ error: 'New password must differ from the current one' }, { status: 400 })
  }
  if (!verifyPassword(current, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  })
  return NextResponse.json({ ok: true })
}
