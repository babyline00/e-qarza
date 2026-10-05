'use client'

import { useState } from 'react'
import { useAppStore, type View } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Logo } from '@/components/shared/logo'
import {
  LayoutDashboard,
  User,
  CreditCard,
  Bell,
  LogOut,
  RefreshCw,
  Menu,
  HelpCircle,
  Settings,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onLogout: () => void
  onRefresh: () => void
  onNavigate?: (v: View) => void
  activeView?: View
}

export function TopNav({ onLogout, onRefresh, onNavigate, activeView }: Props) {
  const { user, kyc, notifications } = useAppStore()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const unread = notifications.filter((n) => !n.read).length

  const isAdmin = user.role === 'admin'
  // The dashboard-style orange header is only used when the user can actually
  // navigate (i.e. user is active). All pre-dashboard stages (kyc, pending,
  // loan select, fee) use the simpler sticky white header.
  const isDashboardStage = !isAdmin && user.stage === 'active'

  const navItems: { label: string; view: View; icon: React.ElementType; badge?: number }[] = [
    { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
    { label: 'My Profile', view: 'profile', icon: User },
    { label: 'My Loan', view: 'my_loans', icon: CreditCard },
    { label: 'Notifications', view: 'notifications', icon: Bell, badge: unread },
  ]

  const initials = (user.name || user.email).slice(0, 2).toUpperCase()
  const go = (v: View) => {
    onNavigate?.(v)
    setOpen(false)
  }

  // ---- Simple white sticky header (pre-dashboard stages + admin) ----
  if (!isDashboardStage) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <button onClick={() => (isAdmin ? undefined : onNavigate?.('dashboard'))} className="flex items-center">
            <Logo />
          </button>
          {isAdmin && (
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex bg-primary/10 text-primary">Admin</Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </div>
      </header>
    )
  }

  // ---- Orange dashboard header (mobile + desktop) ----
  const topTabs: { label: string; view: View }[] = [
    { label: 'Dashboard', view: 'dashboard' },
    { label: 'My Loans', view: 'my_loans' },
    { label: 'Notifications', view: 'notifications' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-gradient text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        {/* Hamburger (always available — drawer works on all sizes) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="text-white hover:bg-white/15"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Center logo on mobile, left on desktop */}
        <div className="flex-1 flex items-center justify-center md:justify-start md:flex-none">
          <Logo light />
        </div>

        {/* Desktop inline nav tabs */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {topTabs.map((t) => {
            const active = activeView === t.view
            return (
              <Button
                key={t.view}
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.(t.view)}
                className={cn(
                  'gap-2 text-white/90 hover:bg-white/15 hover:text-white',
                  active && 'bg-white/20 text-white',
                )}
              >
                {t.label}
                {t.view === 'notifications' && unread > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px] bg-white text-brand border-0">{unread}</Badge>
                )}
              </Button>
            )
          })}
        </nav>

        {/* Notification bell + refresh */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate?.('notifications')}
            className="relative text-white hover:bg-white/15"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh" className="text-white hover:bg-white/15">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Side drawer menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[300px] sm:max-w-xs p-0 gap-0">
          <SheetHeader className="bg-brand-gradient text-white p-5 pb-6 text-left">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-base font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-white text-base truncate">{user.name || 'User'}</SheetTitle>
                <SheetDescription className="text-white/80 text-xs truncate">{user.phone || user.email}</SheetDescription>
              </div>
            </div>
            {kyc?.status === 'approved' && (
              <Badge className="mt-3 w-fit gap-1 bg-success text-success-foreground border-0 hover:bg-success">
                <BadgeCheck className="size-3.5" /> Verified User
              </Badge>
            )}
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map((item) => (
              <DrawerItem
                key={`${item.label}-${item.view}`}
                icon={item.icon}
                label={item.label}
                active={activeView === item.view}
                badge={item.badge}
                onClick={() => go(item.view)}
              />
            ))}
            {/* Help & Support */}
            <DrawerItem icon={HelpCircle} label="Help & Support" onClick={() => { onNavigate?.('help'); setOpen(false) }} />
            {/* Settings (non-functional placeholder) */}
            <DrawerItem icon={Settings} label="Settings" onClick={() => setOpen(false)} />
            <Separator className="my-2" />
            <DrawerItem icon={LogOut} label="Logout" destructive onClick={onLogout} />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

function DrawerItem({
  icon: Icon,
  label,
  active,
  badge,
  destructive,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
  badge?: number
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-accent',
        active && 'bg-primary/5',
        destructive && 'text-destructive hover:bg-destructive/5',
      )}
    >
      <span
        className={cn(
          'grid size-8 place-items-center rounded-lg',
          destructive ? 'bg-destructive/10 text-destructive' : active ? 'bg-brand-gradient text-white' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {badge != null && badge > 0 && (
        <Badge className="bg-red-500 text-white border-0 h-5 min-w-5 px-1 text-[10px] justify-center">{badge}</Badge>
      )}
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  )
}
