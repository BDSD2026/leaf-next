import PageLayout from '@/components/PageLayout'
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'

const ago = (ts: string) => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'now'; if (s < 3600) return Math.floor(s/60)+'m'
  if (s < 86400) return Math.floor(s/3600)+'h'; return Math.floor(s/86400)+'d'
}

const ICON_MAP: Record<string,string> = { vote:'↑', comment:'◎', follow:'+', mention:'@' }
const COLOR_MAP: Record<string,string> = { vote:'var(--gr)', comment:'var(--bl)', follow:'#7C6FCD', mention:'var(--am)' }

const label = (n: any) => {
  const name = n.actor?.name || 'Someone'
  if (n.type === 'vote') return `${name} upvoted your post`
  if (n.type === 'comment') return `${name} replied to your post`
  if (n.type === 'follow') return `${name} started following you`
  if (n.type === 'mention') return `${name} mentioned you`
  return `${name} interacted with you`
}

export default function NotificationsClient({ notifs, userId, trendingBooks = [] }: { notifs: any[], userId: string, trendingBooks?: any[] }) {
  const router = useRouter()
  return (
    <PageLayout trendingBooks={trendingBooks}>
    <div style={{ padding: '24px 20px' }}>
      <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', marginBottom: 20 }}>Notifications</h1>

      {notifs.length === 0 ? (
        <div className="empty"><div className="empty-icon">🔔</div><div className="empty-text">No notifications yet</div></div>
      ) : notifs.map(n => (
        <div key={n.id}
          onClick={() => n.post_id ? router.push(`/post/${n.post_id}`) : router.push(`/profile/${n.actor?.username}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--b1)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(92,212,164,0.03)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={n.actor?.name || '?'} color={n.actor?.color} avatarUrl={n.actor?.avatar_url} size={38} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 17, height: 17, borderRadius: '50%', background: COLOR_MAP[n.type] || 'var(--s3)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
              {ICON_MAP[n.type] || '•'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.5 }}>{label(n)}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{ago(n.created_at)}</div>
          </div>
          {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gr)', flexShrink: 0 }} />}
        </div>
      ))}
    </div>
      </PageLayout>
  )
}
