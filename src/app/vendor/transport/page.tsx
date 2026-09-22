'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

type Booking = {
  id: string
  created_at: string
  passenger_name: string
  passenger_phone: string
  passenger_count: number
  pickup_location: string
  dropoff_location: string
  flight_number: string | null
  pickup_datetime: string
  notes: string | null
  status: string
  tracking_code: string
  driver_id: string | null
  total_amount: number | null
  payment_status: string
}

const STATUS_FLOW = ['pending', 'confirmed', 'completed']

export default function VendorTransportPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vendorId, setVendorId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [notVendor, setNotVendor] = useState(false)
  const [unclaimedBookings, setUnclaimedBookings] = useState<Booking[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

            const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id, service_type')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!vendorProfile || vendorProfile.service_type !== 'transport') {
        setNotVendor(true)
        setChecking(false)
        return
      }

      setVendorId(vendorProfile.id)
      await loadBookings(vendorProfile.id)
      setChecking(false)
    }
    init()
  }, [])

  async function loadBookings(vId: string) {
    const { data: unclaimed } = await supabase
      .from('transport_bookings')
      .select('*')
      .is('driver_id', null)
      .order('pickup_datetime', { ascending: true })

    const { data: mine } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('driver_id', vId)
      .order('pickup_datetime', { ascending: true })

    setUnclaimedBookings(unclaimed || [])
    setMyBookings(mine || [])
  }

  async function handleAccept(booking: Booking) {
    if (!vendorId) return
    const priceStr = priceInputs[booking.id]
    const price = Number(priceStr)

    if (!priceStr || isNaN(price) || price <= 0) {
      setError('Enter a valid price before accepting this ride.')
      return
    }

    setUpdatingId(booking.id)
    setError('')

    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update({
        driver_id: vendorId,
        status: 'confirmed',
        quoted_price: price,
        total_amount: price,
      })
      .eq('id', booking.id)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    await loadBookings(vendorId)
    setUpdatingId(null)
  }

  function nextStatus(current: string): string | null {
    const index = STATUS_FLOW.indexOf(current)
    if (index === -1 || index === STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[index + 1]
  }

  async function handleAdvance(booking: Booking) {
    const next = nextStatus(booking.status)
    if (!next || !vendorId) return

    setUpdatingId(booking.id)
    setError('')

    const updatePayload: { status: string; completed_at?: string } = { status: next }
    if (next === 'completed') {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update(updatePayload)
      .eq('id', booking.id)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    await loadBookings(vendorId)
    setUpdatingId(null)
  }

  async function handleMarkPaid(booking: Booking) {
    if (!vendorId) return
    setUpdatingId(booking.id)
    setError('')

    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update({ payment_status: 'paid' })
      .eq('id', booking.id)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    await loadBookings(vendorId)
    setUpdatingId(null)
  }

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (notVendor) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Vendor access only</h1>
      </main>
    )
  }

  const inputStyle = { padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '6px', width: '100px' }

  const bookingCard = (booking: Booking, showAccept: boolean) => {
    const next = nextStatus(booking.status)
    return (
      <div key={booking.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <p style={{ fontWeight: 'bold' }}>{booking.passenger_name} • {booking.passenger_count} pax</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>{new Date(booking.pickup_datetime).toLocaleString()}</p>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>{booking.passenger_phone}</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>{booking.pickup_location} → {booking.dropoff_location}</p>
        {booking.flight_number && <p style={{ fontSize: '0.85rem', color: '#666' }}>Flight: {booking.flight_number}</p>}
        {booking.notes && <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>{booking.notes}</p>}
        <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem' }}>Code: {booking.tracking_code}</p>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', background: '#f0f0f0', borderRadius: '4px' }}>
            {booking.status}
          </span>
          {showAccept && (
            <>
              <input
                type="number"
                placeholder="Price (RWF)"
                value={priceInputs[booking.id] || ''}
                onChange={(e) => setPriceInputs({ ...priceInputs, [booking.id]: e.target.value })}
                style={inputStyle}
              />
              <button
                onClick={() => handleAccept(booking)}
                disabled={updatingId === booking.id}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                {updatingId === booking.id ? '...' : 'Accept ride'}
              </button>
            </>
          )}
          {!showAccept && (
            <>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{booking.total_amount} RWF</span>
              {booking.payment_status !== 'paid' && (
                <button
                  onClick={() => handleMarkPaid(booking)}
                  disabled={updatingId === booking.id}
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Mark paid
                </button>
              )}
              {next && (
                <button
                  onClick={() => handleAdvance(booking)}
                  disabled={updatingId === booking.id}
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {updatingId === booking.id ? '...' : `Mark ${next}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Transport Requests</h1>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Available requests</h2>
      {unclaimedBookings.length === 0 && <p style={{ color: '#999', marginBottom: '1.5rem' }}>No unclaimed requests.</p>}
      {unclaimedBookings.map((b) => bookingCard(b, true))}

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem', marginBottom: '0.75rem' }}>Your rides</h2>
      {myBookings.length === 0 && <p style={{ color: '#999' }}>You haven&apos;t accepted any rides yet.</p>}
      {myBookings.map((b) => bookingCard(b, false))}
    </main>
  )
}