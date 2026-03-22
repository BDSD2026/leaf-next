import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PostDetailClient from './PostDetailClient'

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: post }, { data: trendingBooks }] = await Promise.all([
    supabase.from('posts_with_details').select('*').eq('id', params.id).single(),
    supabase.from('books').select('id,title,author,insights_count').gt('insights_count', 0).order('insights_count', { ascending: false }).limit(5),
  ])
  if (!post) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select(`*, author:profiles!comments_user_id_fkey(id,username,name,color,avatar_url)`)
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  let userVote = 0, profile = null
  if (user) {
    const [{ data: v }, { data: p }] = await Promise.all([
      supabase.from('votes').select('value').eq('post_id', params.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    userVote = v?.value ?? 0
    profile = p
  }

  return <PostDetailClient post={{ ...post, user_vote: userVote }} comments={comments || []} currentUserId={user?.id} profile={profile} trendingBooks={trendingBooks || []} />
}
