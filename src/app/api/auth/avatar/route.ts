import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// POST /api/auth/avatar — upload user profile photo (multipart: avatar file)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('avatar')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Avatar image is required' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (max 2MB)' }, { status: 400 })
  }
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP allowed' }, { status: 400 })
  }

  // save file
  const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const fname = `avatar-${randomBytes(8).toString('hex')}.${safeExt}`
  await fs.writeFile(path.join(UPLOAD_DIR, fname), Buffer.from(await file.arrayBuffer()))
  const avatarPath = `/uploads/${fname}`

  // delete old avatar if it existed
  if (user.avatarPath) {
    const oldPath = path.join(process.cwd(), 'public', user.avatarPath)
    try { await fs.unlink(oldPath) } catch { /* ignore */ }
  }

  await db.user.update({ where: { id: user.id }, data: { avatarPath } })

  return NextResponse.json({ ok: true, avatarPath })
}
