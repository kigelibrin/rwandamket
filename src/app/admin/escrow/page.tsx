'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

type EscrowEntry = {
  id: string
  order_id: string | null
  transport_booking_id: string | null
  vendor_id: string
  amount_held: number
  commission_amount: number
  net_to_vendor: number
  status: string
  held_at: string
  released_at: string | null
}

export default function AdminEscrowPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [entries, setEntries] = useState<EscrowEntry[]>([])
  const [releasingId, setReleasingId] = useState<string | null>(null)
  const [error, setError] = useState('')

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
      await loadEntries()
      setChecking(false)
    }
    init()
  }, [])

  async function loadEntries() {
    const { data: escrowData } = await supabase
      .from('escrow_ledger')
      .select('*')
      .order('held_at', { ascending: false })

    setEntries(escrowData || [])
  }

  async function handleRelease(entry: EscrowEntry) {
    setReleasingId(entry.id)
    setError('')

    const rpcCall = entry.order_id
      ? supabase.rpc('release_escrow', { p_order_id: entry.order_id, p_trigger: 'admin_manual' })
      : supabase.rpc('release_transport_escrow', { p_booking_id: entry.transport_booking_id, p_trigger: 'admin_manual' })

    const { error: rpcError } = await rpcCall

    if (rpcError) {
      setError(rpcError.message)
      setReleasingId(null)
      return
    }

    await loadEntries()
    setReleasingId(null)
  }

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (!isAdmin) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Admin access only</h1>
      </main>
    )
  }

  const totalHeld = entries.filter((e) => e.status === 'holding').reduce((sum, e) => sum + e.amount_held, 0)
  const totalCommission = entries.reduce((sum, e) => sum + e.commission_amount, 0)
  const totalReleased = entries.filter((e) => e.status === 'released').reduce((sum, e) => sum + e.net_to_vendor, 0)

  const cardStyle = { border: '1px solid #eee', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' as const }

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Escrow Overview</h1>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalHeld} RWF</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Currently held</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalCommission} RWF</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Total commission</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalReleased} RWF</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Released to vendors</p>
        </div>
      </div>

      {entries.length === 0 && <p>No escrow entries yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.map((entry) => {
          const sourceLabel = entry.order_id
            ? `Order #${entry.order_id.slice(0, 8)}`
            : `Ride #${entry.transport_booking_id?.slice(0, 8)}`
          const sourceType = entry.order_id ? 'Goods order' : 'Transport ride'

          return (
            <div key={entry.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>{sourceLabel} • {sourceType}</p>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  Held: {new Date(entry.held_at).toLocaleDateString()}
                  {entry.released_at && ` • Released: ${new Date(entry.released_at).toLocaleDateString()}`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold' }}>{entry.amount_held} RWF total</p>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  Commission: {entry.commission_amount} • Vendor gets: {entry.net_to_vendor}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    background: entry.status === 'released' ? '#e6f4ea' : '#fff4e5',
                    color: entry.status === 'released' ? '#1a7f37' : '#8a5300',
                  }}
                >
                  {entry.status}
                </span>
                {entry.status === 'holding' && (
                  <button
                    onClick={() => handleRelease(entry)}
                    disabled={releasingId === entry.id}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    {releasingId === entry.id ? 'Releasing...' : 'Release now'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}