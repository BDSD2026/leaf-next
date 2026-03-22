'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  trendingBooks?: any[]
  unread?: number
}

export default function Sidebar({ trendingBooks = [], unread: initUnread = 0 }: Props) {
  const pathname = usePathname()
  const isActive = (path: string) => pathname?.startsWith(path)
  const [username, setUsername] = useState<string | null>(null)
  const [unread, setUnread] = useState(initUnread)
  const supabase = createClient()

  useEffect(() => {
    // Use getSession() - reads from cookie without network call
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      const uid = session.user.id
      // Fetch profile
      supabase.from('profiles').select('username').eq('id', uid).single()
        .then(({ data }) => { if (data?.username) setUsername(data.username) })
      // Fetch unread count
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('recipient_id', uid).eq('is_read', false)
        .then(({ count }) => setUnread(count ?? 0))
    })
    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) { setUsername(null); return }
      const uid = session.user.id
      supabase.from('profiles').select('username').eq('id', uid).single()
        .then(({ data }) => { if (data?.username) setUsername(data.username) })
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <aside className="sidebar-left">
      <div style={{ marginBottom: 20 }}>
        <div className="sidebar-heading">Discover</div>
        <Link href="/feed" className={`nav-item ${isActive('/feed') ? 'active' : ''}`}>
          <span>○</span> Feed
        </Link>
        <Link href="/search" className={`nav-item ${isActive('/search') ? 'active' : ''}`}>
          <span>⌕</span> Search
        </Link>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div className="sidebar-heading">You</div>
        {username ? (
          <Link href={`/profile/${username}`} className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
            <span>◉</span> Profile
          </Link>
        ) : (
          <Link href="/auth/login" className="nav-item"><span>◉</span> Sign in</Link>
        )}
        <Link href="/shelf" className={`nav-item ${isActive('/shelf') ? 'active' : ''}`}>
          <span>◫</span> My Shelf
        </Link>
        <Link href="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
          <span>◎</span> Notifications
          {unread > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--bg)', background: 'var(--gr)', borderRadius: 10, padding: '1px 6px' }}>{unread}</span>
          )}
        </Link>
        <Link href="/post/create" className="nav-item">
          <span>+</span> New Post
        </Link>
      </div>
      {trendingBooks.length > 0 && (
        <div>
          <div className="sidebar-heading">Trending Books</div>
          {trendingBooks.slice(0, 5).map(b => (
            <Link key={b.id} href={`/book/${b.id}`} className="nav-item" style={{ fontSize: 12 }}>
              <span style={{ fontSize: 10 }}>▪</span>
              <span>{b.title?.length > 22 ? b.title.slice(0, 22) + '…' : b.title}</span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  )
}
