import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me'
const SESSION_COOKIE = 'ln_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// ---------- password hashing (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// ---------- session cookie (HMAC-signed payload) ----------
function sign(payload: string): string {
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf('.')
  if (idx === -1) return null
  const payload = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  if (sig.length !== expected.length) return null
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
  } catch {
    return null
  }
  return payload
}

export async function setSession(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = JSON.stringify({ uid: userId, exp: expires })
  const token = sign(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionUser() {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const payload = verify(token)
    if (!payload) return null
    const data = JSON.parse(payload)
    if (!data?.uid || !data?.exp) return null
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    const user = await db.user.findUnique({
      where: { id: data.uid },
      include: { kycProfile: true },
    })
    return user
  } catch {
    return null
  }
}

// ---------- helpers exposed to API routes ----------
export function requireUser(user: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!user) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  }
  return { user } as const
}

// ---------- money helpers (minor units <-> rupees) ----------
export function toMinor(rupees: number): number {
  return Math.round(rupees * 100)
}
export function toRupees(minor: number): number {
  return minor / 100
}
export function formatPKR(minor: number): string {
  return 'Rs ' + (minor / 100).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
