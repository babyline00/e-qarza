import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return null
  return u
}

// GET /api/admin/plans — list all plans (including inactive)
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const plans = await db.loanPlan.findMany({ orderBy: { amount: 'asc' } })
  return NextResponse.json({ plans })
}

// POST — create or update a plan
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { id, name, amount, interestRate, tenureMonths, processingFee, description, active } = body as {
    id?: string; name?: string; amount?: number; interestRate?: number; tenureMonths?: number; processingFee?: number; description?: string; active?: boolean
  }
  if (!name || amount == null || interestRate == null || !tenureMonths || processingFee == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (id) {
    const plan = await db.loanPlan.update({
      where: { id },
      data: { name, amount, interestRate, tenureMonths, processingFee, description: description || null, active: active ?? true },
    })
    return NextResponse.json({ plan })
  }
  const plan = await db.loanPlan.create({
    data: { name, amount, interestRate, tenureMonths, processingFee, description: description || null, active: active ?? true },
  })
  return NextResponse.json({ plan })
}

// DELETE — delete a plan (only if no applications reference it)
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const apps = await db.loanApplication.count({ where: { planId: id } })
  if (apps > 0) {
    return NextResponse.json({ error: 'Cannot delete: plan has applications. Deactivate instead.' }, { status: 400 })
  }
  await db.loanPlan.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
