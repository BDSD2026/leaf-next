'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Avatar from './Avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  insight:  { bg: 'var(--gr-t)', color: 'var(--gr)', label: 'Insight' },
  thought:  { bg: 'var(--bl-t)', color: 'var(--bl)', label: 'Thought' },
  question: { bg: 'var(--am-t)', color: 'var(--am)', label: 'Question' },
  review:   { bg: 'var(--ro-t)', color: 'var(--ro)', label: 'Review' },
}

const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
const ago = (ts: string) => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return Math.floor(s / 60) + 'm'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  if (s < 604800) return Math.floor(s / 86400) + 'd'
  return Math.floor(s / 604800) + 'w'
}

export default function PostCard({ post, currentUserId }: { post: any; currentUserId?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [voted, setVoted] = useState(post.user_vote === 1)
  const [voteCount, setVoteCount] = useState(Math.max(0, post.upvotes_count ?? 0))
  const [voteLoading, setVoteLoading] = useState(false)
  const type = TYPE_STYLES[post.type] || TYPE_STYLES.thought

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUserId) { router.push('/auth/login'); return }
    if (voteLoading) return

    const wasVoted = voted
    const prevCount = voteCount

    // Optimistic update immediately
    setVoted(!wasVoted)
    setVoteCount(wasVoted ? Math.max(0, prevCount - 1) : prevCount + 1)
    setVoteLoading(true)

    try {
      if (!wasVoted) {
        // Insert vote — primary key is (user_id, post_id)
        const { error } = await supabase
          .from('votes')
          .insert({ user_id: currentUserId, post_id: post.id, value: 1 })
        if (error && error.code === '23505') {
          // Already voted (duplicate key) — update instead
          await supabase
            .from('votes')
            .update({ value: 1 })
            .match({ user_id: currentUserId, post_id: post.id })
        }
      } else {
        await supabase
          .from('votes')
          .delete()
          .match({ user_id: currentUserId, post_id: post.id })
      }
      // Read back the true count from DB after trigger fires
      const { data } = await supabase
        .from('posts')
        .select('upvotes_count')
        .eq('id', post.id)
        .single()
      if (data != null) setVoteCount(Math.max(0, data.upvotes_count))
    } catch {
      // Rollback on any error
      setVoted(wasVoted)
      setVoteCount(prevCount)
    } finally {
      setVoteLoading(false)
    }
  }

  return (
    <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card" style={{ marginBottom: 8, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Link href={`/profile/${post.author_username}`} onClick={e => e.stopPropagation()}>
            <Avatar name={post.author_name || '?'} color={post.author_color} avatarUrl={post.author_avatar} size={28} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{post.author_name}</span>
              <span className="badge" style={{ background: type.bg, color: type.color }}>{type.label}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>@{post.author_username} · {ago(post.created_at)}</div>
          </div>
        </div>

        {post.book_title && (
          <Link href={`/book/${post.book_id}`} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--s3)', borderRadius: 8, marginBottom: 10 }}>
              {post.book_cover && (
                <Image src={post.book_cover} alt="" width={22} height={32} style={{ borderRadius: 3, objectFit: 'cover' }} onError={() => {}} />
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3 }}>{post.book_title}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{post.book_author}</div>
              </div>
            </div>
          </Link>
        )}

        <div style={{ fontFamily: post.type === 'insight' ? 'Georgia,serif' : 'inherit', fontSize: post.type === 'insight' ? 15 : 14, fontStyle: post.type === 'insight' ? 'italic' : 'normal', lineHeight: 1.65, color: 'var(--t1)', marginBottom: post.subtext ? 8 : 10 }}>
          {post.type === 'insight' ? `\u201C${post.text}\u201D` : post.text}
        </div>

        {post.subtext && (
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10, paddingTop: 8, borderTop: '1px solid var(--b1)' }}>
            {post.subtext}
          </div>
        )}

        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {post.tags.map((t: string) => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: '1px solid var(--b1)' }}>
          <button onClick={handleVote} disabled={voteLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: `1px solid ${voted ? 'var(--gr)' : 'var(--b1)'}`, background: voted ? 'var(--gr-t)' : 'transparent', fontSize: 11, color: voted ? 'var(--gr)' : 'var(--t3)', fontWeight: voted ? 600 : 400, transition: 'all 0.12s', cursor: voteLoading ? 'wait' : 'pointer', opacity: voteLoading ? 0.7 : 1 }}>
            ↑ {fmtNum(voteCount)}
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1px solid var(--b1)', fontSize: 11, color: 'var(--t3)' }}>
            ◎ {fmtNum(post.comments_count ?? 0)}
          </span>
        </div>
      </div>
    </Link>
  )
}
