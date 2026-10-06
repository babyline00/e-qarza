import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/custom-code — public endpoint.
//
// Returns the admin-authored embed snippets so the client can inject them on
// every page (including the login screen). Only the three snippet fields are
// exposed, and only when their matching *Enabled flag is on — nothing else from
// AdminSetting (e.g. autoApproveKyc) is ever returned here.
//
// This is deliberately unauthenticated: the snippets are meant for every
// visitor, and an admin setting them is the trust boundary.

export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await db.adminSetting.findMany({
    where: { key: { in: ['customChatCode', 'customChatEnabled', 'customHeaderCode', 'customHeaderEnabled', 'customFooterCode', 'customFooterEnabled'] } },
  })

  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value

  return NextResponse.json(
    {
      header: map.customHeaderEnabled === 'true' ? map.customHeaderCode || '' : '',
      chat: map.customChatEnabled === 'true' ? map.customChatCode || '' : '',
      footer: map.customFooterEnabled === 'true' ? map.customFooterCode || '' : '',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}