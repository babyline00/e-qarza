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
  const { phone, password } = body as { phone?: string; password?: string }
  if (!phone || !password) {
    return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 })
  }

  // normalize phone: strip all non-digits
  const normalizedPhone = phone.replace(/[^0-9]/g, '')
  if (!/^03\d{9}$/.test(normalizedPhone)) {
    return NextResponse.json({ error: 'Phone number must be 11 digits starting with 03 (e.g. 03001234567)' }, { status: 400 })
  }

  // Also accept admin login via phone (admin accounts have phone set)
  const user = await db.user.findUnique({
    where: { phone: normalizedPhone },
    include: { kycProfile: true },
  })

  // If user not found by phone, try email (backwards compat for admin/staff)
  if (!user) {
    // try email lookup as fallback (for admin accounts that might login with email)
    const emailUser = await db.user.findFirst({
      where: { email: phone.trim().toLowerCase() },
      include: { kycProfile: true },
    })
    if (emailUser) {
      // Found by email — check password (do NOT redirect to signup, account exists)
      if (!verifyPassword(password, emailUser.passwordHash)) {
        return NextResponse.json({ error: 'Invalid password. Please try again.' }, { status: 401 })
      }
      await setSession(emailUser.id)
      return NextResponse.json({
        id: emailUser.id,
        phone: emailUser.phone,
        email: emailUser.email,
        name: emailUser.name,
        role: emailUser.role,
        stage: emailUser.stage,
        kyc: emailUser.kycProfile
          ? {
              status: emailUser.kycProfile.status,
              cnicName: emailUser.kycProfile.cnicName,
              fatherName: emailUser.kycProfile.fatherName,
              dob: emailUser.kycProfile.dob,
              phoneNumber: emailUser.kycProfile.phoneNumber,
              education: emailUser.kycProfile.education,
              maritalStatus: emailUser.kycProfile.maritalStatus,
              gender: emailUser.kycProfile.gender,
              city: emailUser.kycProfile.city,
              address: emailUser.kycProfile.address,
              occupation: emailUser.kycProfile.occupation,
              monthlyIncome: emailUser.kycProfile.monthlyIncome,
              employment: emailUser.kycProfile.employment,
              referenceName: emailUser.kycProfile.referenceName,
              referencePhone: emailUser.kycProfile.referencePhone,
              referenceRelation: emailUser.kycProfile.referenceRelation,
              rejectReason: emailUser.kycProfile.rejectReason,
            }
          : null,
      })
    }

    // Phone truly not found — redirect to signup
    return NextResponse.json({
      error: 'No account found with this phone number. Please sign up to create an account.',
      redirectSignup: true,
    }, { status: 404 })
  }

  // User found by phone — check password (do NOT redirect to signup, account exists)
  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid password. Please try again or reset your password.' }, { status: 401 })
  }

  // Check if user is banned
  if (user.banned && user.role !== 'admin') {
    return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 })
  }

  await setSession(user.id)
  return NextResponse.json({
    id: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
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
