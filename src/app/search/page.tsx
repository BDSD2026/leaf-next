'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import PostCard from '@/components/PostCard'
import PageLayout from '@/components/PageLayout'

// Strip HTML tags from book descriptions
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

async function searchGoogleBooks(query: string, supabase: any): Promise<any[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=en`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const items = data.items || []
    const books = items.map((item: any) => {
      const info = item.volumeInfo || {}
      return {
        google_id: item.id,
        title: info.title || 'Unknown Title',
        author: (info.authors || ['Unknown']).join(', '),
        authors: info.authors || [],
        cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        description: info.description ? stripHtml(info.description).slice(0, 500) : null,
        genre: info.categories?.[0] || null,
        categories: info.categories || [],
        published_date: info.publishedDate || null,
        publisher: info.publisher || null,
        page_count: info.pageCount || null,
        language: info.language || 'en',
        insights_count: 0,
      }
    })
    if (books.length > 0) {
      await supabase.from('books').upsert(books, { onConflict: 'google_id', ignoreDuplicates: false })
      const googleIds = books.map((b: any) => b.google_id)
      const { data: saved } = await supabase.from('books').select('*').in('google_id', googleIds)
      return saved || books
    }
    return books
  } catch (e) {
    console.error('Google Books error:', e)
    return []
  }
}

const SHELF_OPTIONS = [
  { value: 'want_to_read', label: 'Want to Read', color: 'var(--am)', bg: 'var(--am-t)' },
  { value: 'reading', label: 'Reading', color: 'var(--gr)', bg: 'var(--gr-t)' },
  { value: 'read', label: 'Read', color: 'var(--bl)', bg: 'var(--bl-t)' },
]

function ShelfButton({ book, currentUserId }: { book: any; currentUserId?: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [shelf, setShelf] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const setShelfStatus = async (status: string | null) => {
    if (!currentUserId) { router.push('/auth/login'); return }
    if (!book.id) return
    setLoading(true)
    setOpen(false)
    if (!status) {
      await supabase.from('shelves').delete().match({ user_id: currentUserId, book_id: book.id })
      setShelf(null)
    } else if (shelf) {
      await supabase.from('shelves').update({ status }).match({ user_id: currentUserId, book_id: book.id })
      setShelf(status)
    } else {
      await supabase.from('shelves').insert({ user_id: currentUserId, book_id: book.id, status })
      setShelf(status)
    }
    setLoading(false)
  }

  const current = SHELF_OPTIONS.find(o => o.value === shelf)

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} disabled={loading}
        style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${current ? current.color : 'var(--b2)'}`, background: current ? current.bg : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: current ? current.color : 'var(--t3)', whiteSpace: 'nowrap' }}>
        {loading ? '…' : current ? current.label : '+ Shelf'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 9, zIndex: 30, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: 150, overflow: 'hidden' }}>
          {SHELF_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setShelfStatus(o.value)}
              style={{ display: 'block', width: '100%', padding: '9px 14px', background: shelf === o.value ? o.bg : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: shelf === o.value ? o.color : 'var(--t1)', textAlign: 'left', fontWeight: shelf === o.value ? 700 : 400 }}>
              {shelf === o.value ? '✓ ' : ''}{o.label}
            </button>
          ))}
          {shelf && (
            <button onClick={() => setShelfStatus(null)}
              style={{ display: 'block', width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', borderTop: '1px solid var(--b1)', cursor: 'pointer', fontSize: 12, color: 'var(--rd)', textAlign: 'left' }}>
              Remove from shelf
            </button>
          )}
        </div>
      )}
    </div>
    </PageLayout>
  )
}

