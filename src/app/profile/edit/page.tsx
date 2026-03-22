'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#7C6FCD','#C17F59','#4A9E7A','#C45E76','#5B9CF6','#F0A050','#E05C6A','#5CD4A4']

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', username: '', bio: '', color: '#7C6FCD' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) setForm({ name: p.name || '', username: p.username || '', bio: p.bio || '', color: p.color || '#7C6FCD' })
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: err } = await supabase.from('profiles').update({ name: form.name, username: form.username, bio: form.bio, color: form.color }).eq('id', user.id)
    if (err) { setError(err.message); setSaving(false) }
    else { setToast('Profile saved ✓'); setTimeout(() => router.push(`/profile/${form.username}`), 1000) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px' }}>
      <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 24 }}>Edit Profile</h1>
      <form onSubmit={handleSave} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 28 }}>
        {error && <div style={{ background: 'rgba(224,92,106,0.1)', border: '1px solid rgba(224,92,106,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: 'var(--rd)', marginBottom: 16 }}>{error}</div>}

        {/* Avatar preview + colour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${form.color === c ? 'var(--t1)' : 'transparent'}`, outline: form.color === c ? `2px solid var(--bg)` : 'none' }} />
            ))}
          </div>
        </div>

        {[['Name', 'name', 'text', 'Full name'], ['Username', 'username', 'text', 'yourhandle']].map(([label, key, type, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
            <input type={type} value={(form as any)[key]} placeholder={ph} required className="input"
              onChange={e => setForm(f => ({ ...f, [key]: key === 'username' ? e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') : e.target.value }))} />
          </div>
        ))}

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bio</label>
            <span style={{ fontSize: 10, color: form.bio.length > 140 ? 'var(--rd)' : 'var(--t3)' }}>{form.bio.length}/160</span>
          </div>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} maxLength={160} placeholder="A sentence about yourself…" className="textarea" style={{ minHeight: 72 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '9px 22px' }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
