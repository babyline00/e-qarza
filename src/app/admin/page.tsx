import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'

// /admin route — checks auth, redirects to login if not admin/staff
export default async function AdminPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/?admin=1')
  }
  if (user.role !== 'admin' && user.role !== 'staff') {
    redirect('/')
  }
  // The main app at / handles the admin view via SPA routing
  // Just redirect to / — the app shell will detect admin role and show AdminView
  redirect('/')
}
