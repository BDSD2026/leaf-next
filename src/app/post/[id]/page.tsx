import { createClient } from '@/lib/supabase/server'
import PostDetailClient from './PostDetailClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts_with_details')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!post || post.is_deleted) return notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select(`*, author:profiles!comments_user_id_fkey(id, username, name, color, avatar_url)`)
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  let userVote = 0
  if (user) {
    const { data: vote } = await supabase.from('votes').select('value').eq('post_id', params.id).eq('user_id', user.id).maybeSingle()
    userVote = vote?.value ?? 0
  }

  let profile = null
  if (user) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = p
  }

  return <PostDetailClient post={{ ...post, user_vote: userVote }} comments={comments || []} currentUserId={user?.id} profile={profile} />
}
