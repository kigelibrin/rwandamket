'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{ fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0 }}
    >
      Log out
    </button>
  )
}