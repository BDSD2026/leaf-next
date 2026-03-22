import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: trendingBooks }] = await Promise.all([
    supabase.from('profiles').select('*').eq('username', params.username).single(),
    supabase.from('books').select('id,title,author,insights_count').gt('insights_count', 0).order('insights_count', { ascending: false }).limit(5),
  ])
  if (!profile) return notFound()

  const [{ data: posts }, { data: shelf }, { data: comments }] = await Promise.all([
    supabase.from('posts_with_details').select('*').eq('user_id', profile.id).eq('is_deleted', false).order('created_at', { ascending: false }),
    supabase.from('shelves').select('*, book:books(id,title,author,cover_url,genre)').eq('user_id', profile.id),
    supabase.from('comments')
      .select('id,text,created_at,post_id,posts!comments_post_id_fkey(id,type,text,book_id,books!posts_book_id_fkey(id,title,author,cover_url))')
      .eq('user_id', profile.id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(50),
  ])

  let isFollowing = false, myProfile = null
  if (user) {
    const [{ data: f }, { data: mp }] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    isFollowing = !!f
    myProfile = mp
  }

  return <ProfileClient profile={profile} posts={posts || []} comments={comments || []} shelf={shelf || []} isFollowing={isFollowing} currentUserId={user?.id} myProfile={myProfile} isMe={user?.id === profile.id} trendingBooks={trendingBooks || []} />
}
