'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import LeafLogo from '@/components/LeafLogo'

export default function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null)
  const communityRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const joinRef = useRef<HTMLDivElement>(null)

  const scroll = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ background: '#0C0C0E', minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 48px', borderBottom: '1px solid #111113', position: 'sticky', top: 0, background: '#0C0C0E', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <LeafLogo size={24} />
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, color: '#F0EEE8', letterSpacing: '-.03em' }}>leaf</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={() => scroll(featuresRef)} style={{ background: 'none', border: 'none', fontSize: 13, color: '#8F8D8A', cursor: 'pointer', padding: '4px 0', borderBottom: '2px solid transparent' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color='#F0EEE8'; (e.target as HTMLElement).style.borderColor='#5CD4A4' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color='#8F8D8A'; (e.target as HTMLElement).style.borderColor='transparent' }}>
            Features
          </button>
          <button onClick={() => scroll(communityRef)} style={{ background: 'none', border: 'none', fontSize: 13, color: '#8F8D8A', cursor: 'pointer', padding: '4px 0', borderBottom: '2px solid transparent' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color='#F0EEE8'; (e.target as HTMLElement).style.borderColor='#5CD4A4' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color='#8F8D8A'; (e.target as HTMLElement).style.borderColor='transparent' }}>
            Community
          </button>
          <Link href="/feed" style={{ padding: '9px 22px', background: '#5CD4A4', color: '#0C0C0E', borderRadius: 22, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Enter app →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '88px 48px 72px', textAlign: 'center', borderBottom: '1px solid #111113' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 32, height: 1, background: '#5CD4A4' }} />
          <span style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5CD4A4', fontWeight: 700 }}>A reading community</span>
          <div style={{ width: 32, height: 1, background: '#5CD4A4' }} />
        </div>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 60, fontWeight: 700, color: '#F0EEE8', lineHeight: 1.05, letterSpacing: '-.04em', marginBottom: 0 }}>
          Books change minds.<br /><span style={{ color: '#252528' }}>Most apps</span> don't.
        </h1>
        <div style={{ width: 48, height: 3, background: '#5CD4A4', borderRadius: 2, margin: '26px auto' }} />
        <p style={{ maxWidth: 540, margin: '0 auto 16px', fontFamily: 'Georgia,serif', fontSize: 18, color: '#8F8D8A', lineHeight: 1.7, fontStyle: 'italic' }}>
          "All human wisdom is contained in these two words — wait and hope." The ideas in books deserve more than a star rating. They deserve a conversation.
        </p>
        <p style={{ maxWidth: 420, margin: '0 auto 44px', fontSize: 14, color: '#4E4D4C', lineHeight: 1.7 }}>
          leaf is where serious readers share what they actually learned — insights, questions, reviews, and half-formed thoughts.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/auth/signup" style={{ padding: '14px 34px', background: '#5CD4A4', color: '#0C0C0E', borderRadius: 28, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Start reading together →
          </Link>
          <button onClick={() => scroll(feedRef)} style={{ padding: '14px 28px', background: 'transparent', color: '#F0EEE8', borderRadius: 28, fontSize: 15, fontWeight: 500, border: '1px solid #222226', cursor: 'pointer' }}>
            Browse the feed
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#4E4D4C' }}>Free to join · No ads · Ideas first</div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #111113' }}>
        {[['2.4k','Active readers'],['18k','Book insights'],['6.2k','Books tracked'],['4.8','Avg book rating']].map(([n, l], i) => (
          <div key={l} style={{ flex: 1, padding: '22px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid #111113' : 'none' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: '#F0EEE8' }}>{n}</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4E4D4C', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* FEED PREVIEW */}
      <div ref={feedRef} style={{ padding: '56px 48px', borderBottom: '1px solid #111113' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5CD4A4' }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#8F8D8A' }}>From the feed</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#5CD4A4', background: 'rgba(92,212,164,.1)', padding: '2px 8px', borderRadius: 20, marginLeft: 'auto' }}>Live</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { av: 'MV', avc: '#7C6FCD', name: 'Margaux V.', handle: '@margaux.v · 2h', badge: 'Insight', bc: 'rgba(92,212,164,.12)', tc: '#5CD4A4', italic: true, text: '"You do not rise to the level of your goals. You fall to the level of your systems."', book: 'Atomic Habits', author: 'James Clear', up: 284, cm: 12 },
            { av: 'TR', avc: '#C17F59', name: 'Theo N.', handle: '@theo_reads · 5h', badge: 'Question', bc: 'rgba(240,160,80,.12)', tc: '#F0A050', italic: false, text: 'If habits define us more than goals, how do you intentionally design the person you want to become?', book: 'Atomic Habits', author: 'James Clear', up: 142, cm: 8 },
            { av: 'PS', avc: '#4A9E7A', name: 'Priya S.', handle: '@priya.thinks · 1d', badge: 'Review', bc: 'rgba(224,100,120,.12)', tc: '#E06478', italic: false, text: 'Sapiens breaks your brain in the best way. The cognitive revolution chapter alone is worth the price.', book: 'Sapiens', author: 'Yuval Noah Harari', up: 267, cm: 14 },
          ].map(p => (
            <div key={p.name} style={{ background: '#111113', border: '1px solid #1C1C1F', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: p.avc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{p.av}</div>
                <div><div style={{ fontSize: 11, fontWeight: 600, color: '#F0EEE8' }}>{p.name}</div><div style={{ fontSize: 10, color: '#4E4D4C' }}>{p.handle}</div></div>
              </div>
              <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, background: p.bc, color: p.tc }}>{p.badge}</span>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: '#F0EEE8', lineHeight: 1.65, marginBottom: 10, fontStyle: p.italic ? 'italic' : 'normal' }}>{p.text}</div>
              <div style={{ fontSize: 11, color: '#4E4D4C', paddingTop: 10, borderTop: '1px solid #131315' }}>from <strong style={{ color: '#8F8D8A', fontWeight: 500 }}>{p.book}</strong> — {p.author}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 10, color: '#4E4D4C' }}>↑ {p.up}</span>
                <span style={{ fontSize: 10, color: '#4E4D4C' }}>◎ {p.cm}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div ref={featuresRef} style={{ borderBottom: '1px solid #111113' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 48px 28px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5CD4A4' }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#8F8D8A' }}>Features</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#111113' }}>
          {[
            { n: '01', title: 'Four ways to post', body: 'Insights, thoughts, questions, reviews — each post type has its own format. No one-size-fits-all text boxes.', tag: 'Insight · Thought · Question · Review', tc: '#5CD4A4', tbc: 'rgba(92,212,164,.1)' },
            { n: '02', title: 'Your shelf, your pace', body: 'Track reading, want-to-read, and finished books. Rate as you go. See what people you follow are reading.', tag: 'Reading · Finished · Want to read', tc: '#5B9CF6', tbc: 'rgba(91,156,246,.1)' },
            { n: '03', title: 'Ideas over algorithms', body: 'The feed ranks by quality of insight, not engagement bait. Best ideas surface regardless of follower count.', tag: 'Hot · New · Top', tc: '#F0A050', tbc: 'rgba(240,160,80,.1)' },
          ].map((f, i) => (
            <div key={f.n} style={{ background: '#0C0C0E', padding: '36px 32px', borderLeft: i > 0 ? '1px solid #111113' : 'none' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 36, fontWeight: 700, color: '#131315', marginBottom: 12 }}>{f.n}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: '#F0EEE8', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#8F8D8A', lineHeight: 1.65, marginBottom: 14 }}>{f.body}</div>
              <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '3px 9px', borderRadius: 20, background: f.tbc, color: f.tc }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* COMMUNITY / MANIFESTO */}
      <div ref={communityRef} style={{ padding: '72px 48px', borderBottom: '1px solid #111113', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.14em', color: '#4E4D4C', marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#4E4D4C' }} /> Why leaf exists
          </div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 34, fontWeight: 700, color: '#F0EEE8', lineHeight: 1.2, marginBottom: 16 }}>
            Reading is thinking.<br />leaf is where<br /><em style={{ color: '#5CD4A4' }}>thinkers read together.</em>
          </h2>
          <p style={{ fontSize: 14, color: '#8F8D8A', lineHeight: 1.75, marginBottom: 28 }}>
            Post what a book made you think. Ask what you couldn't figure out. Find people who read the same page and saw something completely different.
          </p>
          <Link href="/auth/signup" style={{ display: 'inline-block', padding: '12px 28px', background: 'transparent', border: '1px solid #5CD4A4', color: '#5CD4A4', borderRadius: 24, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Join the community →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { text: '"The gap between stimulus and response — that is where character lives."', attr: 'Kai A.', book: "Man's Search for Meaning" },
            { text: '"Our models are dangerously overconfident. The map is not the territory — and the territory is wilder than any map."', attr: 'Priya S.', book: 'The Black Swan' },
            { text: '"Agency starts with awareness. Most people run on inherited scripts."', attr: 'Margaux V.', book: 'Atomic Habits' },
          ].map(q => (
            <div key={q.attr} style={{ background: '#111113', border: '1px solid #1C1C1F', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: '#F0EEE8', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 8 }}>{q.text}</div>
              <div style={{ fontSize: 11, color: '#4E4D4C' }}><span style={{ color: '#8F8D8A' }}>{q.attr}</span> on {q.book}</div>
            </div>
          ))}
        </div>
      </div>

      {/* JOIN STRIP */}
      <div ref={joinRef} style={{ background: '#111113', borderTop: '1px solid #131315', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 24, color: '#F0EEE8', marginBottom: 6 }}>Ready to read differently?</h3>
          <p style={{ fontSize: 14, color: '#8F8D8A' }}>Join thousands of readers sharing what they learn from books.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link href="/auth/login" style={{ padding: '12px 24px', background: 'transparent', color: '#8F8D8A', border: '1px solid #222226', borderRadius: 24, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ padding: '12px 28px', background: '#5CD4A4', color: '#0C0C0E', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Create free account →</Link>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderTop: '1px solid #0F0F11' }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 15, color: '#4E4D4C' }}>leaf</span>
        <span style={{ fontSize: 11, color: '#252528' }}>A place to discuss what people learned from books.</span>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'none', border: 'none', fontSize: 11, color: '#4E4D4C', cursor: 'pointer' }}>Back to top ↑</button>
      </div>

    </div>
  )
}
