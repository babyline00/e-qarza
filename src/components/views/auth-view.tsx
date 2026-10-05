'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Logo } from '@/components/shared/logo'

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8">
      {/* Decorative orange blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo variant="full" className="[&_span:first-child]:size-12 [&_span:first-child>svg]:size-7" />
          <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground">
            Quick <span className="text-brand">•</span> Secure <span className="text-brand">•</span> Reliable Loans
          </p>
        </div>

        <Card className="rounded-2xl border-none shadow-xl shadow-primary/5">
          <CardContent className="p-6 sm:p-8">
            {/* Welcome heading — no duplicate tagline (already shown under logo) */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'login' ? 'Sign in to manage your loans' : 'Start your loan journey in minutes'}
              </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-5 rounded-lg bg-muted p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-md text-sm font-medium data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-md text-sm font-medium data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="rounded-lg pl-9"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="rounded-lg pl-9"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-lg bg-brand-gradient text-white font-semibold hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Continue'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Ahmed Khan"
                        className="rounded-lg pl-9"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="rounded-lg pl-9"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        className="rounded-lg pl-9"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-lg bg-brand-gradient text-white font-semibold hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-5 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Demo accounts</p>
              <p>User: sign up with any email to start KYC.</p>
              <p>Admin: <code className="font-mono">admin@loan.pk</code> / <code className="font-mono">admin123</code></p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to E-Qarza’s Terms & Privacy Policy.
        </p>
      </div>
    </div>
  )
}
