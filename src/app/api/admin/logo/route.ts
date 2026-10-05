import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

async function requireAdminOrStaff() {
  const u = await getSessionUser()
  if (!u) return null
  if (u.role === 'admin') return u
  if (u.role === 'staff') {
    const access = (u.staffAccess || '').split(',')
    if (access.includes('settings')) return u
  }
  return null
}

// GET /api/admin/logo — get current site logo path
export async function GET() {
  const setting = await db.adminSetting.findUnique({ where: { key: 'siteLogo' } })
  return NextResponse.json({ logoPath: setting?.value || null })
}

// POST /api/admin/logo — upload site logo
export async function POST(req: NextRequest) {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('logo')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Logo file is required' }, { status: 400 })
  }
  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: 'Logo too large (max 1MB)' }, { status: 400 })
  }
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP, SVG allowed' }, { status: 400 })
  }

  const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const fname = `site-logo-${randomBytes(6).toString('hex')}.${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, fname), Buffer.from(await file.arrayBuffer()))
  const logoPath = `/uploads/${fname}`

  // Delete old logo if existed
  const oldSetting = await db.adminSetting.findUnique({ where: { key: 'siteLogo' } })
  if (oldSetting?.value) {
    try { await fs.unlink(path.join(process.cwd(), 'public', oldSetting.value)) } catch { /* ignore */ }
  }

  // Upsert setting
  if (oldSetting) {
    await db.adminSetting.update({ where: { key: 'siteLogo' }, data: { value: logoPath } })
  } else {
    await db.adminSetting.create({ data: { key: 'siteLogo', value: logoPath } })
  }

  return NextResponse.json({ ok: true, logoPath })
}

// DELETE /api/admin/logo — remove site logo
export async function DELETE() {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const setting = await db.adminSetting.findUnique({ where: { key: 'siteLogo' } })
  if (setting?.value) {
    try { await fs.unlink(path.join(process.cwd(), 'public', setting.value)) } catch { /* ignore */ }
    await db.adminSetting.delete({ where: { key: 'siteLogo' } })
  }

  return NextResponse.json({ ok: true })
}
