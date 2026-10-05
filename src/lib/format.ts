// Client-side display helpers (amounts stored as minor units = paisa)

export function fmtPKR(minor: number | null | undefined): string {
  if (minor == null) return 'Rs 0'
  return 'Rs ' + (minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

export function fmtRupees(minor: number | null | undefined): string {
  if (minor == null) return '0'
  return (minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return fmtDate(iso)
}

// loan math
export function loanTotals(amount: number, rate: number, tenureMonths: number) {
  const principal = amount
  const totalInterest = Math.round((principal * rate * tenureMonths) / (100 * 12))
  const totalPayable = principal + totalInterest
  const monthlyInstallment = Math.round(totalPayable / tenureMonths)
  return { principal, totalInterest, totalPayable, monthlyInstallment }
}
