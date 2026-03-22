import { createClient } from '@/lib/supabase/server'
import ShelfClient from './ShelfClient'

export const dynamic = 'force-dynamic'

export default async function ShelfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trendingBooks } = await supabase.from('books').select('id,title,author,insights_count').gt('insights_count', 0).order('insights_count', { ascending: false }).limit(5)

  if (!user) return <ShelfClient shelf={[]} userId="" trendingBooks={trendingBooks || []} />

  const { data: shelf } = await supabase.from('shelves')
    .select('*, book:books(id,title,author,cover_url,genre,google_id)')
    .eq('user_id', user.id).order('updated_at', { ascending: false })

  return <ShelfClient shelf={shelf || []} userId={user.id} trendingBooks={trendingBooks || []} />
}
