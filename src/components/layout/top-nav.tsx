'use client'

import { useAppStore, type View } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  User,
  CreditCard,
  Bell,
  LogOut,
  RefreshCw,
  Wallet,
  Menu,
} from 'lucide-react'

interface Props {
  onLogout: () => void
  onRefresh: () => void
  onNavigate?: (v: View) => void
  activeView?: View
}

export function TopNav({ onLogout, onRefresh, onNavigate, activeView }: Props) {
  const { user, notifications } = useAppStore()
  if (!user) return null
  const unread = notifications.filter((n) => !n.read).length

  const navItems: { label: string; view: View; icon: React.ElementType }[] = [
    { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
    { label: 'My Loans', view: 'my_loans', icon: CreditCard },
    { label: 'Profile', view: 'profile', icon: User },
    { label: 'Notifications', view: 'notifications', icon: Bell },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center gap-2 font-bold text-lg shrink-0"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <span className="hidden sm:inline">LoanFast</span>
        </button>

        {user.role === 'user' && user.stage === 'active' && (
          <nav className="ml-2 hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.view}
                variant={activeView === item.view ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onNavigate?.(item.view)}
                className="gap-2"
              >
                <item.icon className="size-4" />
                {item.label}
                {item.view === 'notifications' && unread > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {unread}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {user.role === 'admin' && (
            <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
          )}
          <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
            <RefreshCw className="size-4" />
          </Button>

          {user.role === 'user' && user.stage === 'active' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.view} onClick={() => onNavigate?.(item.view)}>
                    <item.icon className="size-4 mr-2" />
                    {item.label}
                    {item.view === 'notifications' && unread > 0 && (
                      <Badge variant="destructive" className="ml-auto">{unread}</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition">
                <Avatar className="size-8 border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {(user.name || user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">{user.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === 'user' && user.stage === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => onNavigate?.('profile')}>
                    <User className="size-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate?.('notifications')}>
                    <Bell className="size-4 mr-2" /> Notifications
                    {unread > 0 && <Badge variant="destructive" className="ml-auto">{unread}</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="size-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
