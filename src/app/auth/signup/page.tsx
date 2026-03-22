'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LeafLogo from '@/components/LeafLogo'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return }
    if (!/^[a-z0-9._]+$/.test(form.username)) { setError('Username: lowercase letters, numbers, dots and underscores only.'); setLoading(false); return }

    // Check username
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', form.username).maybeSingle()
    if (existing) { setError('That username is taken.'); setLoading(false); return }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username, name: form.name } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/feed'); router.refresh() }
  }

  const fields = [
    { key: 'name', label: 'Full name', type: 'text', placeholder: 'Your name' },
    { key: 'username', label: 'Username', type: 'text', placeholder: 'yourhandle' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '8+ characters' },
  ]

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><LeafLogo size={40} /></div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Join leaf</h1>
          <p style={{ fontSize: 14, color: 'var(--t2)' }}>Discuss what people learned from books</p>
        </div>

        <form onSubmit={handleSignup} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 28 }}>
          {error && (
            <div style={{ background: 'rgba(224,92,106,0.1)', border: '1px solid rgba(224,92,106,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: 'var(--rd)', marginBottom: 16 }}>
              {error}
            </div>
          )}
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={set(f.key)} required placeholder={f.placeholder}
                className="input"
                onChange={e => { if (f.key === 'username') setForm(v => ({ ...v, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })); else set(f.key)(e) }} />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 8 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--t2)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--gr)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
