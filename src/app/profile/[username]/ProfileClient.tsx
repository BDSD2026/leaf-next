'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import PageLayout from '@/components/PageLayout'
import Avatar from '@/components/Avatar'

const fmtNum = (n: number) => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n)

// ── Shelf rail components (matches ShelfClient design) ──────────────────────

function Stars({ rating }: { rating?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1, marginTop: 4, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: 10, color: (rating || 0) >= s ? 'var(--am)' : 'var(--s3)', lineHeight: 1 }}>★</span>
      ))}
    </div>
  )
}

function ShelfBookCover({ book, width, height }: { book: any; width: number; height: number }) {
  if (book?.cover_url) {
    return <Image src={book.cover_url} alt="" width={width} height={height}
      style={{ width, height, objectFit: 'cover', borderRadius: 5, display: 'block', border: '1px solid var(--b1)', flexShrink: 0 }} />
  }
  return (
    <div style={{ width, height, borderRadius: 5, background: 'var(--s2)', border: '1px solid var(--b1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.floor(height / 3) }}>📖</div>
  )
}

function ShelfRail({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ background: 'var(--s2)', borderRadius: '8px 8px 0 0', borderBottom: '3px solid var(--b2)', padding: '16px 14px 10px', display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {children}
      </div>
      <div style={{ height: 5, background: 'var(--bg)', borderRadius: '0 0 8px 8px', marginBottom: 2 }} />
    </>
  )
}

function ShelfSection({ color, label, count, children }: { color: string; label: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--t3)' }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--t3)', opacity: 0.6 }}>{count}</span>
      </div>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

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
              <button onClick={toggleFollow} style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${following ? 'var(--b2)' : 'var(--gr)'}`, background: following ? 'transparent' : 'var(--gr-t)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: following ? 'var(--t2)' : 'var(--gr)' }}>
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: profile.bio ? 10 : 16 }}>@{profile.username}</div>
          {profile.bio && <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 16 }}>{profile.bio}</div>}

          <div style={{ display: 'flex', gap: 20, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
            {[
              ['Posts', posts.length, 'var(--gr)'],
              ['Books read', booksRead, 'var(--bl)'],
              ['Followers', followerCount, 'var(--gr)'],
              ['Following', profile.following_count || 0, 'var(--gr)'],
            ].map(([l, n, c]) => (
              <div key={l as string} style={{ cursor: l === 'Books read' ? 'pointer' : 'default' }}
                onClick={l === 'Books read' ? () => setTab('shelf') : undefined}>
                <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{fmtNum(n as number)}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {[['posts','Posts'],['shelf','Shelf'],['about','About']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`tab ${tab === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>

        {/* ── POSTS TAB ── */}
        {tab === 'posts' && (
          posts.length === 0
            ? <div className="empty"><div className="empty-icon">✍️</div><div className="empty-text">No posts yet</div></div>
            : posts.map((p: any) => <PostCard key={p.id} post={p} currentUserId={currentUserId} />)
        )}

        {/* ── SHELF TAB — physical rail design ── */}
        {tab === 'shelf' && (
          <div>
            {shelf.length === 0 && (
              <div className="empty"><div className="empty-icon">📚</div><div className="empty-text">No books on shelf yet</div></div>
            )}

            {/* Currently Reading — large books on rail */}
            {reading.length > 0 && (
              <ShelfSection color="var(--gr)" label="Currently Reading" count={reading.length}>
                <ShelfRail>
                  {reading.map((e: any) => (
                    <div key={e.book?.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 60 }}>
                      <div style={{ transition: 'transform .18s' }}
                        onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.transform = 'translateY(-7px)'}
                        onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.transform = ''}>
                        <Link href={`/book/${e.book?.id}`}><ShelfBookCover book={e.book} width={60} height={85} /></Link>
                      </div>
                      <div style={{ marginTop: 7, width: 60, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                        <div style={{ fontSize: 8, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.author?.split(' ').pop()}</div>
                        <div style={{ height: 3, background: 'var(--b2)', borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: 3, background: 'var(--gr)', borderRadius: 2, width: '40%' }} />
                        </div>
                        <div style={{ fontSize: 8, color: 'var(--gr)', marginTop: 2 }}>In progress</div>
                      </div>
                    </div>
                  ))}
                </ShelfRail>
              </ShelfSection>
            )}

            {/* Read — medium books on rail with stars */}
            {read.length > 0 && (
              <ShelfSection color="var(--bl)" label="Read" count={read.length}>
                <ShelfRail>
                  {read.map((e: any) => (
                    <div key={e.book?.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 50 }}>
                      <div style={{ transition: 'transform .18s' }}
                        onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'}
                        onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.transform = ''}>
                        <Link href={`/book/${e.book?.id}`}><ShelfBookCover book={e.book} width={50} height={70} /></Link>
                      </div>
                      <div style={{ marginTop: 7, width: 50, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                        <Stars rating={e.rating} />
                      </div>
                    </div>
                  ))}
                </ShelfRail>
              </ShelfSection>
            )}

            {/* Want to Read — compact list */}
            {wantRead.length > 0 && (
              <ShelfSection color="var(--am)" label="Want to Read" count={wantRead.length}>
                <div style={{ background: 'var(--s1)', borderRadius: 10, border: '1px solid var(--b1)', overflow: 'hidden' }}>
                  {wantRead.map((e: any, i: number) => (
                    <Link key={e.book?.id} href={`/book/${e.book?.id}`} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: i < wantRead.length - 1 ? '1px solid var(--b1)' : 'none', textDecoration: 'none', alignItems: 'center' }}>
                      <ShelfBookCover book={e.book} width={34} height={48} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.book?.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>{e.book?.author}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--am)', background: 'var(--am-t)', padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>On list</span>
                    </Link>
                  ))}
                </div>
              </ShelfSection>
            )}
          </div>
        )}

        {/* ── ABOUT TAB ── */}
        {tab === 'about' && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20 }}>
            {[
              ['Bio', profile.bio || '—'],
              ['Username', '@' + profile.username],
              ['Followers', fmtNum(followerCount)],
              ['Following', fmtNum(profile.following_count || 0)],
              ['Books read', String(booksRead)],
            ].map(([l, v]) => (
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
