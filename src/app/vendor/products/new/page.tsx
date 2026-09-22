'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [marketId, setMarketId] = useState<number | null>(null)
  const [marketName, setMarketName] = useState('')
  const [notVendor, setNotVendor] = useState(false)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('item')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!vendorProfile) {
        setNotVendor(true)
        setChecking(false)
        return
      }

      const { data: market } = await supabase
        .from('markets')
        .select('id, name')
        .eq('vendor_id', vendorProfile.id)
        .maybeSingle()

      if (!market) {
        setNotVendor(true)
        setChecking(false)
        return
      }

      setMarketId(market.id)
      setMarketName(market.name)
      setChecking(false)
    }
    init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!marketId) return
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('products').insert({
      market_id: marketId,
      name,
      price: Number(price),
      description: description || null,
      category: category || null,
      unit,
      is_available: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setName('')
    setPrice('')
    setDescription('')
    setCategory('')
    setLoading(false)
  }

  if (checking) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (notVendor) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Vendor access only</h1>
        <p>You need an approved vendor account with a market to add products.</p>
      </main>
    )
  }

  const inputStyle = { padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%' }

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Add a product</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Listing for: {marketName}</p>

      {success && (
        <p style={{ color: 'green', marginBottom: '1rem' }}>Product added! You can add another below.</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        <input type="number" placeholder="Price (RWF)" value={price} onChange={(e) => setPrice(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Category (e.g. Vegetables, Drinks)" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle}>
          <option value="item">per item</option>
          <option value="kg">per kg</option>
          <option value="portion">per portion</option>
          <option value="guest">per guest</option>
        </select>
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={inputStyle} />

        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '0.9rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
          {loading ? 'Adding...' : 'Add product'}
        </button>
      </form>
    </main>
  )
}