'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fmtPKR } from '@/lib/format'
import type { AppData } from '@/lib/store'

interface Props {
  application: AppData
}

// Builds a cumulative-repayment-over-time chart from the installments list.
// Each point = cumulative amount paid up to that installment number.
export function RepaymentChart({ application }: Props) {
  const installments = application.installments || []

  const data = useMemo(() => {
    // build cumulative-paid series without reassigning an outer variable
    return installments.reduce<Array<{ label: string; amount: number; cumulative: number; status: string }>>((acc, i) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
      const add = i.status === 'paid' ? i.amount : 0
      acc.push({
        label: `#${i.number}`,
        amount: add,
        cumulative: prev + add,
        status: i.status,
      })
      return acc
    }, [])
  }, [installments])

  const totalPayable = installments.reduce((s, i) => s + i.amount, 0)
  const paid = installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const remaining = totalPayable - paid

  if (installments.length === 0) return null

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
              <path d="M3 17l5-5 4 4 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h3 className="text-sm font-bold">Repayment Progress</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Paid {fmtPKR(paid)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">Left {fmtPKR(remaining)}</span>
          </div>
        </div>
      </div>

      <div className="h-44 w-full px-2 py-3 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="repayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.70 0.19 45)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.70 0.19 45)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 60)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'oklch(0.52 0.015 40)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'oklch(0.52 0.015 40)' }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => `${(v / 100000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid oklch(0.92 0.005 60)',
                fontSize: 12,
                padding: '4px 8px',
              }}
              formatter={(value: number) => [fmtPKR(value), 'Cumulative']}
              labelFormatter={(l: string) => `Installment ${l}`}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="oklch(0.70 0.19 45)"
              strokeWidth={2.5}
              fill="url(#repayGrad)"
              dot={{ r: 3, fill: 'oklch(0.70 0.19 45)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
