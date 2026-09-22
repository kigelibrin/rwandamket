'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

export default function BecomeVendorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceType, setServiceType] = useState('goods')
  const [city, setCity] = useState('Kigali')
  const [category, setCategory] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [agreedToCommission, setAgreedToCommission] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      setUserId(userData.user.id)
      setEmail(userData.user.email || '')

      const { data: existing } = await supabase
        .from('vendor_applications')
        .select('status')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (existing) setExistingStatus(existing.status)
      setChecking(false)
    }
    init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('vendor_applications').insert({
      user_id: userId,
      business_name: businessName,
      contact_name: contactName,
      email,
      phone,
      service_type: serviceType,
      city,
      category: category || null,
      business_description: businessDescription || null,
      agreed_to_commission: agreedToCommission,
      agreed_to_terms: agreedToTerms,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (existingStatus) {
    return (
      <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Your application</h1>
        <p style={{ marginBottom: '0.5rem' }}>
          Status: <strong>{existingStatus}</strong>
        </p>
                <p style={{ color: '#666', marginBottom: existingStatus === 'approved' ? '1.5rem' : 0 }}>
          {existingStatus === 'pending'
            ? "We're reviewing your application. You'll hear from us soon."
            : existingStatus === 'approved'
            ? 'Your application was approved. You now have vendor access.'
            : 'Your application was not approved. Contact support if you have questions.'}
        </p>
        {existingStatus === 'approved' && (
          <a href="/vendor" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: 'black', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
            Go to your vendor dashboard
          </a>
        )}
      </main>
    )
  }

  if (submitted) {
    return (
      <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Application received</h1>
        <p style={{ color: '#666' }}>
          Thanks — we&apos;ll review your application and get back to you.
        </p>
      </main>
    )
  }

  const inputStyle = { padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%' }

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Sell on RWANDAMKET</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Tell us about your business. We review every application before approval.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Your name" value={contactName} onChange={(e) => setContactName(e.target.value)} required style={inputStyle} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />

        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={inputStyle}>
          <option value="goods">Products / Market</option>
          <option value="transport">Transport / Driver</option>
          <option value="hotel">Hotel / Accommodation</option>
          <option value="service">Other service</option>
        </select>

        <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Category (e.g. Food, Crafts)" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />

        <textarea placeholder="Tell us about your business" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} rows={4} style={inputStyle} />

        <label style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={agreedToCommission} onChange={(e) => setAgreedToCommission(e.target.checked)} required />
          <span>I agree to the platform commission on completed orders</span>
        </label>

        <label style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} required />
          <span>I agree to the terms and conditions</span>
        </label>

        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '0.9rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
          {loading ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </main>
  )
}