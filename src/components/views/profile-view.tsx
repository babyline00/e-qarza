'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { fmtRupees, fmtDate } from '@/lib/format'
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Users, ShieldCheck, IdCard } from 'lucide-react'

export function ProfileView() {
  const { user, kyc } = useAppStore()
  if (!user) return null

  const rows: { icon: React.ElementType; label: string; value: string | null }[] = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Phone', value: user.phone || kyc?.phoneNumber || '—' },
    { icon: User, label: 'Name (CNIC)', value: kyc?.cnicName || '—' },
    { icon: User, label: 'Father / Husband', value: kyc?.fatherName || '—' },
    { icon: IdCard, label: 'Date of Birth', value: kyc?.dob ? fmtDate(kyc.dob) : '—' },
    { icon: GraduationCap, label: 'Education', value: kyc?.education || '—' },
    { icon: Users, label: 'Marital Status', value: kyc?.maritalStatus || '—' },
    { icon: User, label: 'Gender', value: kyc?.gender || '—' },
    { icon: MapPin, label: 'City', value: kyc?.city || '—' },
    { icon: MapPin, label: 'Address', value: kyc?.address || '—' },
    { icon: Briefcase, label: 'Occupation', value: kyc?.occupation || '—' },
    { icon: Briefcase, label: 'Employment', value: kyc?.employment || '—' },
    { icon: Briefcase, label: 'Monthly Income', value: kyc?.monthlyIncome != null ? `Rs ${fmtRupees(kyc.monthlyIncome)}` : '—' },
  ]

  const refRows: { icon: React.ElementType; label: string; value: string | null }[] = [
    { icon: Users, label: 'Reference Name', value: kyc?.referenceName || '—' },
    { icon: Phone, label: 'Reference Phone', value: kyc?.referencePhone || '—' },
    { icon: Users, label: 'Relationship', value: kyc?.referenceRelation || '—' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="My Profile" description="Your account and verified KYC details." icon={User} />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{user.name || user.email}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
            <Badge variant={kyc?.status === 'approved' ? 'default' : 'secondary'} className="gap-1">
              <ShieldCheck className="size-3" />
              {kyc?.status === 'approved' ? 'Verified' : kyc?.status || 'Unverified'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {rows.map((r, i) => (
            <div key={i}>
              <div className="flex items-start gap-3 py-2.5">
                <r.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground w-40 shrink-0">{r.label}</span>
                <span className="text-sm font-medium text-right ml-auto">{r.value}</span>
              </div>
              {i < rows.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {kyc?.referenceName && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="size-5" /> Reference Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {refRows.map((r, i) => (
              <div key={i}>
                <div className="flex items-start gap-3 py-2.5">
                  <r.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground w-40 shrink-0">{r.label}</span>
                  <span className="text-sm font-medium text-right ml-auto">{r.value}</span>
                </div>
                {i < refRows.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
