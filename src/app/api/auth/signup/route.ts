import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, setSession, getSessionUser } from '@/lib/auth'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // rate limit: 8 signups per IP per minute
  const ip = getClientIP(req)
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { phone, password, name } = body as { phone?: string; password?: string; name?: string }
  if (!phone || !password) {
    return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 })
  }
  // validate Pakistani phone: 03XXXXXXXXX (11 digits)
  const normalizedPhone = phone.replace(/[^0-9]/g, '')
  if (!/^03\d{9}$/.test(normalizedPhone)) {
    return NextResponse.json({ error: 'Phone number must be 11 digits starting with 03 (e.g. 03001234567)' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { phone: normalizedPhone } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this phone number already exists. Please login instead.' }, { status: 409 })
  }
  const user = await db.user.create({
    data: {
      phone: normalizedPhone,
      name: name?.trim() || null,
      passwordHash: hashPassword(password),
      stage: 'kyc',
    },
  })
  await setSession(user.id)
  return NextResponse.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    stage: user.stage,
  })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
    stage: user.stage,
    avatarPath: user.avatarPath,
    kyc: user.kycProfile
      ? {
          status: user.kycProfile.status,
          cnicName: user.kycProfile.cnicName,
          fatherName: user.kycProfile.fatherName,
          dob: user.kycProfile.dob,
          phoneNumber: user.kycProfile.phoneNumber,
          education: user.kycProfile.education,
          maritalStatus: user.kycProfile.maritalStatus,
          gender: user.kycProfile.gender,
          city: user.kycProfile.city,
          address: user.kycProfile.address,
          occupation: user.kycProfile.occupation,
          monthlyIncome: user.kycProfile.monthlyIncome,
          employment: user.kycProfile.employment,
          referenceName: user.kycProfile.referenceName,
          referencePhone: user.kycProfile.referencePhone,
          referenceRelation: user.kycProfile.referenceRelation,
          rejectReason: user.kycProfile.rejectReason,
        }
      : null,
  })
}
