import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// POST /api/kyc/update — allow users to update non-identity fields after KYC approval
// (phone, address, city, occupation, monthlyIncome). Identity fields (cnicName, fatherName, dob)
// remain locked once verified.
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { phone, address, city, occupation, monthlyIncome } = body as {
    phone?: string; address?: string; city?: string; occupation?: string; monthlyIncome?: number
  }

  // validate phone if provided
  if (phone !== undefined) {
    const p = phone.trim()
    if (p && !/^03\d{9}$/.test(p)) {
      return NextResponse.json({ error: 'Phone must be 11 digits starting with 03' }, { status: 400 })
    }
  }
  if (monthlyIncome !== undefined && (!Number.isFinite(monthlyIncome) || monthlyIncome < 0)) {
    return NextResponse.json({ error: 'Monthly income must be a valid number' }, { status: 400 })
  }

  const kyc = await db.kycProfile.findUnique({ where: { userId: user.id } })
  if (!kyc) return NextResponse.json({ error: 'Complete your KYC first' }, { status: 400 })

  await db.kycProfile.update({
    where: { userId: user.id },
    data: {
      ...(phone !== undefined ? { phoneNumber: phone.trim() || null } : {}),
      ...(address !== undefined ? { address: address.trim() || null } : {}),
      ...(city !== undefined ? { city: city.trim() || null } : {}),
      ...(occupation !== undefined ? { occupation: occupation.trim() || null } : {}),
      ...(monthlyIncome !== undefined ? { monthlyIncome: Math.round(Number(monthlyIncome) * 100) } : {}),
    },
  })

  // sync phone to user table if changed
  if (phone !== undefined) {
    await db.user.update({ where: { id: user.id }, data: { phone: phone.trim() || null } })
  }

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Profile Updated',
      message: 'Your contact details have been updated successfully.',
      type: 'success',
    },
  })

  return NextResponse.json({ ok: true })
}
