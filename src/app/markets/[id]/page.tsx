'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

type Market = {
  id: number
  name: string
  category: string
  location: string
}

type Product = {
  id: number
  name: string
  price: number
  market_id: number
}

export default function MarketPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const { addItem, items } = useCart()

  const [market, setMarket] = useState<Market | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: marketData } = await supabase
        .from('markets')
        .select('*')
        .eq('id', Number(id))
        .single()

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('market_id', Number(id))
        .eq('is_available', true)

      setMarket(marketData)
      setProducts(productsData || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>
  if (!market) return <main style={{ padding: '2rem' }}><h1>Market not found</h1></main>

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{market.name}</h1>
          <p style={{ color: '#666' }}>{market.category} • {market.location}</p>
        </div>
        <Link href="/checkout" style={{ padding: '0.6rem 1.2rem', background: 'black', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
          Cart ({cartCount})
        </Link>
      </div>

      <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {products.map((product) => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{product.name}</h3>
            <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>{product.price} RWF</p>
            <button
              onClick={() =>
                addItem({
                  productId: product.id,
                  marketId: product.market_id,
                  name: product.name,
                  price: product.price,
                })
              }
              style={{ width: '100%', padding: '0.5rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
            >
              Add to cart
            </button>
          </div>
        ))}
      </div>

      {products.length === 0 && <p>No products listed yet for this market.</p>}
    </main>
  )
}