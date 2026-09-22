'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

type Application = {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  service_type: string
  city: string
  category: string | null
  business_description: string | null
  status: string
  created_at: string
  user_id: string
}

export default function AdminApplicationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
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
      await loadApplications()
      setChecking(false)
    }
    init()
  }, [])

  async function loadApplications() {
    const { data } = await supabase
      .from('vendor_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setApplications(data || [])
  }

  async function handleApprove(app: Application) {
    setProcessingId(app.id)
    setError('')

    // 1. Create the vendor_profiles row
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('vendor_profiles')
      .insert({
        user_id: app.user_id,
        business_name: app.business_name,
        service_type: app.service_type,
        email: app.email,
        phone: app.phone,
        city: app.city,
        description: app.business_description,
        verified: true,
      })
      .select()
      .single()

    if (vendorError) {
      setError(vendorError.message)
      setProcessingId(null)
      return
    }

    // 2. If this is a goods vendor, create their market storefront
    if (app.service_type === 'goods') {
      const { error: marketError } = await supabase.from('markets').insert({
        name: app.business_name,
        vendor_id: vendorProfile.id,
        category: app.category || 'General',
        location: app.city,
        whatsapp_number: app.phone,
        description: app.business_description,
        verified: true,
      })

      if (marketError) {
        setError(marketError.message)
        setProcessingId(null)
        return
      }
    }

    // 3. Promote the user's profile role to vendor
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'vendor' })
      .eq('id', app.user_id)

    if (profileError) {
      setError(profileError.message)
      setProcessingId(null)
      return
    }

    // 4. Mark the application as approved
    const { error: appError } = await supabase
      .from('vendor_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', app.id)

    if (appError) {
      setError(appError.message)
      setProcessingId(null)
      return
    }

    setProcessingId(null)
    await loadApplications()
  }

  async function handleReject(app: Application) {
    setProcessingId(app.id)
    const { error: rejectError } = await supabase
      .from('vendor_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', app.id)

    if (rejectError) {
      setError(rejectError.message)
    }
    setProcessingId(null)
    await loadApplications()
  }

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (!isAdmin) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Admin access only</h1>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Pending Vendor Applications</h1>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      {applications.length === 0 && <p>No pending applications.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {applications.map((app) => (
          <div key={app.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{app.business_name}</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>{app.contact_name} • {app.email} • {app.phone}</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              {app.service_type} • {app.city} {app.category ? `• ${app.category}` : ''}
            </p>
            {app.business_description && (
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>{app.business_description}</p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleApprove(app)}
                disabled={processingId === app.id}
                style={{ padding: '0.5rem 1rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                {processingId === app.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(app)}
                disabled={processingId === app.id}
                style={{ padding: '0.5rem 1rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}