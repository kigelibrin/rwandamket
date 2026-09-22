'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/client'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [heldCount, setHeldCount] = useState(0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!adminRow) {
        setChecking(false)
        return
      }

      setIsAdmin(true)

      const { count: pending } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: held } = await supabase
        .from('escrow_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'holding')

      setPendingCount(pending || 0)
      setHeldCount(held || 0)
      setChecking(false)
    }
    init()
  }, [])

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (!isAdmin) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Admin access only</h1>
      </main>
    )
  }

  const linkCardStyle = { display: 'block', border: '1px solid #eee', borderRadius: '8px', padding: '1.25rem', textDecoration: 'none', color: 'inherit' }

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Link href="/admin/applications" style={linkCardStyle}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>📋 Vendor Applications</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            {pendingCount} pending review
          </p>
        </Link>
        <Link href="/admin/escrow" style={linkCardStyle}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>💰 Escrow Overview</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            {heldCount} entries currently held
          </p>
        </Link>
      </div>
    </main>
  )
}