'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from './Avatar'
import LeafLogo from './LeafLogo'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { count }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('recipient_id', uid).eq('is_read', false),
    ])
    setProfile(p)
    setUnread(count ?? 0)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setUnread(0) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path: string) => pathname?.startsWith(path)

  const handleSignOut = async () => {
    setDropOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navTo = (path: string) => { setDropOpen(false); router.push(path) }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
          <LeafLogo size={22} />
          <span className="serif" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)' }}>leaf</span>
        </Link>

        <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none', fontSize: 14 }}>⌕</span>
          <input readOnly onFocus={() => router.push('/search')} placeholder="Search books, insights…"
            style={{ width: '100%', padding: '7px 13px 7px 32px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 9, fontSize: 13, color: 'var(--t1)', outline: 'none', cursor: 'pointer' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {user ? (
            <>
              <Link href="/notifications" style={{ position: 'relative', padding: 6, fontSize: 18, lineHeight: 1, color: isActive('/notifications') ? 'var(--gr)' : 'var(--t2)', textDecoration: 'none' }}>
                🔔
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 15, height: 15, borderRadius: '50%', background: 'var(--gr)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--bg)' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link href="/post/create" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 9,
                background: 'var(--gr)', color: '#fff',
                textDecoration: 'none', fontSize: 13, fontWeight: 700,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.88'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M9.5 1.5L11.5 3.5L4.5 10.5L1.5 11.5L2.5 8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Write
              </Link>

              {/* Profile dropdown */}
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={profile?.name || user.email || '?'} color={profile?.color} avatarUrl={profile?.avatar_url} size={30} />
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : '' }}>
                    <path d="M1 1L5 5L9 1" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 12, minWidth: 200, zIndex: 200, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {/* User info header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{profile?.name || 'Reader'}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{user.email}</div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px 0' }}>
                      {profile?.username && (
                        <DropItem icon="◉" label="My profile" onClick={() => navTo(`/profile/${profile.username}`)} />
                      )}
                      <DropItem icon="◫" label="My shelf" onClick={() => navTo('/shelf')} />
                      <DropItem icon="◎" label="Notifications" onClick={() => navTo('/notifications')} badge={unread > 0 ? String(unread) : undefined} />
                      <DropItem icon="✎" label="Edit profile" onClick={() => navTo('/profile/edit')} />
                      <div style={{ height: 1, background: 'var(--b1)', margin: '6px 0' }} />
                      <DropItem icon="⚙" label="Settings" onClick={() => navTo('/settings')} />
                      <DropItem icon="🔒" label="Privacy policy" onClick={() => navTo('/settings?tab=privacy')} />
                      <div style={{ height: 1, background: 'var(--b1)', margin: '6px 0' }} />
                      <DropItem icon="→" label="Sign out" onClick={handleSignOut} danger />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>Sign in</Link>
              <Link href="/auth/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Join leaf</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function DropItem({ icon, label, onClick, badge, danger }: { icon: string; label: string; onClick: () => void; badge?: string; danger?: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 16px', background: hover ? 'var(--s2)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ fontSize: 13, color: danger ? '#E06478' : 'var(--t3)', width: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, color: danger ? '#E06478' : 'var(--t1)', flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--bg)', background: 'var(--gr)', borderRadius: 10, padding: '1px 6px' }}>{badge}</span>}
    </button>
  )
}
