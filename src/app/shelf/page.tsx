import { createClient } from '@/lib/supabase/server'
import ShelfClient from './ShelfClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ShelfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: shelf } = await supabase
    .from('shelves')
    .select('*, book:books(id,title,author,cover_url,genre,insights_count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <ShelfClient shelf={shelf || []} userId={user.id} />
}
