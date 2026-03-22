'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'
import LeafLogo from '@/components/LeafLogo'
import Image from 'next/image'

const TYPE_CONFIG: Record<string, {
  label: string; color: string; bg: string;
  mainLabel: string; mainPlaceholder: string;
  hasRating: boolean; hasSubtext: boolean;
  subtextLabel: string; subtextPlaceholder: string;
  suggestedTags: string[];
}> = {
  insight: {
    label: 'Insight', color: 'var(--gr)', bg: 'var(--gr-t)',
    mainLabel: 'The insight', mainPlaceholder: 'The idea, quote, or concept that stuck with you…',
    hasRating: false, hasSubtext: true,
    subtextLabel: 'Why it matters', subtextPlaceholder: 'What does this mean to you? Why does it resonate?',
    suggestedTags: ['cognition','philosophy','decision-making','systems','mental-models','productivity','science','economics'],
  },
  thought: {
    label: 'Thought', color: 'var(--bl)', bg: 'var(--bl-t)',
    mainLabel: 'Your thought', mainPlaceholder: 'A reflection, observation, or connection you made…',
    hasRating: false, hasSubtext: true,
    subtextLabel: 'Context', subtextPlaceholder: 'Any background or context that helps others understand…',
    suggestedTags: ['reflection','society','culture','history','identity','creativity','technology','future'],
  },
  question: {
    label: 'Question', color: 'var(--am)', bg: 'var(--am-t)',
    mainLabel: 'Your question', mainPlaceholder: 'What are you wondering or unsure about?',
    hasRating: false, hasSubtext: true,
    subtextLabel: 'What sparked this?', subtextPlaceholder: 'What led you to this question?',
    suggestedTags: ['open-question','debate','ethics','curiosity','research','learning','advice'],
  },
  review: {
    label: 'Review', color: 'var(--ro)', bg: 'var(--ro-t)',
    mainLabel: 'Your review', mainPlaceholder: 'What did you think overall? Who is this book for?',
    hasRating: true, hasSubtext: true,
    subtextLabel: 'Key takeaway', subtextPlaceholder: 'The single most valuable thing you took away…',
    suggestedTags: ['must-read','overrated','dense','quick-read','life-changing','practical','theory','beginner-friendly'],
  },
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: (hover || value) >= s ? 'var(--am)' : 'var(--s3)', padding: 0, lineHeight: 1 }}>
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 13, color: 'var(--t3)', alignSelf: 'center', marginLeft: 4 }}>
          {['','Poor','Fair','Good','Great','Must-read'][value]}
        </span>
      )}
    </div>
  )
}

function CreatePostInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [type, setType] = useState('insight')
  const [text, setText] = useState('')
  const [subtext, setSubtext] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [bookResults, setBookResults] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const searchTimer = useRef<any>(null)

  const cfg = TYPE_CONFIG[type]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUser(data.user)
    })
  }, [])

  // Pre-select book if coming from book page (handles both UUID and google_id)
  useEffect(() => {
    const bookId = searchParams.get('book')
    if (!bookId) return
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId)
    const query = isUUID
      ? supabase.from('books').select('*').eq('id', bookId).single()
      : supabase.from('books').select('*').eq('google_id', bookId).maybeSingle()
    query.then(({ data }) => {
      if (data) setSelectedBook(data)
      else if (!isUUID) {
        // Fetch from Google Books API and upsert
        fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
          .then(r => r.json())
          .then(item => {
            if (!item.volumeInfo) return
            const info = item.volumeInfo
            const book = {
              google_id: item.id,
              title: info.title || 'Unknown',
              author: (info.authors || ['Unknown']).join(', '),
              cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
              genre: info.categories?.[0] || null,
            }
            setSelectedBook(book)
          })
      }
    })
  }, [])

  const searchBooks = async (q: string) => {
    if (q.length < 2) { setBookResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&fields=items(id,volumeInfo(title,authors,imageLinks,categories,publishedDate))`)
      const data = await res.json()
      setBookResults((data.items || []).map((item: any) => ({
        google_id: item.id,
        title: item.volumeInfo?.title || 'Unknown',
        author: item.volumeInfo?.authors?.[0] || 'Unknown',
        cover_url: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        genre: item.volumeInfo?.categories?.[0] || null,
      })))
    } catch {}
    setSearching(false)
  }

  const upsertBook = async (book: any): Promise<string | null> => {
    // If book already has a UUID id (came from DB), use it directly
    if (book.id && !book.id.includes('-') === false && book.id.length > 20) return book.id
    if (book.id) return book.id
    // Otherwise upsert via google_id
    const { data: existing } = await supabase.from('books').select('id').eq('google_id', book.google_id).maybeSingle()
    if (existing) return existing.id
    const { data: newBook, error: bookErr } = await supabase.from('books').insert({
      google_id: book.google_id,
      title: book.title,
      author: book.author,
      authors: [book.author],
      cover_url: book.cover_url,
      genre: book.genre,
    }).select('id').single()
    if (bookErr) { console.error('Book upsert error:', bookErr); return null }
    return newBook?.id || null
  }

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) { setError('Post text is required.'); return }
    if (type === 'review' && rating === 0) { setError('Please add a star rating for your review.'); return }
    setSubmitting(true); setError('')

    // Ensure profile exists — in case signup trigger didn't fire
    const { data: existingProfile } = await supabase
      .from('profiles').select('id').eq('id', user.id).maybeSingle()
    if (!existingProfile) {
      const email = user.email || ''
      const baseUsername = email.split('@')[0].replace(/[^a-z0-9._]/gi, '').toLowerCase() || 'user'
      await supabase.from('profiles').upsert({
        id: user.id,
        username: baseUsername + '_' + user.id.slice(0, 6),
        name: user.user_metadata?.name || baseUsername,
        color: '#7C6FCD',
      }, { onConflict: 'id', ignoreDuplicates: true })
    }

    let bookId = null
    if (selectedBook) bookId = await upsertBook(selectedBook)

    // Insert into posts table — the schema uses 'posts' with RLS
    const insertData: any = {
      user_id: user.id,
      type,
      text: text.trim(),
      subtext: subtext.trim() || null,
      tags,
    }
    if (bookId) insertData.book_id = bookId
    if (type === 'review' && rating > 0) insertData.rating = rating

    const { data: post, error: err } = await supabase
      .from('posts')
      .insert(insertData)
      .select('id')
      .single()

    if (err) {
      console.error('Post insert error:', err)
      setError(`Failed to post: ${err.message}. Make sure you are signed in.`)
      setSubmitting(false)
      return
    }
    router.push(`/post/${post.id}`)
  }

  const MAX = 600
  const ok = text.trim().length > 0

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <LeafLogo size={18} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gr)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Post</span>
        </div>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 24 }}>What did you learn?</h1>

        <form onSubmit={handleSubmit} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 28 }}>
          {error && <div style={{ background: 'rgba(224,92,106,0.1)', border: '1px solid rgba(224,92,106,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: 'var(--rd)', marginBottom: 16 }}>{error}</div>}

          {/* Post type selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Post type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {Object.entries(TYPE_CONFIG).map(([k, c]) => (
                <button key={k} type="button" onClick={() => setType(k)}
                  style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${type === k ? c.color : 'var(--b1)'}`, background: type === k ? c.bg : 'transparent', cursor: 'pointer', transition: 'all 0.12s' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: type === k ? c.color : 'var(--t3)', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 9, color: type === k ? c.color : 'var(--t3)', opacity: 0.8, lineHeight: 1.3 }}>
                    {k === 'insight' && 'An idea that stuck'}
                    {k === 'thought' && 'A reflection'}
                    {k === 'question' && 'Something to explore'}
                    {k === 'review' && 'Rate the book'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Book search */}
          <div style={{ marginBottom: 18, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Book {type !== 'review' && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>}
              {type === 'review' && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ro)' }}> (required for review)</span>}
            </label>
            {selectedBook ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 9 }}>
                {selectedBook.cover_url && <Image src={selectedBook.cover_url} alt="" width={28} height={38} style={{ borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{selectedBook.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{selectedBook.author}</div>
                </div>
                <button type="button" onClick={() => setSelectedBook(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 16, padding: 4 }}>✕</button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 13 }}>⌕</span>
                  <input value={bookSearch}
                    onChange={e => {
                      setBookSearch(e.target.value)
                      clearTimeout(searchTimer.current)
                      searchTimer.current = setTimeout(() => searchBooks(e.target.value), 300)
                    }}
                    placeholder="Search any book by title or author…" className="input"
                    style={{ paddingLeft: 32 }} />
                </div>
                {searching && <div style={{ fontSize: 12, color: 'var(--t3)', padding: '8px 4px' }}>Searching…</div>}
                {bookResults.length > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 9, zIndex: 20, maxHeight: 260, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {bookResults.map(b => (
                      <div key={b.google_id} onClick={() => { setSelectedBook(b); setBookSearch(''); setBookResults([]) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--b1)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--s3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        {b.cover_url
                          ? <Image src={b.cover_url} alt="" width={28} height={38} style={{ borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 28, height: 38, background: 'var(--s3)', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📖</div>
                        }
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{b.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{b.author}{b.genre ? ` · ${b.genre}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Star rating — only for reviews */}
          {type === 'review' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
          )}

          {/* Main text — label and placeholder change per type */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cfg.mainLabel}</label>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={MAX}
              placeholder={cfg.mainPlaceholder} className="textarea"
              style={{ fontFamily: type === 'insight' ? 'Georgia,serif' : 'inherit', fontStyle: type === 'insight' ? 'italic' : 'normal', minHeight: 110 }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: text.length > MAX * 0.9 ? 'var(--rd)' : 'var(--t3)', marginTop: 4 }}>{text.length}/{MAX}</div>
          </div>

          {/* Subtext — label and placeholder change per type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {cfg.subtextLabel} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea value={subtext} onChange={e => setSubtext(e.target.value)}
              placeholder={cfg.subtextPlaceholder} className="textarea" style={{ minHeight: 72 }} />
          </div>

          {/* Tags with suggestions */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Tags</label>

            {/* Suggested tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {cfg.suggestedTags.filter(t => !tags.includes(t)).slice(0, 6).map(t => (
                <button key={t} type="button" onClick={() => addTag(t)}
                  style={{ padding: '3px 10px', borderRadius: 20, border: '1px dashed var(--b2)', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--t3)', transition: 'all 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.color; (e.currentTarget as HTMLElement).style.color = cfg.color }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--b2)'; (e.currentTarget as HTMLElement).style.color = 'var(--t3)' }}>
                  + {t}
                </button>
              ))}
            </div>

            {/* Selected tags */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {tags.map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: cfg.bg, borderRadius: 20, fontSize: 11, color: cfg.color, fontWeight: 600 }}>
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom tag input */}
            <input value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
              placeholder={tags.length < 8 ? "Type a tag and press Enter…" : "Max 8 tags reached"}
              disabled={tags.length >= 8}
              className="input" style={{ fontSize: 13 }} />
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

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
      <CreatePostInner />
    </Suspense>
  )
}
