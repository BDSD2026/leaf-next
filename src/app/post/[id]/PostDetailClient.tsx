'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageLayout from '@/components/PageLayout'
import Avatar from '@/components/Avatar'

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  insight:  { bg: 'var(--gr-t)', color: 'var(--gr)', label: 'Insight' },
  thought:  { bg: 'var(--bl-t)', color: 'var(--bl)', label: 'Thought' },
  question: { bg: 'var(--am-t)', color: 'var(--am)', label: 'Question' },
  review:   { bg: 'var(--ro-t)', color: 'var(--ro)', label: 'Review' },
}
const fmtNum = (n: number) => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n)
const ago = (ts: string) => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'now'; if (s < 3600) return Math.floor(s/60)+'m'
  if (s < 86400) return Math.floor(s/3600)+'h'; return Math.floor(s/86400)+'d'
}
export default function PostDetailClient({ post, comments: initComments, currentUserId, profile, trendingBooks = [] }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [votes, setVotes] = useState(Math.max(0, post.upvotes_count ?? 0))
  const [voted, setVoted] = useState(post.user_vote === 1)
  const [voteLoading, setVoteLoading] = useState(false)
  const [comments, setComments] = useState(initComments)
  const [txt, setTxt] = useState('')
  const [posting, setPosting] = useState(false)
  const type = TYPE_STYLES[post.type] || TYPE_STYLES.thought

  const handleVote = async () => {
    if (!currentUserId) { router.push('/auth/login'); return }
    if (voteLoading) return
    const wasVoted = voted
    const prevCount = votes
    setVoted(!wasVoted)
    setVotes(wasVoted ? Math.max(0, prevCount - 1) : prevCount + 1)
    setVoteLoading(true)
    try {
      if (!wasVoted) {
        const { error } = await supabase
          .from('votes')
          .insert({ user_id: currentUserId, post_id: post.id, value: 1 })
        if (error && error.code === '23505') {
          await supabase.from('votes').update({ value: 1 })
            .match({ user_id: currentUserId, post_id: post.id })
        }
      } else {
        await supabase.from('votes').delete()
          .match({ user_id: currentUserId, post_id: post.id })
      }
      const { data } = await supabase.from('posts').select('upvotes_count').eq('id', post.id).single()
      if (data != null) setVotes(Math.max(0, data.upvotes_count))
    } catch {
      setVoted(wasVoted)
      setVotes(prevCount)
    } finally {
      setVoteLoading(false)
    }
  }
  const handleComment = async () => {
    if (!currentUserId || !txt.trim()) { if (!currentUserId) router.push('/auth/login'); return }
    setPosting(true)
    const { data, error } = await supabase.from('comments').insert({ post_id: post.id, user_id: currentUserId, text: txt.trim() }).select('*, author:profiles!comments_user_id_fkey(id,username,name,color,avatar_url)').single()
    if (!error && data) { setComments((c: any[]) => [...c, data]); setTxt('') }
    setPosting(false)
  }
  return (
    <PageLayout trendingBooks={trendingBooks}>
      <div style={{ padding: '24px 20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--t3)', marginBottom: 20, padding: 0 }}>‹ Back</button>
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Link href={`/profile/${post.author_username}`}><Avatar name={post.author_name||'?'} color={post.author_color} avatarUrl={post.author_avatar} size={40} /></Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Link href={`/profile/${post.author_username}`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{post.author_name}</Link>
                <span className="badge" style={{ background: type.bg, color: type.color }}>{type.label}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>@{post.author_username} · {ago(post.created_at)}</div>
            </div>
          </div>
          {post.book_title && (
            <Link href={`/book/${post.book_id}`}>
              <div style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--s2)', borderRadius: 10, marginBottom: 16 }}>
                {post.book_cover && <Image src={post.book_cover} alt="" width={52} height={72} style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                <div>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>{post.book_title}</div>
                  <div style={{ fontSize: 13, color: 'var(--t2)' }}>by {post.book_author}</div>
                  {post.book_genre && <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 9px', background: 'var(--gr-t)', color: 'var(--gr)', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{post.book_genre}</span>}
                </div>
              </div>
            </Link>
          )}
          <div style={{ fontFamily: post.type==='insight'?'Georgia,serif':'inherit', fontSize: post.type==='insight'?18:16, fontStyle: post.type==='insight'?'italic':'normal', lineHeight: 1.7, color: 'var(--t1)', marginBottom: 16, ...(post.type==='insight'?{ paddingLeft:16, borderLeft:'2px solid var(--gr)' }:{}) }}>
            {post.type==='insight'?`\u201C${post.text}\u201D`:post.text}
          </div>
          {post.subtext && <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>{post.subtext}</div>}
          {post.tags?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>{post.tags.map((t:string) => <span key={t} className="tag">#{t}</span>)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
            <button onClick={handleVote} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: `1px solid ${voted?'var(--gr)':'var(--b1)'}`, background: voted?'var(--gr-t)':'transparent', cursor: 'pointer', fontSize: 13, color: voted?'var(--gr)':'var(--t2)', fontWeight: voted?700:400, transition: 'all 0.12s' }}>↑ {fmtNum(votes)}</button>
            <span style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--b1)', fontSize: 13, color: 'var(--t3)' }}>◎ {comments.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>Replies <span style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 400 }}>({comments.length})</span></div>
          {comments.length===0 && <div className="empty" style={{ padding: '24px 0' }}><div className="empty-icon">💬</div><div className="empty-text">No replies yet</div></div>}
          {comments.map((c:any, i:number) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: i<comments.length-1?'1px solid var(--b1)':'none' }}>
              <Avatar name={c.author?.name||'?'} color={c.author?.color} avatarUrl={c.author?.avatar_url} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{c.author?.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{ago(c.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{c.text}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--b1)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {profile && <Avatar name={profile.name} color={profile.color} avatarUrl={profile.avatar_url} size={28} />}
              <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder={currentUserId?'Add a reply…':'Sign in to reply…'} disabled={!currentUserId} maxLength={500} className="textarea" style={{ minHeight: 72, flex: 1 }} />
              <button onClick={handleComment} disabled={!txt.trim()||posting} className="btn-primary" style={{ flexShrink: 0, padding: '8px 16px' }}>{posting?'…':'Post'}</button>
            </div>
            {!currentUserId && <p style={{ marginTop: 8, fontSize: 12, color: 'var(--t3)' }}><Link href="/auth/login" style={{ color: 'var(--gr)' }}>Sign in</Link> to join the discussion</p>}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
