'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import { fmtPKR } from '@/lib/format'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  planId: string
}

interface EligibilityData {
  eligible: boolean
  reason: string
  maxAffordableAmount: number
  dti: number | null
  planName: string
  amount: number
}

export function EligibilityBadge({ planId }: Props) {
  const [data, setData] = useState<EligibilityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api<EligibilityData>(`/api/plans/apply?planId=${planId}`)
      .then((r) => { if (!cancelled) setData(r) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [planId])

  if (loading) {
    return <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
  }
  if (!data) return null

  if (data.eligible) {
    return (
      <Badge className="gap-1 bg-success/15 text-success border-0 text-[10px] h-5 shrink-0">
        <CheckCircle2 className="size-3" /> {data.dti}% DTI
      </Badge>
    )
  }
  return (
    <Badge className="gap-1 bg-destructive/10 text-destructive border-0 text-[10px] h-5 shrink-0" title={data.reason}>
      <AlertTriangle className="size-3" /> Not eligible
    </Badge>
  )
}
