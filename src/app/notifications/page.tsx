import { createClient } from '@/lib/supabase/server'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trendingBooks } = await supabase.from('books').select('id,title,author,insights_count').gt('insights_count', 0).order('insights_count', { ascending: false }).limit(5)

  if (!user) return <NotificationsClient notifs={[]} userId="" trendingBooks={trendingBooks || []} />

  const { data: notifications } = await supabase.from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id,username,name,color,avatar_url)')
    .eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(50)

  await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false)

  return <NotificationsClient notifs={notifications || []} userId={user.id} trendingBooks={trendingBooks || []} />
}
