'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Lock, Loader2, Eye, EyeOff, KeyRound, Check } from 'lucide-react'

export function ChangePasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      toast.error('New password and confirmation do not match')
      return
    }
    setLoading(true)
    setDone(false)
    try {
      await api('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ current, next }),
      })
      toast.success('Password updated successfully')
      setCurrent('')
      setNext('')
      setConfirm('')
      setDone(true)
      setTimeout(() => setDone(false), 4000)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(next)

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-3 bg-muted/30">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient text-white">
          <KeyRound className="size-4" />
        </span>
        <h3 className="text-sm font-bold">Change Password</h3>
      </div>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pw">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="cur-pw"
                type={show ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="pl-9 pr-9"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="new-pw"
                type={show ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="pl-9"
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </div>
            {next && (
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < strength.score
                        ? strength.color
                        : 'bg-muted'
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs text-muted-foreground w-12">{strength.label}</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conf-pw">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="conf-pw"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-9"
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
              {confirm && next === confirm && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-success" />
              )}
            </div>
          </div>
          <Button type="submit" className="w-full bg-brand-gradient text-white hover:opacity-90" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : done ? <><Check className="size-4" /> Updated</> : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  const colors = ['bg-destructive', 'bg-amber-500', 'bg-amber-400', 'bg-success', 'bg-success']
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] || 'Weak', color: colors[score] || 'bg-destructive' }
}
