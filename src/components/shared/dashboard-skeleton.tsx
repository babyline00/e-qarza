'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* greeting skeleton */}
      <div className="flex items-center justify-between pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* hero skeleton */}
      <Card className="overflow-hidden rounded-2xl border-0 shadow-md">
        <div className="bg-brand-gradient p-5">
          <Skeleton className="h-3 w-28 bg-white/30" />
          <Skeleton className="h-9 w-44 mt-2 bg-white/40" />
          <Skeleton className="h-3 w-32 mt-2 bg-white/30" />
          <Skeleton className="h-7 w-24 mt-3 rounded-lg bg-white/30" />
        </div>
      </Card>

      {/* quick actions skeleton */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-3.5 flex flex-col items-center gap-2">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* overview skeleton */}
      <Card className="mt-4 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
