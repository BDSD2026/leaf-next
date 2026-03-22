'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import PageLayout from '@/components/PageLayout'
import Avatar from '@/components/Avatar'

const SHELF_META: Record<string, { label: string; color: string }> = {
  reading:      { label: 'Currently Reading', color: '#5CD4A4' },
  read:         { label: 'Read',               color: '#5B9CF6' },
  want_to_read: { label: 'Want to Read',       color: '#F0A050' },
}
const fmtNum = (n: number) => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n)

function MiniBook({ entry }: { entry: any }) {
  const b = entry.book
  if (!b) return null
  return (
    <Link href={`/book/${b.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: 52 }}>
      <div style={{ width: 52, height: 72, borderRadius: 6, overflow: 'hidden', marginBottom: 5, border: '1px solid var(--b1)' }}>
        {b.cover_url
          ? <Image src={b.cover_url} alt="" width={52} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
        }
      </div>
      <div style={{ fontSize: 9, color: 'var(--t3)', lineHeight: 1.3, textAlign: 'center', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{b.title}</div>
    </Link>
  )
}

export default function ProfileClient({ profile, posts, shelf, isFollowing: initFollowing, currentUserId, myProfile, isMe, trendingBooks = [] }: any) {
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

  const reading  = shelf.filter((e: any) => e.status === 'reading')
  const read     = shelf.filter((e: any) => e.status === 'read')
  const wantRead = shelf.filter((e: any) => e.status === 'want_to_read')
  const booksRead = read.length

  return (
    <PageLayout trendingBooks={trendingBooks}>
      <div style={{ padding: '0 20px 32px' }}>

        {/* Hero banner */}
        <div style={{ height: 80, background: `linear-gradient(135deg, ${profile.color}33 0%, ${profile.color}11 100%)`, margin: '0 -20px', marginBottom: 0 }} />

        {/* Profile card */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20, marginBottom: 12, marginTop: -32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <Avatar name={profile.name} color={profile.color} avatarUrl={profile.avatar_url} size={64} />
            {isMe ? (
              <Link href="/profile/edit" style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid var(--b2)', background: 'transparent', fontSize: 12, fontWeight: 600, color: 'var(--t2)', textDecoration: 'none' }}>Edit Profile</Link>
            ) : (
              <button onClick={toggleFollow} style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${following ? 'var(--b2)' : 'var(--gr)'}`, background: following ? 'transparent' : 'rgba(92,212,164,0.1)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: following ? 'var(--t2)' : '#5CD4A4' }}>
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: profile.bio ? 10 : 16 }}>@{profile.username}</div>
          {profile.bio && <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 16 }}>{profile.bio}</div>}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
            {[
              ['Posts', posts.length, 'var(--gr)'],
              ['Books read', booksRead, '#5B9CF6'],
              ['Followers', followerCount, 'var(--gr)'],
              ['Following', profile.following_count || 0, 'var(--gr)'],
            ].map(([l, n, c]) => (
              <div key={l as string}>
                <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{fmtNum(n as number)}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Books at a glance — always visible */}
        {shelf.length > 0 && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            {reading.length > 0 && (
              <div style={{ marginBottom: read.length > 0 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5CD4A4' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Currently reading</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {reading.slice(0, 6).map((e: any) => <MiniBook key={e.book?.id} entry={e} />)}
                </div>
              </div>
            )}

            {read.length > 0 && (
              <div style={{ paddingTop: reading.length > 0 ? 14 : 0, borderTop: reading.length > 0 ? '1px solid var(--b1)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B9CF6' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Recently read</span>
                  </div>
                  {read.length > 6 && (
                    <button onClick={() => setTab('shelf')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#5B9CF6', padding: 0 }}>
                      +{read.length - 6} more →
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {read.slice(0, 6).map((e: any) => <MiniBook key={e.book?.id} entry={e} />)}
                  {read.length > 6 && (
                    <button onClick={() => setTab('shelf')} style={{ width: 52, height: 72, borderRadius: 6, background: 'var(--s2)', border: '1px dashed var(--b2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--t3)', flexShrink: 0, fontWeight: 600 }}>
                      +{read.length - 6}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {[['posts','Posts'],['shelf','Shelf'],['about','About']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`tab ${tab === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>

        {/* Posts tab */}
        {tab === 'posts' && (
          posts.length === 0
            ? <div className="empty"><div className="empty-icon">✍️</div><div className="empty-text">No posts yet</div></div>
            : posts.map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)
        )}

        {/* Shelf tab — all statuses visible */}
        {tab === 'shelf' && (
          <div>
            {shelf.length === 0 && (
              <div className="empty"><div className="empty-icon">📚</div><div className="empty-text">No books on shelf yet</div></div>
            )}
            {[
              { status: 'reading', entries: reading },
              { status: 'read', entries: read },
              { status: 'want_to_read', entries: wantRead },
            ].filter(s => s.entries.length > 0).map(({ status, entries }) => (
              <div key={status} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: SHELF_META[status].color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)' }}>{SHELF_META[status].label}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)', opacity: 0.6 }}>{entries.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                  {entries.map((e: any) => (
                    <Link key={e.book?.id} href={`/book/${e.book?.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden', opacity: status === 'want_to_read' ? 0.8 : 1 }}>
                        {e.book?.cover_url
                          ? <Image src={e.book.cover_url} alt="" width={200} height={280} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📖</div>
                        }
                        <div style={{ padding: '7px 8px 9px' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{e.book?.title}</div>
                          {e.rating && (
                            <div style={{ fontSize: 11, color: '#F0A050', marginTop: 4 }}>{'★'.repeat(e.rating)}</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* About tab */}
        {tab === 'about' && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20 }}>
            {[['Bio', profile.bio || '—'], ['Username', '@' + profile.username], ['Followers', fmtNum(followerCount)], ['Following', fmtNum(profile.following_count || 0)], ['Books read', String(booksRead)]].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--b1)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', width: 100, flexShrink: 0 }}>{l}</div>
                <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
