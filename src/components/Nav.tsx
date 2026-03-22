'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Avatar from './Avatar'
import LeafLogo from './LeafLogo'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setProfile(null); setProfileLoaded(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id).eq('is_read', false),
    ]).then(([{ data: p }, { count }]) => {
      setProfile(p)
      setUnread(count ?? 0)
      setProfileLoaded(true)
    })
  }, [user])

  const isActive = (path: string) => pathname?.startsWith(path)

  // Only link to profile once we have the username
  const profileHref = profileLoaded && profile?.username
    ? `/profile/${profile.username}`
    : null

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 7, userSelect: 'none', textDecoration: 'none' }}>
          <LeafLogo size={22} />
          <span className="serif" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)' }}>leaf</span>
        </Link>

        <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none', fontSize: 14 }}>⌕</span>
          <input
            readOnly
            onFocus={() => router.push('/search')}
            placeholder="Search books, insights…"
            style={{ width: '100%', padding: '7px 13px 7px 32px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 9, fontSize: 13, color: 'var(--t1)', outline: 'none', cursor: 'pointer' }}
          />
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
              <Link href="/post/create" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                + Post
              </Link>
              {profileHref ? (
                <Link href={profileHref}>
                  <Avatar name={profile?.name || user.email || '?'} color={profile?.color} avatarUrl={profile?.avatar_url} size={30} />
                </Link>
              ) : (
                <div style={{ opacity: 0.5 }}>
                  <Avatar name={user.email || '?'} size={30} />
                </div>
              )}
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
