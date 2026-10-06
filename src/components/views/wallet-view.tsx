'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { InstallmentPaymentDialog } from '@/components/shared/installment-payment-dialog'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDate, fmtDateTime, timeAgo } from '@/lib/format'
import { toast } from 'sonner'
import {
  Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Download, Loader2,
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Banknote, History,
  ShieldAlert, CreditCard, Hourglass, Lock,
} from 'lucide-react'

interface FirstInstallment {
  id: string
  number: number
  amount: number
  dueDate: string
  status: string // pending | verifying | paid | overdue
}

interface WalletData {
  wallet: { id: string; balance: number }
  transactions: {
    id: string
    type: string
    amount: number
    description: string | null
    referenceId: string | null
    createdAt: string
  }[]
  withdrawals: {
    id: string
    amount: number
    status: string
    bankName: string | null
    accountNumber: string | null
    iban: string | null
    rejectReason: string | null
    createdAt: string
    reviewedAt: string | null
  }[]
  loanBreakdown?: {
    applicationId: string
    planName: string
    principal: number
    processingFee: number
    netDisbursed: number
    interestRate: number
    tenureMonths: number
    activatedAt: string | null
  } | null
  firstInstallment?: FirstInstallment | null
}

const TXN_ICONS: Record<string, React.ElementType> = {
  loan_disbursement: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  refund: ArrowDownToLine,
  installment_payment: ArrowUpFromLine,
  processing_fee: ArrowUpFromLine,
}

const TXN_LABELS: Record<string, string> = {
  loan_disbursement: 'Loan Disbursement',
  withdrawal: 'Withdrawal',
  refund: 'Refund',
  installment_payment: 'Installment Payment',
  processing_fee: 'Processing Fee',
}

