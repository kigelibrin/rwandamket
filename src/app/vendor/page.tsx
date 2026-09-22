'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/client'

type Market = {
  id: number
  name: string
  category: string
  location: string
  is_open: boolean
  verified: boolean
  rating: number
  total_reviews: number
}

type VendorProfile = {
  id: string
  business_name: string
  service_type: string
  wallet_balance: number
  verified: boolean
}

export default function VendorDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [notVendor, setNotVendor] = useState(false)
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [completedOrders, setCompletedOrders] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: vp } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, service_type, wallet_balance, verified')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!vp) {
        setNotVendor(true)
        setChecking(false)
        return
      }

      setVendorProfile(vp)

      if (vp.service_type === 'goods') {
        const { data: marketData } = await supabase
          .from('markets')
          .select('id, name, category, location, is_open, verified, rating, total_reviews')
          .eq('vendor_id', vp.id)
          .maybeSingle()

        if (marketData) {
          setMarket(marketData)

          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('market_id', marketData.id)

          const { data: orders } = await supabase
            .from('orders')
            .select('order_status')
            .eq('market_id', marketData.id)

          setProductCount(productsCount || 0)
          setPendingOrders(orders?.filter((o) => o.order_status !== 'delivered').length || 0)
          setCompletedOrders(orders?.filter((o) => o.order_status === 'delivered').length || 0)
        }
      }

      setChecking(false)
    }
    load()
  }, [])

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (notVendor) {
    return (
      <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>No vendor account yet</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          You don&apos;t have an approved vendor account.
        </p>
        <Link href="/become-vendor" style={{ padding: '0.75rem 1.5rem', background: 'black', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
          Apply to become a vendor
        </Link>
      </main>
    )
  }

  const cardStyle = { border: '1px solid #eee', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' as const }
  const linkCardStyle = { display: 'block', border: '1px solid #eee', borderRadius: '8px', padding: '1.25rem', textDecoration: 'none', color: 'inherit' }

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.8rem' }}>{vendorProfile?.business_name}</h1>
          {vendorProfile?.verified && (
            <span style={{ fontSize: '0.75rem', background: '#e6f4ea', color: '#1a7f37', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              Verified
            </span>
          )}
        </div>
        <p style={{ color: '#666', textTransform: 'capitalize' }}>{vendorProfile?.service_type} vendor</p>
        {market && (
          <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
            {market.name} • {market.category} • {market.location}
          </p>
        )}
      </div>

      {market && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/vendor/products" style={{ ...cardStyle, textDecoration: 'none', color: 'inherit' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{productCount}</p>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>Products</p>
          </Link>
          <Link href="/vendor/orders?filter=pending" style={{ ...cardStyle, textDecoration: 'none', color: 'inherit' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{pendingOrders}</p>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>Pending</p>
          </Link>
          <Link href="/vendor/orders?filter=completed" style={{ ...cardStyle, textDecoration: 'none', color: 'inherit' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{completedOrders}</p>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>Completed</p>
          </Link>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>Wallet balance</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{vendorProfile?.wallet_balance} RWF</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {vendorProfile?.service_type === 'goods' && market && (
          <>
            <Link href="/vendor/orders" style={linkCardStyle}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>📦 Orders</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>View and manage incoming orders</p>
            </Link>
            <Link href="/vendor/products/new" style={linkCardStyle}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>➕ Add Product</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>List a new product for sale</p>
            </Link>
            <Link href={`/markets/${market.id}`} style={linkCardStyle}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>👁 View Storefront</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>See your market as customers do</p>
            </Link>
          </>
        )}

        {vendorProfile?.service_type === 'transport' && (
          <Link href="/vendor/transport" style={linkCardStyle}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>🚗 Ride Requests</p>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Accept and manage transport bookings</p>
          </Link>
        )}
      </div>
    </main>
  )
}