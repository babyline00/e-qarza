import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return null
  return u
}

// GET /api/admin/banks — list all bank details
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const banks = await db.bankDetail.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ banks })
}

// POST — create or update a bank detail
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { id, bankName, accountTitle, accountNumber, iban, active } = body as {
    id?: string; bankName?: string; accountTitle?: string; accountNumber?: string; iban?: string; active?: boolean
  }
  if (!bankName || !accountTitle || !accountNumber || !iban) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (id) {
    const bank = await db.bankDetail.update({
      where: { id },
      data: { bankName, accountTitle, accountNumber, iban, active: active ?? true },
    })
    return NextResponse.json({ bank })
  }
  const bank = await db.bankDetail.create({
    data: { bankName, accountTitle, accountNumber, iban, active: active ?? true },
  })
  return NextResponse.json({ bank })
}

// DELETE — remove a bank detail
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.bankDetail.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
