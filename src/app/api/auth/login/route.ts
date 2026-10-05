import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, setSession } from '@/lib/auth'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // rate limit: 8 attempts per IP per minute
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
  const { email, password } = body as { email?: string; password?: string }
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  const normalized = email.trim().toLowerCase()
  const user = await db.user.findUnique({
    where: { email: normalized },
    include: { kycProfile: true },
  })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  await setSession(user.id)
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    stage: user.stage,
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
