'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LeafLogo from '@/components/LeafLogo'
import Image from 'next/image'

const POST_TYPES = ['insight','thought','question','review']
const TYPE_LABELS: Record<string, string> = { insight:'Insight', thought:'Thought', question:'Question', review:'Review' }
const TYPE_STYLES: Record<string, any> = {
  insight:  { border: 'var(--gr)', bg: 'var(--gr-t)', color: 'var(--gr)' },
  thought:  { border: 'var(--bl)', bg: 'var(--bl-t)', color: 'var(--bl)' },
  question: { border: 'var(--am)', bg: 'var(--am-t)', color: 'var(--am)' },
  review:   { border: 'var(--ro)', bg: 'var(--ro-t)', color: 'var(--ro)' },
}

export default function CreatePostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [type, setType] = useState('insight')
  const [text, setText] = useState('')
  const [subtext, setSubtext] = useState('')
  const [tags, setTags] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [bookResults, setBookResults] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUser(data.user)
    })
  }, [])

  const searchBooks = async (q: string) => {
    if (q.length < 2) { setBookResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&fields=items(id,volumeInfo(title,authors,imageLinks,categories))`)
      const data = await res.json()
      setBookResults((data.items || []).map((item: any) => ({
        google_id: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.[0] || 'Unknown',
        cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        genre: item.volumeInfo.categories?.[0] || null,
      })))
    } catch {}
    setSearching(false)
  }

  const selectBook = async (book: any) => {
    setSelectedBook(book)
    setBookSearch('')
    setBookResults([])
  }

  const upsertBook = async (book: any) => {
    const { data: existing } = await supabase.from('books').select('id').eq('google_id', book.google_id).maybeSingle()
    if (existing) return existing.id
    const { data: newBook } = await supabase.from('books').insert({
      google_id: book.google_id,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      genre: book.genre,
    }).select('id').single()
    return newBook?.id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) { setError('Post text is required.'); return }
    setSubmitting(true); setError('')
    
    let bookId = null
    if (selectedBook) bookId = await upsertBook(selectedBook)

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    const { data: post, error: err } = await supabase.from('posts').insert({
      user_id: user.id,
      book_id: bookId,
      type,
      text: text.trim(),
      subtext: subtext.trim() || null,
      tags: tagList,
    }).select('id').single()

    if (err) { setError(err.message); setSubmitting(false); return }
    router.push(`/post/${post.id}`)
  }

  const MAX = 500
  const ok = text.trim().length > 0

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <LeafLogo size={18} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gr)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Post</span>
        </div>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 24 }}>What did you learn?</h1>

        <form onSubmit={handleSubmit} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 28 }}>
          {error && <div style={{ background: 'rgba(224,92,106,0.1)', border: '1px solid rgba(224,92,106,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: 'var(--rd)', marginBottom: 16 }}>{error}</div>}

          {/* Post type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Post type</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {POST_TYPES.map(k => {
                const s = TYPE_STYLES[k]
                return (
                  <button key={k} type="button" onClick={() => setType(k)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${type === k ? s.border : 'var(--b1)'}`, background: type === k ? s.bg : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: type === k ? 700 : 400, color: type === k ? s.color : 'var(--t3)' }}>
                    {TYPE_LABELS[k]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Book search */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Book <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            {selectedBook ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 9 }}>
                {selectedBook.cover_url && <Image src={selectedBook.cover_url} alt="" width={22} height={30} style={{ borderRadius: 3, objectFit: 'cover' }} />}
                <span style={{ flex: 1, fontSize: 13, color: 'var(--t1)' }}>{selectedBook.title}</span>
                <button type="button" onClick={() => setSelectedBook(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 13 }}>✕</button>
              </div>
            ) : (
              <div>
                <input value={bookSearch} onChange={e => { setBookSearch(e.target.value); searchBooks(e.target.value) }}
                  placeholder="Search any book…" className="input" />
                {bookResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 9, zIndex: 10, maxHeight: 240, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    {bookResults.map(b => (
                      <div key={b.google_id} onClick={() => selectBook(b)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--b1)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--s3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        {b.cover_url && <Image src={b.cover_url} alt="" width={22} height={30} style={{ borderRadius: 3, objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{b.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{b.author}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main text */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{TYPE_LABELS[type]}</label>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={MAX}
              placeholder={type === 'insight' ? 'The idea that stuck with you…' : type === 'question' ? 'What are you wondering?' : type === 'review' ? 'Your honest take…' : 'Your thought…'}
              className="textarea"
              style={{ fontFamily: type === 'insight' ? 'Georgia,serif' : 'inherit', fontStyle: type === 'insight' ? 'italic' : 'normal' }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: text.length > MAX * 0.9 ? 'var(--rd)' : 'var(--t3)', marginTop: 4 }}>{text.length}/{MAX}</div>
          </div>

          {/* Subtext */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Your take <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea value={subtext} onChange={e => setSubtext(e.target.value)} placeholder="What does this mean to you?" className="textarea" style={{ minHeight: 72 }} />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Tags <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma-separated)</span>
            </label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="habits, philosophy…" className="input" />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={!ok || submitting} className="btn-primary" style={{ padding: '9px 22px', fontSize: 14 }}>
              {submitting ? 'Sharing…' : 'Share →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
