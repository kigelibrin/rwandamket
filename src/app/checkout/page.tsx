'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart, updateQuantity, removeItem } = useCart()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }
      setUserId(data.user.id)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [])

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0 || !userId) return

    setLoading(true)
    setError('')

    const marketId = items[0].marketId

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: userId,
        customer_name: customerName,
        delivery_address: deliveryAddress,
        phone_number: phoneNumber,
        total_amount: total,
        market_id: marketId,
        items: items,
      })
      .select()
      .single()

    if (orderError) {
      setError(orderError.message)
      setLoading(false)
      return
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      setError(itemsError.message)
      setLoading(false)
      return
    }

    clearCart()
    router.push(`/checkout/success?orderId=${order.id}`)
  }

  if (checkingAuth) {
    return <main style={{ padding: '2rem' }}><p>Checking your account...</p></main>
  }

  if (items.length === 0) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Your cart is empty</h1>
        <p>Go back and add some products first.</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Checkout</h1>

      <div style={{ marginBottom: '2rem' }}>
        {items.map((item) => (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
            <div>
              <p style={{ fontWeight: 'bold' }}>{item.name}</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>{item.price} RWF each</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: '28px', height: '28px' }}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: '28px', height: '28px' }}>+</button>
              <button onClick={() => removeItem(item.productId)} style={{ marginLeft: '0.5rem', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1rem', textAlign: 'right' }}>
          Total: {total} RWF
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Your name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <input
          type="tel"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <input
          type="text"
          placeholder="Delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          required
          style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.9rem', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
        >
          {loading ? 'Placing order...' : `Place order (${total} RWF)`}
        </button>
      </form>
    </main>
  )
}