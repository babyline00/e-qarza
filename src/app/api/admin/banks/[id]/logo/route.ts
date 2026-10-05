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
    if (access.includes('manage')) return u
  }
  return null
}

// POST /api/admin/banks/[id]/logo — upload bank logo
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const bank = await db.bankDetail.findUnique({ where: { id } })
  if (!bank) return NextResponse.json({ error: 'Bank not found' }, { status: 404 })

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
  const fname = `bank-logo-${randomBytes(6).toString('hex')}.${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, fname), Buffer.from(await file.arrayBuffer()))
  const logoPath = `/uploads/${fname}`

  // delete old logo if existed
  if (bank.logoPath) {
    try { await fs.unlink(path.join(process.cwd(), 'public', bank.logoPath)) } catch { /* ignore */ }
  }

  await db.bankDetail.update({ where: { id }, data: { logoPath } })

  return NextResponse.json({ ok: true, logoPath })
}

// DELETE /api/admin/banks/[id]/logo — remove bank logo
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAdminOrStaff()
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const bank = await db.bankDetail.findUnique({ where: { id } })
  if (!bank) return NextResponse.json({ error: 'Bank not found' }, { status: 404 })

  if (bank.logoPath) {
    try { await fs.unlink(path.join(process.cwd(), 'public', bank.logoPath)) } catch { /* ignore */ }
    await db.bankDetail.update({ where: { id }, data: { logoPath: null } })
  }

  return NextResponse.json({ ok: true })
}
