import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/payments/bank — active bank details for the user to send money to
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const banks = await db.bankDetail.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ banks })
}
