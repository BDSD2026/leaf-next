'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageLayout from '@/components/PageLayout'

type Tab = 'account' | 'privacy' | 'appearance' | 'danger'

export default function SettingsInner() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'account')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('leaf-theme') || 'dark'
    setTheme(saved)
  }, [])

  const applyTheme = (t: string) => {
    setTheme(t)
    if (typeof window !== 'undefined' && (window as any).__setLeafTheme) {
      (window as any).__setLeafTheme(t)
    }
    pop('Theme changed ✓')
  }
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const pop = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/auth/login'); return }
      setUser(session.user)
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    })
  }, [])

  const saveProfile = async () => {
    if (!user || !profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: profile.name, bio: profile.bio,
    }).eq('id', user.id)
    setSaving(false)
    if (error) pop('Error saving: ' + error.message)
    else pop('Profile saved ✓')
  }

  const changePassword = async () => {
    if (newPw !== confirmPw) { pop('Passwords do not match'); return }
    if (newPw.length < 8) { pop('Password must be at least 8 characters'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (error) pop('Error: ' + error.message)
    else { pop('Password updated ✓'); setCurrentPw(''); setNewPw(''); setConfirmPw('') }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { pop('Type DELETE to confirm'); return }
    setSaving(true)
    // Delete user's content then sign out (full deletion requires server-side)
    await supabase.from('posts').delete().eq('user_id', user.id)
    await supabase.from('shelves').delete().eq('user_id', user.id)
    await supabase.from('follows').delete().eq('follower_id', user.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'danger', label: 'Danger zone' },
  ]

  return (
    <PageLayout>
      <div style={{ padding: '28px 24px', maxWidth: 640 }}>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 24 }}>Manage your account and preferences</p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--s2)', padding: 3, borderRadius: 10, marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, background: tab === t.id ? 'var(--s3)' : 'transparent', color: tab === t.id ? (t.id === 'danger' ? '#E06478' : 'var(--t1)') : 'var(--t3)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ACCOUNT TAB */}
        {tab === 'account' && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section title="Profile">
              <Field label="Display name">
                <input value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })}
                  style={inputStyle} placeholder="Your name" />
              </Field>
              <Field label="Username">
                <input value={profile.username || ''} disabled style={{ ...inputStyle, opacity: .5 }} />
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Username cannot be changed</div>
              </Field>
              <Field label="Bio">
                <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  maxLength={200} rows={3} style={{ ...inputStyle, resize: 'vertical' as any }} placeholder="Tell readers about yourself…" />
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, textAlign: 'right' }}>{(profile.bio || '').length}/200</div>
              </Field>
              <button onClick={saveProfile} disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : 'Save profile'}</button>
            </Section>

            <Section title="Email">
              <Field label="Email address">
                <input value={user?.email || ''} disabled style={{ ...inputStyle, opacity: .5 }} />
              </Field>
            </Section>

            <Section title="Password">
              <Field label="New password">
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} placeholder="At least 8 characters" />
              </Field>
              <Field label="Confirm new password">
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} placeholder="Repeat new password" />
              </Field>
              <button onClick={changePassword} disabled={!newPw || saving} style={btnSecondary}>Update password</button>
            </Section>

            <div style={{ paddingTop: 8, borderTop: '1px solid var(--b1)' }}>
              <button onClick={signOut} style={{ ...btnSecondary, color: '#E06478', borderColor: 'rgba(224,100,120,.3)' }}>Sign out of leaf</button>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {tab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section title="Privacy">
              <Toggle label="Public profile" sub="Anyone can view your posts and shelf" value={publicProfile} onChange={setPublicProfile} />
              <Toggle label="Email notifications" sub="Receive emails about replies and follows" value={emailNotifs} onChange={setEmailNotifs} />
            </Section>
            <Section title="Privacy policy">
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 12 }}>
                leaf collects only the information you provide when creating an account (email, username, profile info) and the content you post. We do not sell your data to third parties or use advertising trackers.
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
                Your reading data (shelf, ratings) is private by default unless you set your profile to public. You can delete your account and all associated data at any time in the Danger zone tab.
              </div>
            </Section>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {tab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section title="Theme">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { id: 'dark', label: 'Dark', bg: '#0C0C0E', accent: '#5CD4A4' },
                  { id: 'light', label: 'Light', bg: '#F8F8F5', accent: '#2A8A6A' },
                  { id: 'system', label: 'System', bg: 'linear-gradient(135deg,#0C0C0E 50%,#F8F8F5 50%)', accent: '#5CD4A4' },
                ].map(t => (
                  <button key={t.id} onClick={() => applyTheme(t.id)}
                    style={{ border: `2px solid ${theme === t.id ? '#5CD4A4' : 'var(--b1)'}`, borderRadius: 12, padding: 16, cursor: 'pointer', background: 'var(--s1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 48, height: 32, borderRadius: 6, background: t.bg, border: '1px solid var(--b1)' }} />
                    <span style={{ fontSize: 12, color: theme === t.id ? '#5CD4A4' : 'var(--t2)', fontWeight: theme === t.id ? 700 : 400 }}>{t.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 12 }}>Full theme switching coming soon. Currently dark mode only.</p>
            </Section>
          </div>
        )}

        {/* DANGER ZONE TAB */}
        {tab === 'danger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section title="Sign out">
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 12 }}>Sign out of your leaf account on this device.</p>
              <button onClick={signOut} style={{ ...btnSecondary, color: '#E06478', borderColor: 'rgba(224,100,120,.3)' }}>Sign out</button>
            </Section>
            <Section title="Delete account" danger>
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, lineHeight: 1.6 }}>
                Permanently delete your account and all your posts, comments, and shelf data. <strong style={{ color: '#E06478' }}>This cannot be undone.</strong>
              </p>
              <Field label='Type DELETE to confirm'>
                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  style={{ ...inputStyle, borderColor: deleteConfirm === 'DELETE' ? '#E06478' : undefined }}
                  placeholder="DELETE" />
              </Field>
              <button onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE' || saving}
                style={{ ...btnPrimary, background: deleteConfirm === 'DELETE' ? '#E06478' : 'var(--s3)', color: deleteConfirm === 'DELETE' ? '#fff' : 'var(--t3)', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Deleting…' : 'Delete my account permanently'}
              </button>
            </Section>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </PageLayout>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--s2)', border: '1px solid var(--b1)',
  borderRadius: 8, fontSize: 13, color: 'var(--t1)', outline: 'none',
}
const btnPrimary: React.CSSProperties = {
  padding: '9px 20px', background: 'var(--gr)', color: 'var(--bg)', border: 'none',
  borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '9px 20px', background: 'transparent', color: 'var(--t2)',
  border: '1px solid var(--b2)', borderRadius: 20, fontSize: 13, cursor: 'pointer',
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{ background: 'var(--s1)', border: `1px solid ${danger ? 'rgba(224,100,120,.2)' : 'var(--b1)'}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: danger ? '#E06478' : 'var(--t3)', marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: value ? 'var(--gr)' : 'var(--s3)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 21 : 3, transition: 'left .2s' }} />
      </button>
    </div>
  )
}
