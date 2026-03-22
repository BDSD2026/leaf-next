import { createClient } from '@/lib/supabase/server'
import NotificationsClient from './NotificationsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: notifs } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, username, name, color, avatar_url)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read
  await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false)

  return <NotificationsClient notifs={notifs || []} userId={user.id} />
}
