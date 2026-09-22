'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/client'

type Product = {
  id: number
  name: string
  price: number
  category: string | null
  unit: string
  is_available: boolean
  stock_quantity: number
}

export default function VendorProductsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [notVendor, setNotVendor] = useState(false)
  const [marketId, setMarketId] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [updatingId, setUpdatingId] = useState<number | null>(null)
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

      if (!vendorProfile || vendorProfile.service_type !== 'goods') {
        setNotVendor(true)
        setChecking(false)
        return
      }

      const { data: market } = await supabase
        .from('markets')
        .select('id')
        .eq('vendor_id', vendorProfile.id)
        .maybeSingle()

      if (!market) {
        setNotVendor(true)
        setChecking(false)
        return
      }

      setMarketId(market.id)
      await loadProducts(market.id)
      setChecking(false)
    }
    init()
  }, [])

  async function loadProducts(mId: number) {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, category, unit, is_available, stock_quantity')
      .eq('market_id', mId)
      .order('created_at', { ascending: false })

    setProducts(data || [])
  }

  async function handleToggleAvailable(product: Product) {
    setUpdatingId(product.id)
    setError('')

    const { error: updateError } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    if (marketId) await loadProducts(marketId)
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

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Your Products</h1>
        <Link href="/vendor/products/new" style={{ padding: '0.5rem 1rem', background: 'black', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
          + Add Product
        </Link>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {products.length === 0 && <p>You haven&apos;t added any products yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map((product) => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p style={{ fontWeight: 'bold' }}>{product.name}</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                {product.price} RWF / {product.unit} {product.category && `• ${product.category}`}
              </p>
            </div>
            <button
              onClick={() => handleToggleAvailable(product)}
              disabled={updatingId === product.id}
              style={{
                fontSize: '0.85rem',
                padding: '0.4rem 0.8rem',
                background: product.is_available ? '#e6f4ea' : '#f0f0f0',
                color: product.is_available ? '#1a7f37' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {updatingId === product.id ? '...' : product.is_available ? 'Available' : 'Unavailable'}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}