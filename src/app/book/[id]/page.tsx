import { createClient } from '@/lib/supabase/server'
import BookClient from './BookClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let book = null
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)

  if (isUUID) {
    const { data } = await supabase.from('books').select('*').eq('id', params.id).single()
    book = data
  } else {
    const { data } = await supabase.from('books').select('*').eq('google_id', params.id).maybeSingle()
    if (data) {
      book = data
    } else {
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${params.id}`)
        if (res.ok) {
          const item = await res.json()
          const info = item.volumeInfo || {}
          const bookData = {
            google_id: item.id,
            title: info.title || 'Unknown',
            author: (info.authors || ['Unknown']).join(', '),
            authors: info.authors || [],
            cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            description: info.description?.slice(0, 1000) || null,
            genre: info.categories?.[0] || null,
            categories: info.categories || [],
            published_date: info.publishedDate || null,
            publisher: info.publisher || null,
            page_count: info.pageCount || null,
            language: info.language || 'en',
          }
          const { data: upserted } = await supabase.from('books').upsert(bookData, { onConflict: 'google_id' }).select().single()
          book = upserted || { ...bookData, id: params.id }
        }
      } catch {}
    }
  }

  if (!book) return notFound()

  const [{ data: posts }, { data: trendingBooks }] = await Promise.all([
    supabase.from('posts_with_details').select('*').eq('book_id', book.id).eq('is_deleted', false).order('created_at', { ascending: false }),
    supabase.from('books').select('id,title,author,insights_count').order('insights_count', { ascending: false }).limit(5),
  ])

  let shelfEntry = null, userVotes: Record<string, number> = {}, profile = null
  if (user) {
    const [{ data: shelf }, { data: votes }, { data: p }] = await Promise.all([
      supabase.from('shelves').select('*').eq('user_id', user.id).eq('book_id', book.id).maybeSingle(),
      supabase.from('votes').select('post_id,value').eq('user_id', user.id).in('post_id', (posts||[]).map(p => p.id)),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    shelfEntry = shelf
    votes?.forEach(v => { userVotes[v.post_id] = v.value })
    profile = p
  }

  const postsWithVotes = (posts||[]).map(p => ({ ...p, user_vote: userVotes[p.id] ?? 0 }))
  return <BookClient book={book} posts={postsWithVotes} shelfEntry={shelfEntry} currentUserId={user?.id} profile={profile} trendingBooks={trendingBooks || []} />
}
