'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import Avatar from '@/components/Avatar'
import Sidebar from '@/components/Sidebar'

const FILTERS = [['all','All'],['insight','Insights'],['thought','Thoughts'],['question','Questions'],['review','Reviews']]
const SORTS = [['trending','Hot'],['new','New'],['top','Top']]

interface Props {
  initialPosts: any[]
  trendingBooks: any[]
  currentUserId?: string
  profile?: any
  unread?: number
  sort: string
  filter: string
}

function ActiveReaders() {
  const [readers, setReaders] = useState<any[]>([])
  const supabase = createClient()
  useEffect(() => {
    supabase.from('profiles').select('id,username,name,color,avatar_url')
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setReaders(data || []))
  }, [])
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, overflow: 'hidden' }}>
      {readers.length === 0 && (
        <div style={{ padding: 14, fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>No readers yet</div>
      )}
      {readers.map((u, i) => (
        <Link key={u.id} href={`/profile/${u.username}`}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderBottom: i < readers.length - 1 ? '1px solid var(--b1)' : 'none', textDecoration: 'none' }}>
          <Avatar name={u.name || u.username} color={u.color} avatarUrl={u.avatar_url} size={26} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{u.name || u.username}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>@{u.username}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function FeedClient({ initialPosts, trendingBooks, currentUserId, profile, unread = 0, sort, filter }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => { setPosts(initialPosts) }, [initialPosts])

  const navigate = (newSort?: string, newFilter?: string) => {
    const s = newSort ?? sort
    const f = newFilter ?? filter
    router.push(`/feed?sort=${s}&filter=${f}`)
  }

  return (
    <div className="container">
      <div className="grid-layout">
        <Sidebar trendingBooks={trendingBooks} unread={unread} />

        <main className="main-content">
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
                {FILTERS.map(([k, l]) => (
                  <button key={k} onClick={() => navigate(undefined, k)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filter === k ? 700 : 400, background: filter === k ? 'var(--gr)' : 'var(--s2)', color: filter === k ? 'var(--bg)' : 'var(--t2)', transition: 'all 0.12s' }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 3, background: 'var(--s2)', padding: 3, borderRadius: 9 }}>
                {SORTS.map(([k, l]) => (
                  <button key={k} onClick={() => navigate(k, undefined)}
                    style={{ padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: sort === k ? 600 : 400, background: sort === k ? 'var(--s3)' : 'transparent', color: sort === k ? 'var(--t1)' : 'var(--t3)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📖</div>
                <div className="empty-text">No posts yet. Be the first to share an insight!</div>
                {currentUserId && (
                  <Link href="/post/create" className="btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>
                    + Create Post
                  </Link>
                )}
              </div>
            ) : posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)}
          </div>
        </main>

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
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3 }}>{b.title?.length > 26 ? b.title.slice(0, 26) + '…' : b.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{b.insights_count} insight{b.insights_count !== 1 ? 's' : ''}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="sidebar-heading">Active Readers</div>
            <ActiveReaders />
          </div>
        </aside>
      </div>
    </div>
  )
}
