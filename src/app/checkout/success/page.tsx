'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Order placed!</h1>
      <p style={{ color: '#666', marginBottom: '0.5rem' }}>
        Your order has been received and is being processed.
      </p>
      {orderId && (
        <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '2rem' }}>
          Order reference: {orderId}
        </p>
      )}
      <Link href="/" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: 'black', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
        Back to markets
      </Link>
    </main>
  )
}