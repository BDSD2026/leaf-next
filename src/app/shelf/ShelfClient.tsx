'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import PageLayout from '@/components/PageLayout'

function Stars({ rating, onRate }: { rating?: number; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 1, marginTop: 5, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onMouseEnter={() => onRate && setHover(s)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate?.(s)}
          style={{ fontSize: 11, cursor: onRate ? 'pointer' : 'default', color: (hover || rating || 0) >= s ? '#F0A050' : '#252528', lineHeight: 1 }}>★</span>
      ))}
    </div>
  )
}

function BookCover({ book, width, height }: { book: any; width: number; height: number }) {
  if (book?.cover_url) {
    return (
      <Image src={book.cover_url} alt="" width={width} height={height}
        style={{ width, height, objectFit: 'cover', borderRadius: 5, display: 'block',
          border: '1px solid #1C1C1F', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{ width, height, borderRadius: 5, background: '#1A1A1D', border: '1px solid #1C1C1F',
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.floor(height / 3) }}>
      📖
    </div>
  )
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

  const reading  = shelf.filter(e => e.status === 'reading')
  const read     = shelf.filter(e => e.status === 'read')
  const wantRead = shelf.filter(e => e.status === 'want_to_read')

  const avgRating = read.filter(e => e.rating).length > 0
    ? (read.filter(e => e.rating).reduce((a, e) => a + e.rating, 0) / read.filter(e => e.rating).length).toFixed(1)
    : null

  return (
    <PageLayout trendingBooks={trendingBooks}>
      <div style={{ padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: '#F0EEE8' }}>My Shelf</h1>
          <Link href="/search" style={{ fontSize: 12, color: '#5CD4A4', textDecoration: 'none', padding: '7px 14px', borderRadius: 20, border: '1px solid rgba(92,212,164,.25)', background: 'rgba(92,212,164,.06)' }}>+ Find Books</Link>
        </div>
        <p style={{ fontSize: 12, color: '#4E4D4C', marginBottom: 22 }}>{shelf.length} books across your collection</p>

        {/* Stats */}
        {shelf.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { n: reading.length, l: 'Reading now', c: '#5CD4A4' },
              { n: read.length, l: 'Finished', c: '#5B9CF6' },
              { n: wantRead.length, l: 'Want to read', c: '#F0A050' },
              { n: avgRating ?? '—', l: 'Avg rating', c: '#8F8D8A' },
            ].map(({ n, l, c }) => (
              <div key={l} style={{ background: '#131315', border: '1px solid #1C1C1F', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, color: c }}>{n}</div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.12em', color: '#4E4D4C', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {shelf.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 14, color: '#8F8D8A', marginBottom: 16 }}>Your shelf is empty</div>
            <Link href="/search" style={{ background: '#5CD4A4', color: '#0C0C0E', padding: '9px 20px', borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Find books to read →</Link>
          </div>
        )}

        {/* ── Currently Reading — large books on rail ── */}
        {reading.length > 0 && (
          <ShelfSection color="#5CD4A4" label="Currently Reading" count={reading.length}>
            <ShelfRail>
              {reading.map(e => (
                <div key={e.book?.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 64, cursor: 'pointer' }}
                  className="book-hover">
                  <div style={{ transition: 'transform .18s' }} onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.transform='translateY(-8px)'}
                    onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.transform=''}>
                    <Link href={`/book/${e.book?.id}`}><BookCover book={e.book} width={64} height={90} /></Link>
                  </div>
                  <div style={{ marginTop: 8, width: 64, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#F0EEE8', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                    <div style={{ fontSize: 8, color: '#4E4D4C', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.author?.split(' ').pop()}</div>
                    <div style={{ height: 3, background: '#1C1C1F', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ height: 3, background: '#5CD4A4', borderRadius: 2, width: '40%' }} />
                    </div>
                    <div style={{ fontSize: 8, color: '#5CD4A4', marginTop: 3 }}>In progress</div>
                  </div>
                </div>
              ))}
            </ShelfRail>
          </ShelfSection>
        )}

        {/* ── Read — medium books on rail with stars ── */}
        {read.length > 0 && (
          <ShelfSection color="#5B9CF6" label="Read" count={read.length} extra={avgRating ? `avg ${avgRating}★` : undefined}>
            <ShelfRail>
              {read.map(e => (
                <div key={e.book?.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 52 }}>
                  <div style={{ transition: 'transform .18s' }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.transform='translateY(-6px)'}
                    onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.transform=''}>
                    <Link href={`/book/${e.book?.id}`}><BookCover book={e.book} width={52} height={74} /></Link>
                  </div>
                  <div style={{ marginTop: 8, width: 52, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#F0EEE8', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                    <Stars rating={e.rating} onRate={r => rate(e.book?.id, r)} />
                  </div>
                </div>
              ))}
            </ShelfRail>
          </ShelfSection>
        )}

        {/* ── Want to Read — clean list rows ── */}
        {wantRead.length > 0 && (
          <ShelfSection color="#F0A050" label="Want to Read" count={wantRead.length}>
            <div style={{ background: '#111113', borderRadius: 10, border: '1px solid #1C1C1F', overflow: 'hidden' }}>
              {wantRead.map((e, i) => (
                <div key={e.book?.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: i < wantRead.length - 1 ? '1px solid #131315' : 'none', alignItems: 'center' }}>
                  <Link href={`/book/${e.book?.id}`} style={{ flexShrink: 0 }}>
                    <BookCover book={e.book} width={38} height={54} />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/book/${e.book?.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F0EEE8', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                      <div style={{ fontSize: 11, color: '#8F8D8A' }}>{e.book?.author}</div>
                      {e.book?.genre && <div style={{ fontSize: 10, color: '#4E4D4C', marginTop: 3 }}>{e.book.genre}</div>}
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#F0A050', background: 'rgba(240,160,80,.1)', padding: '2px 8px', borderRadius: 20 }}>On list</span>
                    <button onClick={() => remove(e.book?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4E4D4C', fontSize: 11, padding: 0 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </ShelfSection>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </PageLayout>
  )
}

function ShelfSection({ color, label, count, extra, children }: { color: string; label: string; count: number; extra?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#8F8D8A' }}>{label}</span>
        <span style={{ fontSize: 10, color: '#4E4D4C' }}>{count} book{count !== 1 ? 's' : ''}{extra ? ` · ${extra}` : ''}</span>
      </div>
      {children}
    </div>
  )
}

function ShelfRail({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ background: '#111113', borderRadius: '8px 8px 0 0', borderBottom: '3px solid #222226', padding: '18px 16px 12px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {children}
      </div>
      <div style={{ height: 5, background: '#0C0C0E', borderRadius: '0 0 8px 8px', marginBottom: 2 }} />
    </>
  )
}
