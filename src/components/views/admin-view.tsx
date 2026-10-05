'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { AdminManageTab } from './admin-manage-tab'
import { AdminUsersTab } from './admin-users-tab'
import { AdminAnalyticsTab } from './admin-analytics-tab'
import { AdminApplicationsTab } from './admin-applications-tab'
import { AdminWithdrawalsTab } from './admin-withdrawals-tab'
import { AdminSettingsTab } from './admin-settings-tab'
import { useNotificationSound } from '@/lib/use-notification-sound'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  ShieldCheck, Banknote, Check, X, Loader2, Inbox, User as UserIcon, FileImage,
  RefreshCw, Settings, Users, BarChart3, FileText, ArrowUpFromLine, Code,
} from 'lucide-react'

interface KycItem {
  id: string
  cnicName: string | null
  fatherName: string | null
  dob: string | null
  phoneNumber: string | null
  city: string | null
  occupation: string | null
  cnicFrontPath: string | null
  cnicBackPath: string | null
  selfiePath: string | null
  submittedAt: string | null
  user: { id: string; email: string; name: string | null }
}

interface PaymentItem {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  applicationId: string | null
  type: string
  amount: number
  status: string
  txnRef: string | null
  proofPath: string | null
  createdAt: string
  planName: string | null
  installmentNumber: number | null
}

interface SidebarItem {
  key: string
  label: string
  icon: React.ElementType
  badge?: number
}

