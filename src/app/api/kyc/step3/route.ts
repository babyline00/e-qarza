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

  const referenceName = String(body.referenceName || '').trim()
  const referencePhone = String(body.referencePhone || '').trim()
  const referenceRelation = String(body.referenceRelation || '').trim()
  const selfieMatched = body.selfieMatched === true

  if (!referenceName || !referencePhone || !referenceRelation) {
    return NextResponse.json({ error: 'All reference fields are required' }, { status: 400 })
  }
  if (!/^03\d{9}$/.test(referencePhone)) {
    return NextResponse.json({ error: 'Reference phone must be 11 digits starting with 03' }, { status: 400 })
  }

  // verify all 3 steps are filled
  const kyc = await db.kycProfile.findUnique({ where: { userId: user.id } })
  if (!kyc) return NextResponse.json({ error: 'Complete step 1 first' }, { status: 400 })
  const missing: string[] = []
  if (!kyc.cnicName || !kyc.cnicNumber || !kyc.fatherName || !kyc.dob || !kyc.phoneNumber) missing.push('step 1 identity')
  if (!kyc.cnicFrontPath || !kyc.cnicBackPath || !kyc.selfiePath) missing.push('step 1 documents')
  if (!kyc.education || !kyc.maritalStatus || !kyc.gender || !kyc.city || !kyc.address || !kyc.occupation || kyc.monthlyIncome == null || !kyc.employment) missing.push('step 2 financial')
  if (missing.length) {
    return NextResponse.json({ error: `Incomplete KYC: ${missing.join(', ')}` }, { status: 400 })
  }

  // If selfie matched CNIC front → auto-approve KYC (skip admin review)
  if (selfieMatched) {
    await db.kycProfile.update({
      where: { userId: user.id },
      data: {
        referenceName,
        referencePhone,
        referenceRelation,
        status: 'approved',
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
    })
    await db.user.update({ where: { id: user.id }, data: { stage: 'loan_select' } })

    await db.notification.create({
      data: {
        userId: user.id,
        title: 'KYC Auto-Approved ✅',
        message: 'Your identity was automatically verified (selfie matched CNIC). You can now browse and apply for loan plans!',
        type: 'success',
      },
    })

    return NextResponse.json({ ok: true, autoApproved: true })
  }

  // Normal flow — submit for manual admin review
  await db.kycProfile.update({
    where: { userId: user.id },
    data: {
      referenceName,
      referencePhone,
      referenceRelation,
      status: 'submitted',
      submittedAt: new Date(),
    },
  })
  await db.user.update({ where: { id: user.id }, data: { stage: 'kyc_pending' } })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'KYC Submitted',
      message: 'Your KYC application has been submitted and is under review. We will notify you once verified.',
      type: 'info',
    },
  })

  return NextResponse.json({ ok: true, autoApproved: false })
}
