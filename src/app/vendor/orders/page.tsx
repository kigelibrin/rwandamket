'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/supabase/client'

type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  product_id: number
}

type Order = {
  id: string
  created_at: string
  customer_name: string
  phone_number: string
  delivery_address: string
  total_amount: number
  order_status: string
  payment_status: string
  order_items: OrderItem[]
}

const STATUS_FLOW = ['received', 'preparing', 'delivered']

function VendorOrdersContent() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [notVendor, setNotVendor] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
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
        setLoading(false)
        return
      }

      await loadOrders()
      setLoading(false)
    }
    load()
  }, [])

  async function loadOrders() {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, created_at, customer_name, phone_number, delivery_address, total_amount, order_status, payment_status, order_items(id, quantity, unit_price, subtotal, product_id)')
      .order('created_at', { ascending: false })

    setOrders((ordersData as unknown as Order[]) || [])
  }

  function nextStatus(current: string): string | null {
    const index = STATUS_FLOW.indexOf(current)
    if (index === -1 || index === STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[index + 1]
  }

  async function handleAdvanceStatus(order: Order) {
    const next = nextStatus(order.order_status)
    if (!next) return

    setUpdatingId(order.id)
    setError('')

    const updatePayload: { order_status: string; delivered_at?: string } = { order_status: next }
    if (next === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    await loadOrders()
    setUpdatingId(null)
  }

  async function handleMarkPaid(order: Order) {
    setUpdatingId(order.id)
    setError('')

    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', order.id)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    await loadOrders()
    setUpdatingId(null)
  }

  if (loading) return <main style={{ padding: '2rem' }}><p>Loading...</p></main>

  if (notVendor) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Vendor access only</h1>
        <p>This page is only available to vendor accounts.</p>
      </main>
    )
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === 'pending') return order.order_status !== 'delivered'
    if (filter === 'completed') return order.order_status === 'delivered'
    return true
  })

  const heading =
    filter === 'pending' ? 'Pending Orders' : filter === 'completed' ? 'Completed Orders' : 'Orders for your market'

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>{heading}</h1>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {filteredOrders.length === 0 && <p>No orders found.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredOrders.map((order) => {
          const next = nextStatus(order.order_status)
          return (
            <div key={order.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p style={{ fontWeight: 'bold' }}>{order.customer_name}</p>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>{order.phone_number}</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                Deliver to: {order.delivery_address}
              </p>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '0.5rem', marginBottom: '0.5rem' }}>
                {order.order_items?.map((item) => (
                  <p key={item.id} style={{ fontSize: '0.85rem' }}>
                    {item.quantity} × product #{item.product_id} — {item.subtotal} RWF
                  </p>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <p style={{ fontWeight: 'bold' }}>{order.total_amount} RWF</p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', background: '#f0f0f0', borderRadius: '4px' }}>
                    {order.order_status}
                  </span>
                  <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', background: order.payment_status === 'paid' ? '#e6f4ea' : '#f0f0f0', borderRadius: '4px', color: order.payment_status === 'paid' ? '#1a7f37' : 'inherit' }}>
                    {order.payment_status}
                  </span>
                  {order.payment_status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(order)}
                      disabled={updatingId === order.id}
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Mark paid
                    </button>
                  )}
                  {next && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      disabled={updatingId === order.id}
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      {updatingId === order.id ? '...' : `Mark ${next}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

export default function VendorOrdersPage() {
  return (
    <Suspense fallback={<main style={{ padding: '2rem' }}><p>Loading...</p></main>}>
      <VendorOrdersContent />
    </Suspense>
  )
}