export default function SearchPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [results, setResults] = useState<{ posts: any[]; books: any[]; users: any[] }>({ posts: [], books: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const supabase = createClient()

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id))
  })

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults({ posts: [], books: [], users: [] }); return }
    setLoading(true)
    const [{ data: posts }, { data: dbBooks }, { data: users }, googleBooks] = await Promise.all([
      supabase.from('posts_with_details').select('*').or(`text.ilike.%${query}%,subtext.ilike.%${query}%`).eq('is_deleted', false).limit(20),
      supabase.from('books').select('*').or(`title.ilike.%${query}%,author.ilike.%${query}%`).order('insights_count', { ascending: false }).limit(10),
      supabase.from('profiles').select('*').or(`username.ilike.%${query}%,name.ilike.%${query}%`).limit(10),
      searchGoogleBooks(query, supabase),
    ])
    const dbGoogleIds = new Set((dbBooks || []).map((b: any) => b.google_id))
    const newFromGoogle = googleBooks.filter((b: any) => !dbGoogleIds.has(b.google_id))
    const mergedBooks = [...(dbBooks || []), ...newFromGoogle].slice(0, 12)
    setResults({ posts: posts || [], books: mergedBooks, users: users || [] })
    setLoading(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value)
    clearTimeout((window as any).__searchTimer)
    ;(window as any).__searchTimer = setTimeout(() => search(e.target.value), 400)
  }

  const has = q.length > 1
  const showAll = tab === 'all'

  return (
    <PageLayout>
    <div style={{ padding: '24px 20px' }}>
      <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>Search</h1>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none', fontSize: 15 }}>⌕</span>
        <input value={q} onChange={handleChange} placeholder="Books, insights, people…" autoFocus
          style={{ width: '100%', padding: '11px 14px 11px 38px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 11, fontSize: 14, color: 'var(--t1)', outline: 'none' }} />
      </div>

      {has && (
        <div className="tabs" style={{ marginBottom: 18 }}>
          {[['all','All'],['posts','Posts'],['books','Books'],['people','People']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`tab ${tab === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
      )}

      {!has && <div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">Search books, insights, and readers</div></div>}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {/* People */}
      {has && !loading && (tab === 'all' || tab === 'people') && results.users.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>People</div>
          {results.users.slice(0, showAll ? 3 : 50).map((u: any) => (
            <Link key={u.id} href={`/profile/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--b1)', textDecoration: 'none' }}>
              <Avatar name={u.name || u.username} color={u.color} avatarUrl={u.avatar_url} size={38} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>@{u.username} · {u.followers_count || 0} followers</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Books */}
      {has && !loading && (tab === 'all' || tab === 'books') && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Books</div>
          {results.books.length === 0 && !loading && (
            <div className="empty"><div className="empty-text">No books found</div></div>
          )}
          {results.books.slice(0, showAll ? 6 : 50).map((b: any) => (
            <div key={b.id || b.google_id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--b1)', alignItems: 'flex-start' }}>
              <Link href={b.id ? `/book/${b.id}` : `/book/${b.google_id}`} style={{ display: 'flex', gap: 12, flex: 1, textDecoration: 'none', alignItems: 'flex-start' }}>
                {b.cover_url
                  ? <Image src={b.cover_url} alt="" width={40} height={56} style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 56, borderRadius: 5, background: 'var(--s3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>{b.author}</div>
                  {b.genre && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{b.genre}</div>}
                  <div style={{ fontSize: 11, color: 'var(--gr)', marginTop: 3 }}>{b.insights_count || 0} insights</div>
                </div>
              </Link>
              {/* Shelf + Post actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                <ShelfButton book={b} currentUserId={currentUserId} />
                <Link href={`/post/create?book=${b.id || b.google_id}`}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--b2)', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--t3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  + Post
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {has && !loading && (tab === 'all' || tab === 'posts') && results.posts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Posts</div>
          {results.posts.slice(0, showAll ? 3 : 50).map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)}
        </div>
      )}

      {has && !loading && !results.posts.length && !results.books.length && !results.users.length && (
        <div className="empty"><div className="empty-icon">🤷</div><div className="empty-text">No results for "{q}"</div></div>
      )}
    </div>
    </PageLayout>
  )
}
