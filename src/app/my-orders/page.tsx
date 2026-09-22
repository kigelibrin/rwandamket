'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/client'

type Order = {
  id: string
  created_at: string
  total_amount: number
  order_status: string
  payment_status: string
  delivery_address: string
}

export default function MyOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, order_status, payment_status, delivery_address')
        .eq('customer_id', userData.user.id)
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <main style={{ padding: '2rem' }}><p>Loading your orders...</p></main>

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>My Orders</h1>

      {orders.length === 0 && <p>You haven&apos;t placed any orders yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map((order) => (
          <div key={order.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ fontWeight: 'bold' }}>{order.total_amount} RWF</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
              To: {order.delivery_address}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', background: '#f0f0f0', borderRadius: '4px' }}>
                {order.order_status}
              </span>
              <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', background: '#f0f0f0', borderRadius: '4px' }}>
                {order.payment_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}