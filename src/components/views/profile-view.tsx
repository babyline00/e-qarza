'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { AvatarUpload } from '@/components/shared/avatar-upload'
import { ChangePasswordCard } from './change-password-card'
import { ProfileEditCard } from './profile-edit-card'
import { fmtRupees, fmtDate } from '@/lib/format'
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Users, IdCard, BadgeCheck } from 'lucide-react'

export function ProfileView({ onRefresh }: { onRefresh?: () => void }) {
  const { user, kyc } = useAppStore()
  if (!user) return null

  const initials = (user.name || user.email).slice(0, 2).toUpperCase()
  const isVerified = kyc?.status === 'approved'

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

      {/* Profile header card */}
      <Card className="mt-6 overflow-hidden rounded-2xl shadow-sm">
        <div className="bg-brand-gradient px-5 py-6 text-white">
          <div className="flex items-center gap-4">
            <AvatarUpload onUploaded={onRefresh} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{user.name || 'User'}</h2>
              <p className="truncate text-sm text-white/85">{user.email}</p>
              {isVerified && (
                <Badge className="mt-1.5 gap-1 bg-success text-success-foreground border-0 hover:bg-success">
                  <BadgeCheck className="size-3.5" /> Verified User
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {rows.map((r, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <r.icon className="size-4" />
                </span>
                <span className="w-32 shrink-0 text-xs text-muted-foreground sm:text-sm sm:w-40">{r.label}</span>
                <span className="ml-auto text-right text-sm font-medium">{r.value}</span>
              </div>
              {i < rows.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {kyc?.referenceName && (
        <Card className="mt-4 overflow-hidden rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <h3 className="text-sm font-bold">Reference Contact</h3>
          </div>
          <CardContent className="p-0">
            {refRows.map((r, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="size-4" />
                  </span>
                  <span className="w-32 shrink-0 text-xs text-muted-foreground sm:text-sm sm:w-40">{r.label}</span>
                  <span className="ml-auto text-right text-sm font-medium">{r.value}</span>
                </div>
                {i < refRows.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mt-4">
        <ProfileEditCard />
      </div>

      <div className="mt-4">
        <ChangePasswordCard />
      </div>
    </div>
  )
}
