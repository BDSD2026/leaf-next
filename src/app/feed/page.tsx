import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FeedPage({ searchParams }: { searchParams: { sort?: string; filter?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sort = searchParams.sort || 'trending'
  const filter = searchParams.filter || 'all'

  // Fetch posts
  let query = supabase.from('posts_with_details').select('*').eq('is_deleted', false)
  if (filter !== 'all') query = query.eq('type', filter)

  let posts: any[] = []
  if (sort === 'trending') {
    const { data } = await supabase.from('posts_trending').select('*').limit(30)
    posts = data || []
    if (filter !== 'all') posts = posts.filter(p => p.type === filter)
  } else if (sort === 'new') {
    const { data } = await query.order('created_at', { ascending: false }).limit(30)
    posts = data || []
  } else {
    const { data } = await query.order('upvotes_count', { ascending: false }).limit(30)
    posts = data || []
  }

  // Fetch sidebar data
  const { data: trendingBooks } = await supabase
    .from('books').select('id,title,author,insights_count').gt('insights_count', 0).order('insights_count', { ascending: false }).limit(5)

  // Fetch user votes if logged in
  let userVotes: Record<string, number> = {}
  if (user) {
    const postIds = posts.map(p => p.id)
    if (postIds.length > 0) {
      const { data: votes } = await supabase.from('votes').select('post_id,value').eq('user_id', user.id).in('post_id', postIds)
      votes?.forEach(v => { userVotes[v.post_id] = v.value })
    }
  }

  // Attach user votes to posts
  const postsWithVotes = posts.map(p => ({ ...p, user_vote: userVotes[p.id] ?? 0 }))

  // Get user profile for sidebar
  let profile = null
  let unread = 0
  if (user) {
    const [{ data: p }, { count }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('is_read', false),
    ])
    profile = p
    unread = count ?? 0
  }

  return (
    <FeedClient
      initialPosts={postsWithVotes}
      trendingBooks={trendingBooks || []}
      currentUserId={user?.id}
      profile={profile}
      unread={unread}
      sort={sort}
      filter={filter}
    />
  )
}
