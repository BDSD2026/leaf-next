import { createClient } from '@/lib/supabase/server'
import ShelfClient from './ShelfClient'

export const dynamic = 'force-dynamic'

export default async function ShelfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <ShelfClient shelf={[]} userId="" />
  }

  const { data: shelf } = await supabase
    .from('shelves')
    .select('*, book:books(id,title,author,cover_url,genre,google_id)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <ShelfClient shelf={shelf || []} userId={user.id} />
}
