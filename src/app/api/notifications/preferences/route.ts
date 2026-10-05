import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/notifications/preferences — current user's notification channel preferences
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = (user.notifPrefs || 'in_app,email,sms').split(',').filter(Boolean)
  return NextResponse.json({
    preferences: {
      in_app: prefs.includes('in_app'),
      email: prefs.includes('email'),
      sms: prefs.includes('sms'),
    },
  })
}

// POST /api/notifications/preferences — update preferences { in_app, email, sms }
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { in_app?: boolean; email?: boolean; sms?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const enabled: string[] = []
  if (body.in_app) enabled.push('in_app')
  if (body.email) enabled.push('email')
  if (body.sms) enabled.push('sms')

  // must keep at least one channel
  if (enabled.length === 0) {
    return NextResponse.json({ error: 'At least one notification channel must be enabled' }, { status: 400 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { notifPrefs: enabled.join(',') },
  })

  return NextResponse.json({ ok: true, preferences: { in_app: !!body.in_app, email: !!body.email, sms: !!body.sms } })
}
