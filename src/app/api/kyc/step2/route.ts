import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const education = String(body.education || '').trim()
  const maritalStatus = String(body.maritalStatus || '').trim()
  const gender = String(body.gender || '').trim()
  const city = String(body.city || '').trim()
  const address = String(body.address || '').trim()
  const occupation = String(body.occupation || '').trim()
  const employment = String(body.employment || '').trim()
  const monthlyIncomeRaw = body.monthlyIncome
  const monthlyIncome = Number(monthlyIncomeRaw)

  if (!education || !maritalStatus || !gender || !city || !address || !occupation || !employment) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
    return NextResponse.json({ error: 'Monthly income must be a valid number' }, { status: 400 })
  }

  const kyc = await db.kycProfile.update({
    where: { userId: user.id },
    data: {
      education,
      maritalStatus,
      gender,
      city,
      address,
      occupation,
      employment,
      // store as minor units (paisa). Input comes in rupees.
      monthlyIncome: Math.round(monthlyIncome * 100),
    },
  })

  return NextResponse.json({ ok: true, kyc: { status: kyc.status } })
}
