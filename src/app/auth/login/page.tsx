'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LeafLogo from '@/components/LeafLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/feed'); router.refresh() }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><LeafLogo size={40} /></div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: 'var(--t2)' }}>Sign in to your leaf account</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 28 }}>
          {error && (
            <div style={{ background: 'rgba(224,92,106,0.1)', border: '1px solid rgba(224,92,106,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: 'var(--rd)', marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="input" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: 14 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--t2)' }}>
          Don't have an account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--gr)', fontWeight: 600 }}>Join leaf</Link>
        </p>
      </div>
    </div>
  )
}
