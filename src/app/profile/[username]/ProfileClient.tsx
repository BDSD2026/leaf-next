'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import Avatar from '@/components/Avatar'

const SHELF_LABELS: Record<string,string> = { want_to_read:'Want to Read', reading:'Reading', read:'Read' }
const SHELF_COLORS: Record<string,string> = { want_to_read:'var(--am)', reading:'var(--gr)', read:'var(--bl)' }
const fmtNum = (n: number) => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n)

export default function ProfileClient({ profile, posts, shelf, isFollowing: initFollowing, currentUserId, myProfile, isMe }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [following, setFollowing] = useState(initFollowing)
  const [followerCount, setFollowerCount] = useState(profile.followers_count || 0)
  const [tab, setTab] = useState('posts')

  const toggleFollow = async () => {
    if (!currentUserId) { router.push('/auth/login'); return }
    if (following) {
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: profile.id })
      setFollowing(false); setFollowerCount((c: number) => c - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id })
      setFollowing(true); setFollowerCount((c: number) => c + 1)
    }
  }

  const byStatus = (status: string) => shelf.filter((e: any) => e.status === status)

  return (
    <div className="container">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
        {/* Hero card */}
        <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: 52, background: profile.color + '22', margin: '-16px -18px 0', borderRadius: '14px 14px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -28, marginBottom: 14 }}>
            <Avatar name={profile.name} color={profile.color} avatarUrl={profile.avatar_url} size={64} />
            <div style={{ flex: 1, paddingBottom: 4 }}>
              {isMe ? (
                <Link href="/profile/edit" className="btn-ghost" style={{ float: 'right', fontSize: 12, padding: '6px 14px', borderRadius: 20, textDecoration: 'none' }}>Edit Profile</Link>
              ) : (
                <button onClick={toggleFollow} style={{ float: 'right', padding: '6px 14px', borderRadius: 20, border: `1px solid ${following ? 'var(--b2)' : 'var(--gr)'}`, background: following ? 'transparent' : 'var(--gr-t)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: following ? 'var(--t2)' : 'var(--gr)' }}>
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: profile.bio ? 8 : 14 }}>@{profile.username}</div>
          {profile.bio && <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 14 }}>{profile.bio}</div>}
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Posts', posts.length], ['Followers', followerCount], ['Following', profile.following_count || 0]].map(([l, n]) => (
              <div key={l as string}>
                <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gr)' }}>{fmtNum(n as number)}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {[['posts','Posts'],['shelf','Shelf'],['about','About']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`tab ${tab === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>

        {tab === 'posts' && (
          posts.length === 0
            ? <div className="empty"><div className="empty-icon">✍️</div><div className="empty-text">No posts yet</div></div>
            : posts.map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)
        )}

        {tab === 'shelf' && (
          <div>
            {['reading','read','want_to_read'].map(status => {
              const entries = byStatus(status)
              if (!entries.length) return null
              return (
                <div key={status} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{SHELF_LABELS[status]}</div>
                  {entries.map((e: any) => (
                    <Link key={e.book?.id} href={`/book/${e.book?.id}`} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--b1)', textDecoration: 'none' }}>
                      {e.book?.cover_url && <Image src={e.book.cover_url} alt="" width={36} height={50} style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{e.book?.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{e.book?.author}</div>
                        {e.rating && <span>{'★'.repeat(e.rating)}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )
            })}
            {shelf.length === 0 && <div className="empty"><div className="empty-icon">📚</div><div className="empty-text">No books on shelf yet</div></div>}
          </div>
        )}

        {tab === 'about' && (
          <div className="card">
            {[['Bio', profile.bio || '—'], ['Username', '@' + profile.username], ['Followers', fmtNum(followerCount)], ['Following', fmtNum(profile.following_count || 0)]].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--b1)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', width: 90, flexShrink: 0 }}>{l}</div>
                <div style={{ fontSize: 13, color: 'var(--t1)' }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
