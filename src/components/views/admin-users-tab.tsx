'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { api } from '@/lib/api-client'
import { fmtDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  Search, Loader2, Ban, ShieldCheck, Trash2, Users as UsersIcon, AlertTriangle,
} from 'lucide-react'

interface UserItem {
  id: string
  email: string
  name: string | null
  phone: string | null
  stage: string
  banned: boolean
  createdAt: string
  kycStatus: string | null
  cnicName: string | null
  applicationCount: number
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const r = await api<{ users: UserItem[] }>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      setUsers(r.users)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => load(query), 350)
    return () => clearTimeout(t)
  }, [query, load])

  async function act(userId: string, action: 'ban' | 'unban' | 'delete') {
    if (action === 'delete' && !confirm('Permanently delete this user and all their data?')) return
    setActing(userId + action)
    try {
      await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ userId, action }) })
      toast.success(action === 'ban' ? 'User banned' : action === 'unban' ? 'User restored' : 'User deleted')
      load(query)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setActing(null)
    }
  }

  const stageLabel: Record<string, { label: string; cls: string }> = {
    auth: { label: 'New', cls: 'bg-muted text-muted-foreground' },
    kyc: { label: 'KYC', cls: 'bg-amber-100 text-amber-700' },
    kyc_pending: { label: 'KYC Pending', cls: 'bg-amber-100 text-amber-700' },
    loan_select: { label: 'Loan Select', cls: 'bg-blue-100 text-blue-700' },
    fee_pending: { label: 'Fee Pending', cls: 'bg-blue-100 text-blue-700' },
    active: { label: 'Active', cls: 'bg-success/15 text-success' },
    rejected: { label: 'Rejected', cls: 'bg-destructive/15 text-destructive' },
  }

  return (
    <div className="space-y-4">
      {/* search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="pl-9 rounded-xl"
        />
      </div>

      {/* summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1 rounded-full"><UsersIcon className="size-3" /> {users.length} users</Badge>
        <Badge variant="outline" className="gap-1 rounded-full bg-success/10 text-success border-success/30">{users.filter((u) => u.stage === 'active').length} active</Badge>
        <Badge variant="outline" className="gap-1 rounded-full bg-amber-100 text-amber-700 border-amber-300">{users.filter((u) => u.kycStatus === 'submitted').length} KYC pending</Badge>
        <Badge variant="outline" className="gap-1 rounded-full bg-destructive/10 text-destructive border-destructive/30">{users.filter((u) => u.banned).length} banned</Badge>
      </div>

      {/* list */}
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm">Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <UsersIcon className="size-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No users found</p>
            <p className="text-xs mt-0.5">{query ? 'Try a different search term.' : 'New signups will appear here.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const st = stageLabel[u.stage] || { label: u.stage, cls: 'bg-muted text-muted-foreground' }
            return (
              <Card key={u.id} className={`rounded-2xl transition-opacity ${u.banned ? 'opacity-60' : ''}`}>
                <CardContent className="flex items-center gap-3 p-3.5">
                  <Avatar className="size-11 border shrink-0">
                    <AvatarFallback className={`text-xs font-semibold ${u.banned ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {(u.cnicName || u.name || u.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{u.cnicName || u.name || 'Unnamed'}</p>
                      {u.kycStatus === 'approved' && (
                        <ShieldCheck className="size-3.5 text-success" />
                      )}
                      {u.banned && (
                        <Badge variant="destructive" className="gap-1 text-[10px] h-5"><Ban className="size-3" /> Banned</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}{u.phone && ` • ${u.phone}`}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] h-5 border-0 ${st.cls}`}>{st.label}</Badge>
                      {u.applicationCount > 0 && (
                        <span className="text-[10px] text-muted-foreground">{u.applicationCount} loan app{u.applicationCount > 1 ? 's' : ''}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">• joined {fmtDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {u.banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1"
                        onClick={() => act(u.id, 'unban')}
                        disabled={acting === u.id + 'unban'}
                      >
                        {acting === u.id + 'unban' ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                        onClick={() => act(u.id, 'ban')}
                        disabled={acting === u.id + 'ban'}
                      >
                        {acting === u.id + 'ban' ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                        Ban
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => act(u.id, 'delete')}
                      disabled={acting === u.id + 'delete'}
                      title="Delete user"
                    >
                      {acting === u.id + 'delete' ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <p>Banning a user immediately revokes their session. Deleting a user permanently removes their KYC, loan applications, and payment history — this cannot be undone.</p>
      </div>
    </div>
  )
}
