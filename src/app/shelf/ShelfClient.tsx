'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const TABS = [['reading','📖','Reading'],['want_to_read','🔖','Want to Read'],['read','✓','Read']]
const SHELF_COLORS: Record<string,string> = { want_to_read:'var(--am)', reading:'var(--gr)', read:'var(--bl)' }

export default function ShelfClient({ shelf: initShelf, userId }: { shelf: any[], userId: string }) {
  const [shelf, setShelf] = useState(initShelf)
  const [tab, setTab] = useState('reading')
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

  const entries = shelf.filter(e => e.status === tab)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)' }}>My Shelf</h1>
        <Link href="/search" className="btn-primary" style={{ textDecoration: 'none', fontSize: 12, padding: '7px 14px', borderRadius: 20 }}>+ Find Books</Link>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)', marginBottom: 20 }}>
        {TABS.map(([s, icon, label]) => (
          <button key={s} onClick={() => setTab(s)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingBottom: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: tab === s ? 700 : 400, color: tab === s ? 'var(--gr)' : 'var(--t3)', borderBottom: `2px solid ${tab === s ? 'var(--gr)' : 'transparent'}` }}>
            <span style={{ fontSize: 14 }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📚</div>
          <div className="empty-text">Nothing here yet</div>
          <Link href="/search" style={{ color: 'var(--gr)', fontSize: 13, display: 'block', marginTop: 8 }}>Search for books to add →</Link>
        </div>
      ) : entries.map(e => (
        <div key={e.book?.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--b1)' }}>
          <Link href={`/book/${e.book?.id}`}>
            {e.book?.cover_url
              ? <Image src={e.book.cover_url} alt="" width={64} height={90} style={{ borderRadius: 7, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.4)', cursor: 'pointer' }} />
              : <div style={{ width: 64, height: 90, background: 'var(--s3)', borderRadius: 7, flexShrink: 0 }} />
            }
          </Link>
          <div style={{ flex: 1 }}>
            <Link href={`/book/${e.book?.id}`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3, marginBottom: 3, display: 'block', textDecoration: 'none' }}>{e.book?.title}</Link>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>{e.book?.author}</div>
            <span style={{ padding: '2px 9px', borderRadius: 20, background: SHELF_COLORS[e.status] + '22', color: SHELF_COLORS[e.status], fontSize: 10, fontWeight: 600 }}>
              {TABS.find(t => t[0] === e.status)?.[2]}
            </span>
            {tab === 'read' && (
              <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} onClick={() => rate(e.book?.id, star)}
                    style={{ fontSize: 18, cursor: 'pointer', color: (e.rating || 0) >= star ? 'var(--am)' : 'var(--s3)' }}>★</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => remove(e.book?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12, alignSelf: 'flex-start', padding: 4 }}>✕</button>
        </div>
      ))}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
