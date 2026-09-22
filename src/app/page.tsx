import { createClient } from '@/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: markets, error } = await supabase
    .from('markets')
    .select('id, name, description, category, location, rating, is_open, cover_image')
    .eq('is_open', true)
    .order('featured', { ascending: false })
    .limit(12)

  if (error) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Something went wrong loading markets</h1>
        <pre>{error.message}</pre>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>RWANDAMKET</h1>
          <p style={{ color: '#666' }}>Trusted local markets in Rwanda</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/my-orders" style={{ fontSize: '0.9rem' }}>My Orders</Link>
              <Link href="/become-vendor" style={{ fontSize: '0.9rem' }}>Sell on RWANDAMKET</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: '0.9rem' }}>Log in</Link>
              <Link href="/signup" style={{ fontSize: '0.9rem' }}>Sign up</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {markets?.map((market) => (
          <Link key={market.id} href={`/markets/${market.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{market.name}</h2>
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>{market.category} • {market.location}</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{market.description}</p>
              <p style={{ fontSize: '0.85rem' }}>⭐ {market.rating}</p>
            </div>
          </Link>
        ))}
      </div>

      {(!markets || markets.length === 0) && (
        <p>No open markets found yet.</p>
      )}
    </main>
  )
}