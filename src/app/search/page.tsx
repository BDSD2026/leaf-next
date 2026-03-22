'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import PostCard from '@/components/PostCard'

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
        description: info.description?.slice(0, 500) || null,
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

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [results, setResults] = useState<{ posts: any[]; books: any[]; users: any[] }>({ posts: [], books: [], users: [] })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
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

      {has && !loading && (tab === 'all' || tab === 'books') && results.books.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Books</div>
          {results.books.slice(0, showAll ? 6 : 50).map((b: any) => (
            <Link key={b.id || b.google_id} href={b.id ? `/book/${b.id}` : `/book/${b.google_id}`}
              style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--b1)', textDecoration: 'none' }}>
              {b.cover_url
                ? <Image src={b.cover_url} alt="" width={40} height={56} style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 40, height: 56, borderRadius: 5, background: 'var(--s3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>{b.author}</div>
                {b.genre && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{b.genre}</div>}
                <div style={{ fontSize: 11, color: 'var(--gr)', marginTop: 4 }}>{b.insights_count || 0} insights</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {has && !loading && (tab === 'all' || tab === 'books') && results.books.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Books</div>
          <div className="empty"><div className="empty-text">No books found for "{q}"</div></div>
        </div>
      )}

      {has && !loading && (tab === 'all' || tab === 'posts') && results.posts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Posts</div>
          {results.posts.slice(0, showAll ? 3 : 50).map((p: any) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {has && !loading && !results.posts.length && !results.books.length && !results.users.length && (
        <div className="empty"><div className="empty-icon">🤷</div><div className="empty-text">No results for "{q}"</div></div>
      )}
    </div>
  )
}
