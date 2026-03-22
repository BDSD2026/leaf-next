import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/feed`, { status: 302 })
}

// Support GET too for direct navigation
export async function GET(request: NextRequest) {
  return POST(request)
}
