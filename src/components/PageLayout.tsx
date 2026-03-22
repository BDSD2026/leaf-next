'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
  trendingBooks?: any[]
}

function RightSidebar({ trendingBooks }: { trendingBooks: any[] }) {
  const [readers, setReaders] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('id,username,name,color,avatar_url')
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setReaders(data || []))
  }, [])

  return (
    <aside className="sidebar-right">
      <div style={{ marginBottom: 20 }}>
        <div className="sidebar-heading">Trending Books</div>
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, overflow: 'hidden' }}>
          {trendingBooks.length === 0 && (
            <div style={{ padding: '14px', fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>No books yet</div>
          )}
          {trendingBooks.map((b, i) => (
            <Link key={b.id} href={`/book/${b.id}`}
              style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: i < trendingBooks.length - 1 ? '1px solid var(--b1)' : 'none', textDecoration: 'none' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: 'var(--b2)', width: 18, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3 }}>
                  {b.title?.length > 26 ? b.title.slice(0, 26) + '…' : b.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                  {b.insights_count ?? 0} insight{b.insights_count !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="sidebar-heading">Active Readers</div>
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, overflow: 'hidden' }}>
          {readers.length === 0 && (
            <div style={{ padding: 14, fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>No readers yet</div>
          )}
          {readers.map((u, i) => (
            <Link key={u.id} href={`/profile/${u.username}`}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderBottom: i < readers.length - 1 ? '1px solid var(--b1)' : 'none', textDecoration: 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: u.color || '#7C6FCD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(u.name || u.username || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{u.name || u.username}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>@{u.username}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default function PageLayout({ children, trendingBooks = [] }: Props) {
  return (
    <div className="container">
      <div className="grid-layout">
        <Sidebar trendingBooks={trendingBooks} />
        <main className="main-content">
          {children}
        </main>
        <RightSidebar trendingBooks={trendingBooks} />
      </div>
    </div>
  )
}
