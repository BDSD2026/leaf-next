import { createClient } from '@/lib/supabase/server'
import BookClient from './BookClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: book } = await supabase.from('books').select('*').eq('id', params.id).single()
  if (!book) return notFound()

  const { data: posts } = await supabase.from('posts_with_details').select('*')
    .eq('book_id', params.id).eq('is_deleted', false).order('created_at', { ascending: false })

  let shelfEntry = null, userVotes: Record<string,number> = {}
  if (user) {
    const [{ data: shelf }, { data: votes }] = await Promise.all([
      supabase.from('shelves').select('*').eq('user_id', user.id).eq('book_id', params.id).maybeSingle(),
      supabase.from('votes').select('post_id,value').eq('user_id', user.id).in('post_id', (posts||[]).map(p=>p.id)),
    ])
    shelfEntry = shelf
    votes?.forEach(v => { userVotes[v.post_id] = v.value })
  }

  const postsWithVotes = (posts||[]).map(p => ({ ...p, user_vote: userVotes[p.id] ?? 0 }))

  let profile = null
  if (user) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = p
  }

  return <BookClient book={book} posts={postsWithVotes} shelfEntry={shelfEntry} currentUserId={user?.id} profile={profile} />
}
