'use client'

import { useState } from 'react'
import { createClient } from '@/supabase/client'

export default function TransportBookingPage() {
  const supabase = createClient()

  const [passengerName, setPassengerName] = useState('')
  const [passengerPhone, setPassengerPhone] = useState('')
  const [passengerCount, setPassengerCount] = useState(1)
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trackingCode, setTrackingCode] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const pickupDatetime = new Date(`${pickupDate}T${pickupTime}`).toISOString()

    const { data, error: insertError } = await supabase
      .from('transport_bookings')
      .insert({
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        passenger_count: passengerCount,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        flight_number: flightNumber || null,
        pickup_datetime: pickupDatetime,
        notes: notes || null,
      })
      .select('tracking_code')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setTrackingCode(data.tracking_code)
    setLoading(false)
  }

  const inputStyle = { padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%' }

  if (trackingCode) {
    return (
      <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Request received!</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          We&apos;re finding you a driver. Save this tracking code:
        </p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', letterSpacing: '0.05em' }}>
          {trackingCode}
        </p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Book a ride</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Airport pickup, city rides, and more.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Your name" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} required style={inputStyle} />
        <input type="tel" placeholder="Phone number" value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} required style={inputStyle} />

        <input
          type="number"
          placeholder="Number of passengers"
          value={passengerCount}
          onChange={(e) => setPassengerCount(Number(e.target.value))}
          min={1}
          required
          style={inputStyle}
        />

        <input type="text" placeholder="Pickup location (e.g. Kigali International Airport)" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Drop-off location" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Flight number (optional)" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} style={inputStyle} />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required style={inputStyle} />
          <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required style={inputStyle} />
        </div>

        <textarea placeholder="Notes for the driver (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={inputStyle} />

        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '0.9rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
          {loading ? 'Submitting...' : 'Request pickup'}
        </button>
      </form>
    </main>
  )
}