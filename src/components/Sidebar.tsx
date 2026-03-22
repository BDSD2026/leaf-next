'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LeafLogo from './LeafLogo'

interface Props {
  trendingBooks?: any[]
  activeReaders?: any[]
  currentlyReading?: any[]
  userId?: string
  username?: string
  unread?: number
}

export default function Sidebar({ trendingBooks = [], activeReaders = [], currentlyReading = [], userId, username, unread = 0 }: Props) {
  const pathname = usePathname()
  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <>
      {/* Left sidebar */}
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
            <Link href="/auth/login" className="nav-item"><span>◉</span> Profile</Link>
          )}
          <Link href="/shelf" className={`nav-item ${isActive('/shelf') ? 'active' : ''}`}>
            <span>◫</span> My Shelf
          </Link>
          <Link href="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`} style={{ position: 'relative' }}>
            <span>◎</span> Notifications
            {unread > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--bg)', background: 'var(--gr)', borderRadius: 10, padding: '1px 6px' }}>{unread}</span>
            )}
          </Link>
          <Link href="/post/create" className="nav-item">
            <span>+</span> New Post
          </Link>
        </div>
        <div>
          <div className="sidebar-heading">Trending Books</div>
          {trendingBooks.slice(0, 5).map(b => (
            <Link key={b.id} href={`/book/${b.id}`} className="nav-item" style={{ fontSize: 12 }}>
              <span style={{ fontSize: 10 }}>▪</span>
              <span style={{ lineHeight: 1.3 }}>{b.title?.length > 20 ? b.title.slice(0, 20) + '…' : b.title}</span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  )
}
