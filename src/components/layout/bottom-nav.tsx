'use client'

import { useAppStore, type View } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CreditCard, Wallet, Bell, User,
} from 'lucide-react'

interface NavItem {
  label: string
  view: View
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Loans', view: 'my_loans', icon: CreditCard },
  { label: 'Wallet', view: 'wallet', icon: Wallet },
  { label: 'Alerts', view: 'notifications', icon: Bell },
  { label: 'Profile', view: 'profile', icon: User },
]

interface Props {
  onNavigate: (v: View) => void
  activeView: View
}

export function BottomNav({ onNavigate, activeView }: Props) {
  const { notifications } = useAppStore()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-1">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.view
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <item.icon className={cn('size-5 transition-transform', active && 'scale-110')} />
                {item.view === 'notifications' && unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', active && 'font-bold')}>{item.label}</span>
              {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
