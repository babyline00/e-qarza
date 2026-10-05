import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { computeCreditScore } from '@/lib/credit-score'

// GET /api/credit-score — current user's credit score
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const score = await computeCreditScore(user.id)
  return NextResponse.json({ score })
}
