import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdminOrStaff(key?: string) {
  const u = await getSessionUser()
  if (!u) return null
  if (u.role === 'admin') return u
  // staff with settings access
  if (u.role === 'staff') {
    const access = (u.staffAccess || '').split(',')
    if (!key || access.includes(key)) return u
  }
  return null
}

// GET /api/admin/settings — get all settings
export async function GET() {
  const u = await requireAdminOrStaff('settings')
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const settings = await db.adminSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  return NextResponse.json({
    settings: {
      customChatCode: map.customChatCode || '',
      customChatEnabled: map.customChatEnabled === 'true',
      customHeaderCode: map.customHeaderCode || '',
      customHeaderEnabled: map.customHeaderEnabled === 'true',
      customFooterCode: map.customFooterCode || '',
      customFooterEnabled: map.customFooterEnabled === 'true',
      autoApproveKyc: map.autoApproveKyc === 'true',
    },
  })
}

// POST /api/admin/settings — update settings
export async function POST(req: NextRequest) {
  const u = await requireAdminOrStaff('settings')
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const updates: { key: string; value: string }[] = []
  const fields = ['customChatCode', 'customChatEnabled', 'customHeaderCode', 'customHeaderEnabled', 'customFooterCode', 'customFooterEnabled', 'autoApproveKyc']
  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push({ key: f, value: String(body[f]) })
    }
  }

  for (const { key, value } of updates) {
    const existing = await db.adminSetting.findUnique({ where: { key } })
    if (existing) {
      await db.adminSetting.update({ where: { key }, data: { value } })
    } else {
      await db.adminSetting.create({ data: { key, value } })
    }
  }

  return NextResponse.json({ ok: true })
}
