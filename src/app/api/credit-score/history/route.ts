import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/credit-score/history — user's credit score history (newest first, last 90 days)
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const history = await db.creditScoreHistory.findMany({
    where: { userId: user.id, createdAt: { gte: ninetyDaysAgo.toISOString() } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  return NextResponse.json({
    history: history.map((h) => ({
      id: h.id,
      score: h.score,
      rating: h.rating,
      createdAt: h.createdAt.toISOString(),
    })),
  })
}
