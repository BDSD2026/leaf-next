'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'

const SHELF_CYCLE = ['want_to_read', 'reading', 'read', null] as const
const SHELF_LABELS: Record<string, string> = { want_to_read: 'Want to Read', reading: 'Reading', read: 'Read' }
const SHELF_COLORS: Record<string, string> = { want_to_read: 'var(--am)', reading: 'var(--gr)', read: 'var(--bl)' }
const SHELF_BGS: Record<string, string> = { want_to_read: 'var(--am-t)', reading: 'var(--gr-t)', read: 'var(--bl-t)' }

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'insight', label: 'Insights' },
  { key: 'thought', label: 'Thoughts' },
  { key: 'question', label: 'Questions' },
  { key: 'review', label: 'Reviews' },
]

function Stars({ value }: { value: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: value >= s ? 'var(--am)' : 'var(--s3)', fontSize: 14 }}>★</span>
      ))}
    </span>
  )
}

export default function BookClient({ book, posts, shelfEntry: initShelf, currentUserId, profile }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [shelf, setShelf] = useState(initShelf)
  const [activeTab, setActiveTab] = useState('all')
  const [toast, setToast] = useState('')
  const pop = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const toggleShelf = async () => {
    if (!currentUserId) { router.push('/auth/login'); return }
    const idx = SHELF_CYCLE.indexOf(shelf?.status ?? null)
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

  const filteredPosts = activeTab === 'all' ? posts : posts.filter((p: any) => p.type === activeTab)

  // Compute average rating from review posts
  const reviews = posts.filter((p: any) => p.type === 'review' && p.rating)
  const avgRating = reviews.length > 0 ? reviews.reduce((a: number, p: any) => a + p.rating, 0) / reviews.length : 0
  const totalUps = posts.reduce((a: number, p: any) => a + (p.upvotes_count || 0), 0)

  const hasDescription = book.description && book.description.length > 0
  const [showFullDesc, setShowFullDesc] = useState(false)
  const descPreview = book.description?.slice(0, 280)
  const descFull = book.description

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--t3)', marginBottom: 16, padding: 0 }}>‹ Back</button>

      {/* Book header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {book.cover_url
            ? <Image src={book.cover_url} alt={book.title} width={90} height={126} style={{ borderRadius: 9, objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }} />
            : <div style={{ width: 90, height: 126, borderRadius: 9, background: 'var(--s3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📖</div>
          }
          <div style={{ flex: 1 }}>
            <h1 className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2, marginBottom: 6 }}>{book.title}</h1>
            <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 8 }}>by {book.author}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {book.genre && <span style={{ padding: '2px 10px', background: 'var(--gr-t)', color: 'var(--gr)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{book.genre}</span>}
              {book.published_date && <span style={{ padding: '2px 10px', background: 'var(--s3)', color: 'var(--t3)', borderRadius: 20, fontSize: 11 }}>{book.published_date.slice(0, 4)}</span>}
              {book.page_count && <span style={{ padding: '2px 10px', background: 'var(--s3)', color: 'var(--t3)', borderRadius: 20, fontSize: 11 }}>{book.page_count} pages</span>}
            </div>

            {/* Community rating */}
            {avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Stars value={Math.round(avgRating)} />
                <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>from {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            <button onClick={toggleShelf}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${shelf ? SHELF_COLORS[shelf.status] : 'var(--b1)'}`, background: shelf ? SHELF_BGS[shelf.status] : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: shelf ? SHELF_COLORS[shelf.status] : 'var(--t2)' }}>
              {shelf ? SHELF_LABELS[shelf.status] : '+ Add to Shelf'}
            </button>
          </div>
        </div>

        {/* Description */}
        {hasDescription && (
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
              {showFullDesc ? descFull : descPreview}
              {!showFullDesc && descFull?.length > 280 && '…'}
            </div>
            {descFull?.length > 280 && (
              <button onClick={() => setShowFullDesc(!showFullDesc)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--gr)', marginTop: 6, padding: 0 }}>
                {showFullDesc ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--b1)', marginTop: 14 }}>
          {[['Posts', posts.length], ['Upvotes', totalUps], ['Reviews', reviews.length]].map(([l, n], i) => (
            <div key={l as string} style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--b1)' : 'none' }}>
              <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--gr)' }}>{n}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts section with type tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="tabs" style={{ flex: 1, marginRight: 12 }}>
          {TYPE_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}>
              {t.label}
              {t.key !== 'all' && posts.filter((p: any) => p.type === t.key).length > 0 && (
                <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>({posts.filter((p: any) => p.type === t.key).length})</span>
              )}
            </button>
          ))}
        </div>
        <Link href={`/post/create?book=${book.id}`} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, textDecoration: 'none', whiteSpace: 'nowrap' }}>+ Post</Link>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✍️</div>
          <div className="empty-text">
            {activeTab === 'all'
              ? 'Be the first to share something about this book'
              : `No ${activeTab}s yet — be the first!`}
          </div>
          <Link href={`/post/create?book=${book.id}`} className="btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none', fontSize: 13 }}>
            Write a {activeTab === 'all' ? 'post' : activeTab}
          </Link>
        </div>
      ) : (
        filteredPosts.map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
