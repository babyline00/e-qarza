import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { computeCreditScore } from '@/lib/credit-score'

// GET /api/credit-score — current user's credit score + records a history snapshot
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const score = await computeCreditScore(user.id)

  // record a history snapshot (once per day max — check if today's snapshot exists)
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const existing = await db.creditScoreHistory.findFirst({
    where: { userId: user.id, createdAt: { gte: startOfDay } },
  })
  if (!existing) {
    await db.creditScoreHistory.create({
      data: { userId: user.id, score: score.score, rating: score.rating },
    })
  }

  return NextResponse.json({ score })
}