export function AdminView() {
  const { user } = useAppStore()
  const [kycs, setKycs] = useState<KycItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')
  const [acting, setActing] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Play sound when new KYC/payment submissions arrive
  useNotificationSound(true, 10000)

  // determine accessible tabs based on role
  const isStaff = user?.role === 'staff'
  const staffAccess = isStaff ? (user?.staffAccess || '').split(',').filter(Boolean) : []
  const canAccess = (tab: string) => !isStaff || staffAccess.includes(tab)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [k, p] = await Promise.all([
        canAccess('kyc') ? api<{ profiles: KycItem[] }>('/api/admin/kyc') : Promise.resolve({ profiles: [] }),
        canAccess('payments') ? api<{ payments: PaymentItem[] }>('/api/admin/payment') : Promise.resolve({ payments: [] }),
      ])
      setKycs(k.profiles)
      setPayments(p.payments)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [load])

  async function actKyc(kycId: string, action: 'approve' | 'reject') {
    setActing(kycId)
    try {
      await api('/api/admin/kyc', { method: 'POST', body: JSON.stringify({ kycId, action }) })
      toast.success(action === 'approve' ? 'KYC approved' : 'KYC rejected')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActing(null)
    }
  }

  async function actPayment(paymentId: string, action: 'approve' | 'reject') {
    setActing(paymentId)
    try {
      await api('/api/admin/payment', { method: 'POST', body: JSON.stringify({ paymentId, action }) })
      toast.success(action === 'approve' ? 'Payment approved' : 'Payment rejected')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActing(null)
    }
  }

  // Build sidebar items
  const sidebarItems: SidebarItem[] = [
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'kyc', label: 'KYC Review', icon: ShieldCheck, badge: kycs.length },
    { key: 'payments', label: 'Payments', icon: Banknote, badge: payments.length },
    { key: 'applications', label: 'Applications', icon: FileText },
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
    { key: 'manage', label: 'Manage', icon: Settings },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: Code },
  ].filter((item) => canAccess(item.key))

  // Set default tab to first accessible
  useEffect(() => {
    if (sidebarItems.length > 0 && !canAccess(activeTab)) {
      setActiveTab(sidebarItems[0].key)
    }
  }, [sidebarItems.length])

  function renderContent() {
    switch (activeTab) {
      case 'analytics': return <AdminAnalyticsTab onNavigate={setActiveTab} />
      case 'kyc': return <KycReviewContent kycs={kycs} loading={loading} acting={acting} actKyc={actKyc} />
      case 'payments': return <PaymentsContent payments={payments} loading={loading} acting={acting} actPayment={actPayment} />
      case 'applications': return <AdminApplicationsTab />
      case 'withdrawals': return <AdminWithdrawalsTab />
      case 'manage': return <AdminManageTab />
      case 'users': return <AdminUsersTab />
      case 'settings': return <AdminSettingsTab />
      default: return <AdminAnalyticsTab onNavigate={setActiveTab} />
    }
  }

  const activeItem = sidebarItems.find((i) => i.key === activeTab)

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="grid size-9 place-items-center rounded-lg hover:bg-accent transition shrink-0 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-white shrink-0">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold truncate">Admin Dashboard</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {isStaff ? `Staff: ${user?.name || user?.email}` : 'Administrator'}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8 gap-1.5 shrink-0">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="sticky top-14 hidden w-56 shrink-0 self-start border-r bg-muted/20 lg:block" style={{ height: 'calc(100vh - 3.5rem)' }}>
          <nav className="space-y-0.5 p-3">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                  activeTab === item.key
                    ? 'bg-brand-gradient text-white font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <Badge className={cn(
                    'h-5 min-w-5 px-1 text-[10px] border-0',
                    activeTab === item.key ? 'bg-white/25 text-white' : 'bg-primary text-primary-foreground'
                  )}>
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r shadow-xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 items-center gap-3 border-b px-4">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient text-white">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="font-bold text-sm">Admin Panel</span>
                <Button size="sm" variant="ghost" className="ml-auto h-8 w-8 p-0" onClick={() => setSidebarOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <nav className="space-y-0.5 p-3">
                {sidebarItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveTab(item.key); setSidebarOpen(false) }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                      activeTab === item.key
                        ? 'bg-brand-gradient text-white font-medium'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <Badge className={cn(
                        'h-5 min-w-5 px-1 text-[10px] border-0',
                        activeTab === item.key ? 'bg-white/25 text-white' : 'bg-primary text-primary-foreground'
                      )}>
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-5xl">
            {/* Mobile tab label */}
            <div className="mb-4 lg:hidden">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {activeItem && <activeItem.icon className="size-5 text-primary" />}
                {activeItem?.label}
              </h2>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

// --- KYC Review Content ---
function KycReviewContent({ kycs, loading, acting, actKyc }: {
  kycs: KycItem[]
  loading: boolean
  acting: string | null
  actKyc: (id: string, action: 'approve' | 'reject') => void
}) {
  if (loading && kycs.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading KYC applications…</span>
      </div>
    )
  }

  if (kycs.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-12 text-center">
          <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-7" />
          </span>
          <p className="font-medium">No pending KYCs</p>
          <p className="text-sm text-muted-foreground mt-1">Submitted KYC applications will appear here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {kycs.map((k) => (
        <Card key={k.id} className="rounded-2xl overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserIcon className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold">{k.cnicName || '—'}</h3>
                <p className="text-xs text-muted-foreground">{k.user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-amber-700 bg-amber-100 border-0">Pending Review</Badge>
          </div>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Father/Husband</p><p className="font-medium">{k.fatherName || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">DOB</p><p className="font-medium">{k.dob || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{k.phoneNumber || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">City</p><p className="font-medium">{k.city || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Occupation</p><p className="font-medium">{k.occupation || '—'}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><FileImage className="size-3" /> Documents</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'CNIC Front', path: k.cnicFrontPath },
                  { label: 'CNIC Back', path: k.cnicBackPath },
                  { label: 'Selfie', path: k.selfiePath },
                ].map((d) => (
                  <a key={d.label} href={d.path || '#'} target="_blank" rel="noreferrer" className="block rounded-md border overflow-hidden hover:ring-2 ring-primary/40 transition">
                    {d.path ? <img src={d.path} alt={d.label} className="aspect-video w-full object-cover" /> : <div className="aspect-video grid place-items-center text-xs text-muted-foreground">Missing</div>}
                    <p className="text-xs text-center py-1 border-t bg-muted/30">{d.label}</p>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => actKyc(k.id, 'approve')} disabled={acting === k.id}>
                {acting === k.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => actKyc(k.id, 'reject')} disabled={acting === k.id}>
                <X className="size-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Payments Review Content ---
function PaymentsContent({ payments, loading, acting, actPayment }: {
  payments: PaymentItem[]
  loading: boolean
  acting: string | null
  actPayment: (id: string, action: 'approve' | 'reject') => void
}) {
  if (loading && payments.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading payments…</span>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-12 text-center">
          <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Banknote className="size-7" />
          </span>
          <p className="font-medium">No pending payments</p>
          <p className="text-sm text-muted-foreground mt-1">Submitted payment proofs will appear here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((p) => (
        <Card key={p.id} className="rounded-2xl">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b bg-muted/30 px-5 py-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Banknote className="size-4" />
                {p.type === 'processing_fee' ? 'Processing Fee' : `Installment #${p.installmentNumber}`}
              </h3>
              <p className="text-xs text-muted-foreground">{p.userName || p.userEmail} • {p.planName ? `${p.planName} plan • ` : ''}{fmtDateTime(p.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{fmtPKR(p.amount)}</p>
              <Badge variant="outline">Pending</Badge>
            </div>
          </div>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Transaction Ref</p><p className="font-mono text-xs">{p.txnRef || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium capitalize">{p.type.replace('_', ' ')}</p></div>
            </div>
            {p.proofPath && (
              <a href={p.proofPath} target="_blank" rel="noreferrer" className="block rounded-md border overflow-hidden hover:ring-2 ring-primary/40 transition">
                <img src={p.proofPath} alt="Payment proof" className="max-h-64 w-full object-contain bg-muted/30" />
                <p className="text-xs text-center py-1.5 border-t bg-muted/30">Click to view full size</p>
              </a>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="bg-success text-white hover:bg-success/90" onClick={() => actPayment(p.id, 'approve')} disabled={acting === p.id}>
                {acting === p.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => actPayment(p.id, 'reject')} disabled={acting === p.id}>
                <X className="size-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
