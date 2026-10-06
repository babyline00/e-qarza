import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/branding — public endpoint.
//
// Returns the admin-uploaded site logo (Admin → Settings → Site Logo) so the
// client can render it in the header/footer and as the favicon. Falls back to
// the bundled /logo.svg when nothing has been uploaded.
//
// Public on purpose: the logo is displayed to every visitor, including users who
// are not signed in. Only this one value is ever exposed.

export const dynamic = 'force-dynamic'

export async function GET() {
  const setting = await db.adminSetting.findUnique({ where: { key: 'siteLogo' } })
  return NextResponse.json(
    { logoPath: setting?.value || null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}