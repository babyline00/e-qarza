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

// GET /api/admin/app-download — list all app downloads
export async function GET() {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const apps = await db.appDownload.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ apps })
}

// POST /api/admin/app-download — upload app file (multipart: platform, version, file)
export async function POST(req: NextRequest) {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const platform = String(formData.get('platform') || '').trim()
  const version = String(formData.get('version') || '').trim()
  const file = formData.get('file')

  if (!platform || !version || !file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Platform, version, and file are required' }, { status: 400 })
  }
  if (!['android', 'ios'].includes(platform)) {
    return NextResponse.json({ error: 'Platform must be android or ios' }, { status: 400 })
  }
  if (file.size > 200 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 200MB)' }, { status: 400 })
  }

  const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'apps')
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = (file.name.split('.').pop() || 'apk').toLowerCase()
  const fname = `app-${platform}-${randomBytes(6).toString('hex')}.${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, fname), Buffer.from(await file.arrayBuffer()))
  const filePath = `/uploads/apps/${fname}`

  // Deactivate previous active app for this platform
  await db.appDownload.updateMany({
    where: { platform, active: true },
    data: { active: false },
  })

  const app = await db.appDownload.create({
    data: {
      platform,
      version,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      active: true,
    },
  })

  return NextResponse.json({ ok: true, app })
}

// DELETE /api/admin/app-download?id=<id>
export async function DELETE(req: NextRequest) {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const app = await db.appDownload.findUnique({ where: { id } })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete file
  try { await fs.unlink(path.join(process.cwd(), 'public', app.filePath)) } catch { /* ignore */ }

  await db.appDownload.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
