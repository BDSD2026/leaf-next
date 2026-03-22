'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'

const SHELF_CYCLE = ['want_to_read','reading','read',null]
const SHELF_LABELS: Record<string,string> = { want_to_read:'Want to Read', reading:'Reading', read:'Read' }
const SHELF_COLORS: Record<string,string> = { want_to_read:'var(--am)', reading:'var(--gr)', read:'var(--bl)' }
const SHELF_BGS: Record<string,string> = { want_to_read:'var(--am-t)', reading:'var(--gr-t)', read:'var(--bl-t)' }

export default function BookClient({ book, posts, shelfEntry: initShelf, currentUserId, profile }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [shelf, setShelf] = useState(initShelf)
  const [toast, setToast] = useState('')
  const pop = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const toggleShelf = async () => {
    if (!currentUserId) { router.push('/auth/login'); return }
    const idx = SHELF_CYCLE.indexOf(shelf?.status || null)
    const next = SHELF_CYCLE[(idx + 1) % SHELF_CYCLE.length]
    if (!next) {
      await supabase.from('shelves').delete().match({ user_id: currentUserId, book_id: book.id })
      setShelf(null); pop('Removed from shelf')
    } else if (shelf) {
      const { data } = await supabase.from('shelves').update({ status: next }).match({ user_id: currentUserId, book_id: book.id }).select().single()
      setShelf(data); pop('Shelf updated ✓')
    } else {
      const { data } = await supabase.from('shelves').insert({ user_id: currentUserId, book_id: book.id, status: next }).select().single()
      setShelf(data); pop('Added to shelf ✓')
    }
  }

  const totalUps = posts.reduce((a: number, p: any) => a + (p.upvotes_count || 0), 0)

  return (
    <div className="container">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--t3)', marginBottom: 16, padding: 0 }}>‹ Back</button>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            {book.cover_url && <Image src={book.cover_url} alt={book.title} width={90} height={126} style={{ borderRadius: 9, objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }} />}
            <div style={{ flex: 1 }}>
              <h1 className="serif" style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2, marginBottom: 6 }}>{book.title}</h1>
              <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 12 }}>by {book.author}</div>
              {book.genre && <span style={{ display: 'inline-block', padding: '2px 10px', background: 'var(--gr-t)', color: 'var(--gr)', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 14 }}>{book.genre}</span>}
              <div>
                <button onClick={toggleShelf} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${shelf ? SHELF_COLORS[shelf.status] : 'var(--b1)'}`, background: shelf ? SHELF_BGS[shelf.status] : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: shelf ? SHELF_COLORS[shelf.status] : 'var(--t2)' }}>
                  {shelf ? SHELF_LABELS[shelf.status] : '+ Add to Shelf'}
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid var(--b1)' }}>
            {[['Insights', posts.length], ['Upvotes', totalUps]].map(([l, n], i) => (
              <div key={l as string} style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: i === 0 ? '1px solid var(--b1)' : 'none' }}>
                <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--gr)' }}>{n}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Posts <span style={{ color: 'var(--t3)', fontWeight: 400 }}>({posts.length})</span></span>
          <Link href={`/post/create?book=${book.id}`} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20 }}>+ Post</Link>
        </div>

        {posts.length === 0 ? (
          <div className="empty"><div className="empty-icon">✍️</div><div className="empty-text">Be the first to share an insight</div></div>
        ) : posts.map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
