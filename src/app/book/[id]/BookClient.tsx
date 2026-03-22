'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageLayout from '@/components/PageLayout'
import PostCard from '@/components/PostCard'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

const SHELF_OPTIONS = [
  { value: 'want_to_read', label: 'Want to Read', color: 'var(--am)', bg: 'var(--am-t)' },
  { value: 'reading',      label: 'Currently Reading', color: 'var(--gr)', bg: 'var(--gr-t)' },
  { value: 'read',         label: 'Read',         color: 'var(--bl)', bg: 'var(--bl-t)' },
]

const TYPE_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'insight',  label: 'Insights' },
  { key: 'thought',  label: 'Thoughts' },
  { key: 'question', label: 'Questions' },
  { key: 'review',   label: 'Reviews' },
]

function Stars({ value }: { value: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: value >= s ? 'var(--am)' : 'var(--s3)', fontSize: 14 }}>★</span>
      ))}
    </span>
  )
}

export default function BookClient({ book, posts, shelfEntry: initShelf, currentUserId, profile, trendingBooks = [] }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [shelf, setShelf] = useState(initShelf)
  const [shelfOpen, setShelfOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [toast, setToast] = useState('')
  const pop = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const setShelfStatus = async (status: string | null) => {
    if (!currentUserId) { router.push('/auth/login'); return }
    setShelfOpen(false)
    if (!status) {
      await supabase.from('shelves').delete().match({ user_id: currentUserId, book_id: book.id })
      setShelf(null); pop('Removed from shelf')
    } else if (shelf) {
      const { data } = await supabase.from('shelves').update({ status }).match({ user_id: currentUserId, book_id: book.id }).select().single()
      setShelf(data); pop(`Marked as ${SHELF_OPTIONS.find(o=>o.value===status)?.label} ✓`)
    } else {
      const { data } = await supabase.from('shelves').insert({ user_id: currentUserId, book_id: book.id, status }).select().single()
      setShelf(data); pop(`Added to shelf ✓`)
    }
  }

  const filteredPosts = activeTab === 'all' ? posts : posts.filter((p: any) => p.type === activeTab)
  const reviews = posts.filter((p: any) => p.type === 'review' && p.rating)
  const avgRating = reviews.length > 0 ? reviews.reduce((a: number, p: any) => a + p.rating, 0) / reviews.length : 0
  const totalUps = posts.reduce((a: number, p: any) => a + (p.upvotes_count || 0), 0)

  const description = book.description ? stripHtml(book.description) : null
  const [showFullDesc, setShowFullDesc] = useState(false)

  const currentShelfOption = SHELF_OPTIONS.find(o => o.value === shelf?.status)

  return (
    <PageLayout trendingBooks={trendingBooks}>
    <div style={{ padding: '24px 20px' }}>
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
              {book.published_date && <span style={{ padding: '2px 10px', background: 'var(--s3)', color: 'var(--t3)', borderRadius: 20, fontSize: 11 }}>{String(book.published_date).slice(0, 4)}</span>}
              {book.page_count && <span style={{ padding: '2px 10px', background: 'var(--s3)', color: 'var(--t3)', borderRadius: 20, fontSize: 11 }}>{book.page_count}p</span>}
            </div>
            {avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Stars value={Math.round(avgRating)} />
                <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Shelf button with dropdown */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button onClick={() => setShelfOpen(!shelfOpen)}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${currentShelfOption ? currentShelfOption.color : 'var(--b1)'}`, background: currentShelfOption ? currentShelfOption.bg : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: currentShelfOption ? currentShelfOption.color : 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {currentShelfOption ? currentShelfOption.label : '+ Add to Shelf'}
                <span style={{ fontSize: 10 }}>▾</span>
              </button>
              {shelfOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 10, zIndex: 30, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 180, overflow: 'hidden' }}>
                  {SHELF_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setShelfStatus(o.value)}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', background: shelf?.status === o.value ? o.bg : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: shelf?.status === o.value ? o.color : 'var(--t1)', textAlign: 'left', fontWeight: shelf?.status === o.value ? 700 : 400 }}>
                      {shelf?.status === o.value ? '✓ ' : ''}{o.label}
                    </button>
                  ))}
                  {shelf && (
                    <button onClick={() => setShelfStatus(null)}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', borderTop: '1px solid var(--b1)', cursor: 'pointer', fontSize: 12, color: 'var(--rd)', textAlign: 'left' }}>
                      Remove from shelf
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean description */}
        {description && (
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.75 }}>
              {showFullDesc ? description : description.slice(0, 300) + (description.length > 300 ? '…' : '')}
            </div>
            {description.length > 300 && (
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

      {/* Type filter tabs + Post button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="tabs" style={{ flex: 1 }}>
          {TYPE_TABS.map(t => {
            const count = t.key === 'all' ? posts.length : posts.filter((p: any) => p.type === t.key).length
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}>
                {t.label}{count > 0 && t.key !== 'all' ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
        <Link href={`/post/create?book=${book.id}`} className="btn-primary"
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          + Post
        </Link>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✍️</div>
          <div className="empty-text">{activeTab === 'all' ? 'Be the first to share something about this book' : `No ${activeTab}s yet — be the first!`}</div>
          <Link href={`/post/create?book=${book.id}`} className="btn-primary"
            style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none', fontSize: 13 }}>
            Write a {activeTab === 'all' ? 'post' : activeTab}
          </Link>
        </div>
      ) : (
        filteredPosts.map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
    </PageLayout>
  )
}
