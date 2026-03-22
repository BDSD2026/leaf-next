'use client'
import PageLayout from '@/components/PageLayout'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const SHELF_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  reading:      { label: 'Currently Reading', color: '#5CD4A4', bg: 'rgba(92,212,164,0.12)',  dot: '#5CD4A4' },
  read:         { label: 'Read',               color: '#5B9CF6', bg: 'rgba(91,156,246,0.12)',  dot: '#5B9CF6' },
  want_to_read: { label: 'Want to Read',       color: '#F0A050', bg: 'rgba(240,160,80,0.12)',  dot: '#F0A050' },
}

function Stars({ rating, onRate }: { rating?: number; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onMouseEnter={() => onRate && setHover(s)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate?.(s)}
          style={{ fontSize: 14, cursor: onRate ? 'pointer' : 'default', color: (hover || rating || 0) >= s ? '#F0A050' : '#252528', lineHeight: 1 }}>★</span>
      ))}
    </div>
  )
}

function BookCover({ book, size = 'md' }: { book: any; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: [44, 62], md: [64, 90], lg: [90, 126] }[size]
  return book?.cover_url
    ? <Image src={book.cover_url} alt="" width={dims[0]} height={dims[1]}
        style={{ borderRadius: size === 'lg' ? 8 : 6, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }} />
    : <div style={{ width: dims[0], height: dims[1], background: 'var(--s3)', borderRadius: size === 'lg' ? 8 : 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size === 'lg' ? 28 : 18 }}>📖</div>
}

export default function ShelfClient({ shelf: initShelf, userId, trendingBooks = [] }: { shelf: any[]; userId: string; trendingBooks?: any[] }) {
  const [shelf, setShelf] = useState(initShelf)
  const [toast, setToast] = useState('')
  const supabase = createClient()
  const pop = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const remove = async (bookId: string) => {
    await supabase.from('shelves').delete().match({ user_id: userId, book_id: bookId })
    setShelf(s => s.filter(e => e.book?.id !== bookId))
    pop('Removed from shelf')
  }

  const rate = async (bookId: string, rating: number) => {
    await supabase.from('shelves').update({ rating }).match({ user_id: userId, book_id: bookId })
    setShelf(s => s.map(e => e.book?.id === bookId ? { ...e, rating } : e))
    pop('Rating saved ✓')
  }

  const reading      = shelf.filter(e => e.status === 'reading')
  const read         = shelf.filter(e => e.status === 'read')
  const want_to_read = shelf.filter(e => e.status === 'want_to_read')

  return (
    <PageLayout trendingBooks={trendingBooks}>
    <div style={{ padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)' }}>My Shelf</h1>
        <Link href="/search" className="btn-primary" style={{ textDecoration: 'none', fontSize: 12, padding: '7px 16px', borderRadius: 20 }}>+ Find Books</Link>
      </div>
      <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 24 }}>Your personal library at a glance</p>

      {/* Stats */}
      {shelf.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { n: reading.length, l: 'Reading now', c: '#5CD4A4' },
            { n: read.length, l: 'Read', c: '#5B9CF6' },
            { n: want_to_read.length, l: 'Want to read', c: '#F0A050' },
            { n: shelf.length, l: 'Total books', c: 'var(--t3)' },
          ].map(({ n, l, c }) => (
            <div key={l} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, padding: '14px 16px' }}>
              <div className="serif" style={{ fontSize: 24, fontWeight: 700, color: c }}>{n}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {shelf.length === 0 && (
        <div className="empty" style={{ padding: '60px 0' }}>
          <div className="empty-icon" style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <div className="empty-text" style={{ marginBottom: 12 }}>Your shelf is empty</div>
          <Link href="/search" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Find books to read →</Link>
        </div>
      )}

      {/* Currently Reading — horizontal cards with progress feel */}
      {reading.length > 0 && (
        <Section color="#5CD4A4" label="Currently Reading" count={reading.length}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {reading.map(e => (
              <div key={e.book?.id} style={{ background: 'var(--s1)', border: '1px solid #2E2E34', borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Link href={`/book/${e.book?.id}`}><BookCover book={e.book} size="sm" /></Link>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Link href={`/book/${e.book?.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3, marginBottom: 2 }}>{e.book?.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>{e.book?.author}</div>
                  </Link>
                  <div style={{ height: 3, background: 'var(--s3)', borderRadius: 2 }}>
                    <div style={{ height: 3, borderRadius: 2, background: '#5CD4A4', width: `${Math.floor(Math.random() * 60 + 20)}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#5CD4A4', marginTop: 4 }}>In progress</div>
                </div>
                <button onClick={() => remove(e.book?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12, padding: 0, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Read — cover grid with stars */}
      {read.length > 0 && (
        <Section color="#5B9CF6" label="Read" count={read.length}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {read.map(e => (
              <div key={e.book?.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
                <Link href={`/book/${e.book?.id}`} style={{ display: 'block', position: 'relative' }}>
                  {e.book?.cover_url
                    ? <Image src={e.book.cover_url} alt="" width={200} height={280}
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📖</div>
                  }
                </Link>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{e.book?.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{e.book?.author?.split(' ').pop()}</div>
                  <Stars rating={e.rating} onRate={r => rate(e.book?.id, r)} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Want to Read — compact list */}
      {want_to_read.length > 0 && (
        <Section color="#F0A050" label="Want to Read" count={want_to_read.length}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {want_to_read.map(e => (
              <div key={e.book?.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', opacity: 0.85 }}>
                <Link href={`/book/${e.book?.id}`}><BookCover book={e.book} size="sm" /></Link>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Link href={`/book/${e.book?.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{e.book?.author}</div>
                  </Link>
                  <span style={{ display: 'inline-block', marginTop: 5, padding: '2px 7px', borderRadius: 20, background: 'rgba(240,160,80,0.12)', color: '#F0A050', fontSize: 9, fontWeight: 700 }}>Want to read</span>
                </div>
                <button onClick={() => remove(e.book?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12, padding: 0, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
    </PageLayout>
  )
}

function Section({ color, label, count, children }: { color: string; label: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--t3)', opacity: 0.6 }}>{count} book{count !== 1 ? 's' : ''}</span>
      </div>
      {children}
    </div>
  )
}
