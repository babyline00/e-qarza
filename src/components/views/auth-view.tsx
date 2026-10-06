'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/shared/logo'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { formatPhone, stripPhone, isValidPhone } from '@/lib/phone-format'
import { Phone, Lock, User as UserIcon, Loader2, Smartphone, Apple, Download } from 'lucide-react'

interface Props {
  onAuthed: () => void
}

interface AppDownloadInfo {
  id: string
  platform: string
  version: string
  filePath: string
}

export function AuthView({ onAuthed }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [appDownloads, setAppDownloads] = useState<AppDownloadInfo[]>([])

  // Fetch app downloads on mount
  useEffect(() => {
    fetch('/api/app-download')
      .then(r => r.json())
      .then(data => setAppDownloads(data.apps || []))
      .catch(() => {})
  }, [])

  // login fields
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // signup fields
  const [signupName, setSignupName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(loginPhone)) {
      toast.error('Please enter a valid phone number (03XXXXXXXXX)')
      return
    }
    setLoading(true)
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: stripPhone(loginPhone), password: loginPassword }),
      })
      toast.success('Welcome back!')
      onAuthed()
    } catch (err) {
      const msg = (err as Error).message
      toast.error(msg)
      // Only redirect to signup if the phone number doesn't exist in DB
      if (msg.includes('No account found') || msg.includes('not found')) {
        setSignupPhone(loginPhone)
        setMode('signup')
      }
      // If wrong password (account exists), stay on login — don't redirect
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(signupPhone)) {
      toast.error('Please enter a valid phone number (03XXXXXXXXX)')
      return
    }
    setLoading(true)
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: signupName, phone: stripPhone(signupPhone), password: signupPassword }),
      })
      toast.success('Account created! Let\u2019s complete your KYC.')
      onAuthed()
    } catch (err) {
      const msg = (err as Error).message
      toast.error(msg)
      // If phone already exists, auto-switch to login with phone pre-filled
      if (msg.includes('already exists') || msg.includes('login instead')) {
        setLoginPhone(signupPhone)
        setMode('login')
        toast.info('This phone number is already registered. Please login instead.')
      }
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
            {/* Welcome heading */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'login' ? 'Sign in with your phone number' : 'Sign up with your phone number'}
              </p>
            </div>
            {/* App download buttons — OUTSIDE the card, below it */}


{appDownloads.length > 0 && (
  <div className="mt-5 flex items-center justify-center gap-3 mb-10">
    {appDownloads.map((app) => (
      <a
        key={app.id}
        href={app.filePath}
        download
        className="group flex h-14 min-w-[190px] items-center gap-3 rounded-xl border border-border bg-card px-4 shadow-sm transition-all hover:border-primary/40 hover:bg-accent hover:shadow-md"
      >
        <Logo
  variant="full"
  className="[&_span:first-child]:size-12 [&_span:first-child>svg]:size-7"
/>
        {/* Platform Logo */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
          {app.platform === "android" ? (
            <Smartphone className="size-5" />
          ) : (
            <Apple className="size-5" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 leading-tight">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Download on
          </p>

          <p className="text-sm font-semibold tracking-tight">
            {app.platform === "android"
              ? "Google Play"
              : "App Store"}
          </p>
        </div>

        {/* Download Icon */}
        <Download className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5 group-hover:text-primary" />
      </a>
    ))}
  </div>
)}

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-5 rounded-lg bg-muted p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-md text-sm font-semibold text-foreground/60 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  style={{ backgroundImage: mode === 'login' ? 'linear-gradient(135deg, #F97316, #EA580C)' : undefined }}
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-md text-sm font-semibold text-foreground/60 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  style={{ backgroundImage: mode === 'signup' ? 'linear-gradient(135deg, #F97316, #EA580C)' : undefined }}
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-phone"
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                        className="pl-9"
                        placeholder="0300-1234567"
                        inputMode="numeric"
                        maxLength={12}
                        required
                        autoComplete="tel"
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
                  <Button type="submit" className="w-full bg-brand-gradient text-white hover:opacity-90" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">
                    Sign up
                  </button>
                </p>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(formatPhone(e.target.value))}
                        className="pl-9"
                        placeholder="0300-1234567"
                        inputMode="numeric"
                        maxLength={12}
                        required
                        autoComplete="tel"
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
                  <Button type="submit" className="w-full bg-brand-gradient text-white hover:opacity-90" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-primary font-medium hover:underline">
                    Login
                  </button>
                </p>
              </TabsContent>
            </Tabs>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* App download buttons — OUTSIDE the card, below it */}
        
      </div>
    </div>
  )
}
