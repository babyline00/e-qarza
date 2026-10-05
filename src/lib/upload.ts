import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function saveUpload(req: NextRequest, field: string): Promise<{ path: string; error?: string; status?: number }> {
  const formData = await req.formData()
  const file = formData.get(field)
  if (!file || !(file instanceof File)) {
    return { path: '', error: `File ${field} is required`, status: 400 }
  }
  if (file.size > MAX_SIZE) {
    return { path: '', error: 'File too large (max 5MB)', status: 400 }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { path: '', error: 'Only JPG, PNG, WEBP images allowed', status: 400 }
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const fname = `${randomBytes(12).toString('hex')}.${safeExt}`
  const fpath = path.join(UPLOAD_DIR, fname)
  const buf = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(fpath, buf)
  return { path: `/uploads/${fname}` }
}