export function WalletView() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showFirstInstGate, setShowFirstInstGate] = useState(false)
  const [payFirstInstallment, setPayFirstInstallment] = useState<FirstInstallment | null>(null)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [iban, setIban] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api<WalletData>('/api/wallet')
      setData(r)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function submitWithdraw() {
    if (!amount || !bankName || !accountNumber || !iban) {
      toast.error('Please fill all fields')
      return
    }
    setSubmitting(true)
    try {
      await api('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), bankName, accountNumber, iban }),
      })
      toast.success('Withdrawal requested! Pending admin review.')
      setShowWithdraw(false)
      setAmount('')
      setBankName('')
      setAccountNumber('')
      setIban('')
      load()
    } catch (e) {
      const err = e as Error & { code?: string; firstInstallment?: FirstInstallment }
      // If the server says the first installment must be paid first, close the
      // withdraw modal and open the first-installment gate instead.
      if (err.code === 'FIRST_INSTALLMENT_REQUIRED' && err.firstInstallment) {
        setShowWithdraw(false)
        setPayFirstInstallment(err.firstInstallment)
        setShowFirstInstGate(false) // gate is superseded by the payment dialog
        toast.info(err.message)
      } else {
        toast.error(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-32 rounded-2xl mb-4" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }
  if (!data) return null

  const balance = data.wallet.balance
  const pendingWithdrawals = data.withdrawals.filter((w) => w.status === 'pending')

  // Withdrawal gate: the user must have paid the first installment of their
  // active loan before they can withdraw funds to their bank account.
  const firstInst = data.firstInstallment
  const withdrawalBlocked = !!firstInst && firstInst.status !== 'paid'
  const firstInstVerifying = firstInst?.status === 'verifying'

  // Called when the user clicks "Withdraw Funds".
  function handleWithdrawClick() {
    if (withdrawalBlocked) {
      // Show the first-installment gate instead of the withdraw form.
      setShowFirstInstGate(true)
      return
    }
    setShowWithdraw(true)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      {/* Wallet Balance Hero */}
      <Card className="overflow-hidden rounded-2xl animate-fade-up">
        <div className="bg-brand-gradient p-6 text-white relative overflow-hidden">
          <WalletIcon className="pointer-events-none absolute right-2 top-2 size-24 text-white/10" strokeWidth={1.5} />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">E-Qarza Wallet Balance</p>
            <p className="mt-2 text-4xl font-extrabold">{fmtPKR(balance)}</p>
            <p className="mt-1 text-xs opacity-80">
              {pendingWithdrawals.length > 0
                ? `${pendingWithdrawals.length} withdrawal request${pendingWithdrawals.length > 1 ? 's' : ''} pending`
                : 'Available for withdrawal or use'}
            </p>
            <Button
              className="mt-4 bg-white text-brand hover:bg-white/90 font-semibold"
              onClick={handleWithdrawClick}
              disabled={balance < 10000}
            >
              {withdrawalBlocked ? <Lock className="size-4" /> : <ArrowUpFromLine className="size-4" />}
              {withdrawalBlocked ? 'Withdraw Funds' : 'Withdraw Funds'}
            </Button>
          </div>
        </div>
      </Card>

      {/* First-Installment Gate Banner */}
      {withdrawalBlocked && (
        <Card className={`rounded-2xl ${firstInstVerifying ? 'border-amber-200 bg-amber-50' : 'border-primary/30 bg-primary/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className={`grid size-10 place-items-center rounded-xl shrink-0 ${firstInstVerifying ? 'bg-amber-100 text-amber-600' : 'bg-primary/15 text-primary'}`}>
                {firstInstVerifying ? <Hourglass className="size-5" /> : <ShieldAlert className="size-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${firstInstVerifying ? 'text-amber-800' : 'text-foreground'}`}>
                  {firstInstVerifying
                    ? 'First Installment Under Verification'
                    : 'Pay Your First Installment to Unlock Withdrawals'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {firstInstVerifying
                    ? 'Your first installment payment proof is being reviewed. Once approved, withdrawals will be enabled automatically.'
                    : 'To withdraw funds to your bank account, you must first pay the first installment of your active loan. Upload your payment proof below.'}
                </p>
                {firstInst && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">
                      Installment #{firstInst.number} • <span className="font-semibold text-foreground">{fmtPKR(firstInst.amount)}</span>
                    </span>
                    <span className="text-muted-foreground">Due {fmtDate(firstInst.dueDate)}</span>
                  </div>
                )}
                {!firstInstVerifying && firstInst && (
                  <Button
                    size="sm"
                    className="mt-3 bg-brand-gradient text-white hover:opacity-90 gap-1.5"
                    onClick={() => setPayFirstInstallment(firstInst)}
                  >
                    <CreditCard className="size-4" /> Pay First Installment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Breakdown — Balance = Loan (Principal) − Processing Fee */}
      {data.loanBreakdown && (
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" /> Loan Disbursed
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {data.loanBreakdown.planName} • {data.loanBreakdown.tenureMonths} mo
              </Badge>
            </div>

            {/* Breakdown rows */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-success" /> Loan Principal
                </span>
                <span className="font-semibold text-success">+ {fmtPKR(data.loanBreakdown.principal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <TrendingDown className="size-3.5 text-destructive" /> Processing Fee
                </span>
                <span className="font-semibold text-destructive">− {fmtPKR(data.loanBreakdown.processingFee)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <ArrowDownToLine className="size-3.5 text-primary" /> Credited to Wallet
                </span>
                <span className="font-bold text-primary">{fmtPKR(data.loanBreakdown.netDisbursed)}</span>
              </div>
            </div>

            {/* Verification success banner */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              <p className="text-[11px] text-success font-medium">
                Verification successful — loan amount (minus fee) has been added to your wallet balance.
              </p>
            </div>

            {data.loanBreakdown.activatedAt && (
              <p className="mt-2 text-[10px] text-muted-foreground text-right">
                Activated on {fmtDateTime(data.loanBreakdown.activatedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-3.5 text-center">
            <ArrowDownToLine className="size-5 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total In</p>
            <p className="text-sm font-bold">
              {fmtPKR(data.transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3.5 text-center">
            <ArrowUpFromLine className="size-5 text-destructive mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Out</p>
            <p className="text-sm font-bold">
              {fmtPKR(Math.abs(data.transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)))}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3.5 text-center">
            <History className="size-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-sm font-bold">{data.transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Pending Withdrawal Requests</p>
            </div>
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-amber-700">{fmtPKR(w.amount)} → {w.bankName}</span>
                <span className="text-amber-600">{timeAgo(w.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="size-4 text-primary" /> Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
              {data.transactions.map((t) => {
                const Icon = TXN_ICONS[t.type] || Banknote
                const isCredit = t.amount > 0
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/40 transition">
                    <span className={`grid size-9 place-items-center rounded-lg shrink-0 ${isCredit ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{TXN_LABELS[t.type] || t.type}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t.description || '—'} • {fmtDateTime(t.createdAt)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${isCredit ? 'text-success' : 'text-destructive'}`}>
                      {isCredit ? '+' : ''}{fmtPKR(Math.abs(t.amount))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      {data.withdrawals.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpFromLine className="size-4 text-primary" /> Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {data.withdrawals.map((w) => {
                const statusConfig = {
                  pending: { icon: Clock, cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
                  completed: { icon: CheckCircle2, cls: 'bg-success/15 text-success', label: 'Completed' },
                  rejected: { icon: XCircle, cls: 'bg-destructive/10 text-destructive', label: 'Rejected' },
                }
                const sc = statusConfig[w.status as keyof typeof statusConfig] || statusConfig.pending
                const SIcon = sc.icon
                return (
                  <div key={w.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <span className={`grid size-8 place-items-center rounded-lg shrink-0 ${sc.cls}`}>
                      <SIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{fmtPKR(w.amount)}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {w.bankName} • {w.accountNumber} • {fmtDateTime(w.createdAt)}
                      </p>
                      {w.rejectReason && (
                        <p className="text-[11px] text-destructive mt-0.5">⚠ {w.rejectReason}</p>
                      )}
                    </div>
                    <Badge className={`text-[10px] border-0 ${sc.cls}`}>{sc.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="size-5 text-primary" /> Withdraw Funds
            </DialogTitle>
            <DialogDescription>
              Transfer from your E-Qarza wallet to your bank account.
              Available: <strong className="text-foreground">{fmtPKR(balance)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="w-amount">Amount (Rs)</Label>
              <Input
                id="w-amount"
                type="number"
                min={100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
              />
              <p className="text-[11px] text-muted-foreground">Minimum: Rs 100</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-bank">Bank Name</Label>
              <Input id="w-bank" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HBL" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-acc">Account Number</Label>
              <Input id="w-acc" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0011223345678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-iban">IBAN</Label>
              <Input id="w-iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PK36HABB0000011223345678" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white hover:opacity-90" onClick={submitWithdraw} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpFromLine className="size-4" />}
              Request Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* First-Installment Gate Dialog — shown when user clicks Withdraw Funds
          but hasn't paid their first installment yet. */}
      <Dialog open={showFirstInstGate} onOpenChange={setShowFirstInstGate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" /> Withdrawal Locked
            </DialogTitle>
            <DialogDescription>
              You need to pay your first installment before you can withdraw funds to your bank account.
            </DialogDescription>
          </DialogHeader>
          {firstInst && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Installment</span>
                <span className="font-semibold">#{firstInst.number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{fmtPKR(firstInst.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-semibold">{fmtDate(firstInst.dueDate)}</span>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Pay this installment now by uploading your payment proof. Once the admin verifies your payment, withdrawals will be unlocked automatically.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowFirstInstGate(false)}>Later</Button>
            <Button
              className="bg-brand-gradient text-white hover:opacity-90 gap-1.5"
              onClick={() => {
                if (!firstInst) return
                setShowFirstInstGate(false)
                setPayFirstInstallment(firstInst)
              }}
            >
              <CreditCard className="size-4" /> Pay First Installment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Installment Payment Dialog — proof upload for the first installment */}
      <InstallmentPaymentDialog
        installment={payFirstInstallment}
        onClose={() => setPayFirstInstallment(null)}
        onPaid={load}
      />
    </div>
  )
}
