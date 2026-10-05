'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wallet, Mail, Lock, User, Loader2, ShieldCheck, Zap, Clock } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface Props {
  onAuthed: () => void
}

export function AuthView({ onAuthed }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)

  // login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // signup fields
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      toast.success('Welcome back!')
      onAuthed()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      })
      toast.success('Account created! Let’s complete your KYC.')
      onAuthed()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col-reverse items-stretch lg:flex-row lg:items-center">
      {/* Hero */}
      <div className="flex flex-1 flex-col justify-center gap-6 p-6 lg:p-12">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-6" />
          </span>
          <span className="text-2xl font-bold">LoanFast</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Digital loans, <span className="text-primary">simplified.</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md">
            Apply for a quick loan in minutes. Upload your CNIC, get verified, and receive funds — all from your phone.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg">
          {[
            { icon: Zap, title: 'Instant', desc: 'Approval in hours' },
            { icon: ShieldCheck, title: 'Secure', desc: 'Bank-grade encryption' },
            { icon: Clock, title: 'Flexible', desc: '3 to 12 month terms' },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-3">
              <f.icon className="size-5 text-primary mb-1.5" />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Sign in to continue your loan journey.' : 'Start your loan application in minutes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Ahmed Khan"
                        className="pl-9"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        className="pl-9"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Demo accounts</p>
              <p>User: sign up with any email to start KYC.</p>
              <p>Admin: <code className="font-mono">admin@loan.pk</code> / <code className="font-mono">admin123</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
