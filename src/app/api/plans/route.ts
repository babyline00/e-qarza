import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const plans = await db.loanPlan.findMany({
    where: { active: true },
    orderBy: { amount: 'asc' },
  })
  return NextResponse.json({ plans })
}
