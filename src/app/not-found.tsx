import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 64, fontWeight: 700, color: 'var(--b2)' }}>404</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--t1)' }}>Page not found</div>
      <Link href="/feed" className="btn-primary">Go to Feed</Link>
    </div>
  )
}
