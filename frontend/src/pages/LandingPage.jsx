import React from 'react'
import { useNavigate } from 'react-router-dom'

const G = '#00A651'
const NAVY = '#1A1A2E'
const LIGHT = '#F7F8FA'

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const nav = useNavigate()
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, background: G, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 18,
        }}>P</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: NAVY }}>Pochi</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => nav('/login')} style={{
          background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '7px 16px', fontSize: 13, fontWeight: 500, color: NAVY,
          cursor: 'pointer',
        }}>Sign in</button>
        <button onClick={() => nav('/signup')} style={{
          background: G, border: 'none', borderRadius: 8,
          padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#fff',
          cursor: 'pointer',
        }}>Start free</button>
      </div>
    </nav>
  )
}

// ─── WhatsApp chat mockup ─────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#fff', borderRadius: 32,
      border: '6px solid #1A1A2E',
      boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{ background: '#075E54', padding: '8px 14px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: '#128C7E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700 }}>P</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>December Harambee 🎄</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>12 participants</div>
        </div>
      </div>
      {/* Chat background */}
      <div style={{ background: '#ECE5DD', padding: '10px 8px', minHeight: 320 }}>

        {/* User pledge message */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <div style={{ background: '#DCF8C6', borderRadius: '10px 10px 2px 10px', padding: '6px 10px', maxWidth: '75%', fontSize: 12, color: '#111' }}>
            pledge 2000
            <div style={{ fontSize: 9, color: '#666', textAlign: 'right', marginTop: 2 }}>10:32 ✓✓</div>
          </div>
        </div>

        {/* Bot leaderboard */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
          <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '8px 10px', maxWidth: '85%', fontSize: 11, color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>🏆 Harambee Update</div>
            <div style={{ color: '#075E54', fontWeight: 600, marginBottom: 6, fontSize: 11 }}>Brian pledged KES 2,000! 🎉</div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: 6, lineHeight: 1.8, fontFamily: 'monospace', fontSize: 10 }}>
              <div>1. Brian M.&nbsp;&nbsp;&nbsp;✅ 2,000</div>
              <div>2. Jane W.&nbsp;&nbsp;&nbsp;&nbsp;✅ 1,500</div>
              <div>3. Peter K.&nbsp;&nbsp;&nbsp;⏳ pledged</div>
              <div>4. Mary N.&nbsp;&nbsp;&nbsp;&nbsp;⏳ pledged</div>
            </div>
            <div style={{ borderTop: '1px solid #eee', marginTop: 6, paddingTop: 4, fontSize: 10 }}>
              <span style={{ color: G, fontWeight: 700 }}>KES 3,500</span> of KES 10,000 raised
            </div>
            <div style={{ fontSize: 9, color: '#666', textAlign: 'right', marginTop: 4 }}>10:32 ✓✓</div>
          </div>
        </div>

        {/* Payment confirmation */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '6px 10px', maxWidth: '85%', fontSize: 11, color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            ✅ <b>Brian</b> — KES 2,000 received via M-Pesa. Payment matched automatically.
            <div style={{ fontSize: 9, color: '#666', textAlign: 'right', marginTop: 2 }}>10:33 ✓✓</div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const nav = useNavigate()
  return (
    <section style={{ background: '#fff', padding: '64px 24px 72px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ flex: 1, minWidth: 280, maxWidth: 520 }}>
          <div style={{
            display: 'inline-block', background: '#E8F8EF', color: G,
            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
            marginBottom: 20, border: '1px solid rgba(0,166,81,0.2)',
          }}>Built for Kenya 🇰🇪</div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: NAVY, margin: '0 0 20px', lineHeight: 1.15 }}>
            Stop guessing<br />
            <span style={{ color: G }}>who paid.</span><br />
            Pochi knows.
          </h1>

          <p style={{ fontSize: 16, color: '#4B5563', lineHeight: 1.7, margin: '0 0 32px' }}>
            Add Pochi to your WhatsApp group. Every M-Pesa payment gets matched to a contributor and posted automatically. No spreadsheets. No guesswork. No missed payments.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => nav('/signup')} style={{
              background: G, color: '#fff', border: 'none', borderRadius: 10,
              padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,166,81,0.35)',
            }}>Start free — no card needed</button>
            <button onClick={() => nav('/login')} style={{
              background: '#fff', color: NAVY, border: '1.5px solid #E5E7EB', borderRadius: 10,
              padding: '14px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>Sign in</button>
          </div>

          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 14 }}>
            Free for 1 fundraiser · No credit card · Works with any Paybill or Till
          </p>
        </div>

        <PhoneMockup />
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────
function Problem() {
  const pains = [
    {
      emoji: '😩',
      title: '"B.K KAMAU paid — but who is that?"',
      body: 'M-Pesa names rarely match WhatsApp names. You spend hours playing detective after every collection.',
    },
    {
      emoji: '📊',
      title: 'The spreadsheet that never ends',
      body: 'Copy-paste from M-Pesa messages to Excel. Update totals. Share screenshots. Repeat. There has to be a better way.',
    },
    {
      emoji: '😤',
      title: '"I sent it!" "We have no record."',
      body: 'Payment disputes ruin group morale. Without an automatic record, someone always feels shortchanged.',
    },
  ]
  return (
    <section style={{ background: LIGHT, padding: '72px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
            Sound familiar?
          </h2>
          <p style={{ fontSize: 15, color: '#4B5563', maxWidth: 480, margin: '0 auto' }}>
            Every Kenyan organiser running a harambee, chama drive, or school levy knows this pain.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {pains.map((p, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '28px 24px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{p.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{p.title}</div>
              <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Create your fundraiser',
      body: 'Add your fundraiser details and your Paybill or Till number. Takes 2 minutes.',
      detail: 'Your money setup stays exactly the same — contributors still pay to your own Paybill or Till.',
    },
    {
      n: '2',
      title: 'Add Pochi to your group',
      body: 'Connect your WhatsApp group to Pochi from the dashboard.',
      detail: 'Pochi joins as a bot. Contributors can pledge, check their balance, and get reminders — all from WhatsApp.',
    },
    {
      n: '3',
      title: 'Watch it run itself',
      body: 'Every M-Pesa payment is matched to a contributor automatically.',
      detail: 'Pochi posts a live leaderboard to your group after every payment. Your dashboard updates in real time.',
    },
  ]
  return (
    <section style={{ background: '#fff', padding: '72px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
            Up and running in 5 minutes
          </h2>
          <p style={{ fontSize: 15, color: '#4B5563' }}>
            Three steps. No technical knowledge required.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 40 }}>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: G, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 20,
                }}>{s.n}</div>
                {i < steps.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 40, background: '#E5E7EB', margin: '8px 0' }} />
                )}
              </div>
              <div style={{ paddingTop: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 15, color: '#111', marginBottom: 6, fontWeight: 500 }}>{s.body}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Trust banner ─────────────────────────────────────────────────────────────
function TrustBanner() {
  return (
    <section style={{ background: G, padding: '52px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🛡️</div>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, color: '#fff', margin: '0 0 14px', lineHeight: 1.3 }}>
          Money never touches Pochi.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
          Every shilling goes directly to <strong>your own Paybill or Till</strong>. Pochi only listens to transactions and does the bookkeeping. Your M-Pesa setup stays unchanged. You keep full control.
        </p>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: '⚡', title: 'Automatic M-Pesa matching', body: 'Phone numbers bridge M-Pesa and WhatsApp identities. Pochi matches every payment the moment it arrives — even when names don\'t match.' },
    { icon: '📣', title: 'Live WhatsApp leaderboard', body: 'After every payment, Pochi posts an updated leaderboard to your group. Contributors stay motivated. You stay hands-free.' },
    { icon: '📊', title: 'Real-time dashboard', body: 'See every pledge, every payment, and every unmatched transaction from your dashboard. Export to PDF or Excel anytime.' },
    { icon: '💬', title: 'Contributors stay in WhatsApp', body: 'Contributors pledge, register, check their balance, and get reminders — all without leaving WhatsApp. Zero friction for them.' },
    { icon: '🔔', title: 'Automatic payment reminders', body: 'Pochi sends gentle reminders to contributors who pledged but haven\'t paid yet. You don\'t have to chase anyone.' },
    { icon: '🏦', title: 'Works with any Paybill or Till', body: 'Equity, KCB, Co-op, your own business Paybill — Pochi connects to whatever you already have.' },
  ]
  return (
    <section style={{ background: LIGHT, padding: '72px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
            Everything you need. Nothing you don't.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '24px',
              border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      quote: 'We used to spend the whole Sunday afternoon matching M-Pesa messages to names in a notebook. Now Pochi does it before the service ends. It has saved us hours every week.',
      name: 'Grace W.',
      role: 'Church treasurer · Nairobi',
      initial: 'G',
      color: '#7C3AED',
    },
    {
      quote: 'Our chama has 24 members and monthly contributions were a nightmare to track. Someone always disputed the records. Since Pochi, every payment is logged automatically and nobody argues anymore.',
      name: 'James O.',
      role: 'Chama chairman · Mombasa',
      initial: 'J',
      color: '#0369A1',
    },
    {
      quote: 'I ran the school levy for 180 families. Pochi matched every M-Pesa payment and posted updates to our parents WhatsApp group automatically. Parents loved seeing the leaderboard.',
      name: 'Sarah K.',
      role: 'Parents committee · Kisumu',
      initial: 'S',
      color: '#B45309',
    },
  ]
  return (
    <section style={{ background: '#fff', padding: '72px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
            Organizers across Kenya trust Pochi
          </h2>
          <p style={{ fontSize: 15, color: '#4B5563' }}>
            From church collections to chama drives to school levies.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{
              background: LIGHT, borderRadius: 16, padding: '28px 24px',
              border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              {/* Stars */}
              <div style={{ color: '#F59E0B', fontSize: 16, letterSpacing: 2 }}>★★★★★</div>
              {/* Quote */}
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, flex: 1 }}>
                "{r.quote}"
              </p>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: r.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>{r.initial}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function Faq() {
  const items = [
    {
      q: 'Is my money safe if Pochi has a problem?',
      a: 'Absolutely. Money never touches Pochi — it goes directly to your Paybill or Till. If Pochi went offline tomorrow, your M-Pesa setup would be completely unaffected. Contributions would still arrive in your account as normal.',
    },
    {
      q: 'Does it work with Equity, KCB, Co-op and other bank Paybills?',
      a: 'Yes. Pochi works with any Safaricom Paybill or Buy Goods Till — including bank Paybills from Equity (247247), KCB (522522), Co-op (400200), and others, as well as your own business Paybill or Till.',
    },
    {
      q: 'How does the WhatsApp bot get added to my group?',
      a: 'From your Pochi dashboard, go to the fundraiser and click "Connect WhatsApp Group". You\'ll see a list of your WhatsApp groups — select the right one. The bot joins automatically. No technical steps needed.',
    },
    {
      q: 'Can contributors register and pledge without leaving WhatsApp?',
      a: 'Yes. When a contributor sends "pledge 1000" in the group, Pochi DMs them to register their name and Safaricom number — entirely inside WhatsApp. No links, no forms, no app downloads.',
    },
    {
      q: 'What if a payment doesn\'t get matched automatically?',
      a: 'Unmatched payments appear in your dashboard under "Unmatched Transactions". You can match them manually with one click. This can happen when someone pays from a number not registered with Pochi.',
    },
    {
      q: 'What happens when I hit the free plan limit?',
      a: 'The Spark (free) plan allows 1 fundraiser, up to 20 contributors, and a KES 30,000 target. When you need more, upgrade to Pro (KES 999/month) for unlimited everything. You can upgrade at any time from Settings.',
    },
  ]

  return (
    <section style={{ background: LIGHT, padding: '72px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
            Frequently asked questions
          </h2>
          <p style={{ fontSize: 15, color: '#4B5563' }}>
            Everything you need to know before getting started.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: `1px solid ${open ? 'rgba(0,166,81,0.3)' : '#E5E7EB'}`,
      overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 12,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: NAVY, lineHeight: 1.4 }}>{q}</span>
        <span style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
          background: open ? G : '#F3F4F6',
          color: open ? '#fff' : '#6B7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, lineHeight: 1,
          transition: 'background 0.2s, color 0.2s',
        }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px', fontSize: 14, color: '#4B5563', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const nav = useNavigate()
  const plans = [
    {
      name: 'Spark',
      price: 'Free',
      sub: 'forever',
      highlight: false,
      features: [
        '1 active fundraiser',
        'Up to 20 contributors',
        'KES 30,000 target cap',
        'WhatsApp bot',
        'Auto M-Pesa matching',
        'PDF & Excel export',
      ],
      cta: 'Get started free',
      action: () => nav('/signup'),
    },
    {
      name: 'Pro',
      price: 'KES 999',
      sub: 'per month',
      highlight: true,
      features: [
        'Unlimited fundraisers',
        'Unlimited contributors',
        'No target cap',
        'WhatsApp bot',
        'Auto M-Pesa matching',
        'PDF & Excel export',
        'Priority support',
      ],
      cta: 'Start with Pro',
      action: () => nav('/signup'),
    },
  ]
  return (
    <section style={{ background: '#fff', padding: '72px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: 15, color: '#4B5563' }}>
            Start free. Upgrade when you need more.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          {plans.map((p, i) => (
            <div key={i} style={{
              borderRadius: 16, padding: '32px 28px',
              border: p.highlight ? `2px solid ${G}` : '1px solid #E5E7EB',
              background: p.highlight ? '#fff' : '#FAFAFA',
              boxShadow: p.highlight ? '0 8px 32px rgba(0,166,81,0.15)' : 'none',
              position: 'relative',
            }}>
              {p.highlight && (
                <div style={{
                  position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                  background: G, color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '3px 14px', borderRadius: 20,
                }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: p.highlight ? G : NAVY }}>{p.price}</span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{p.sub}</span>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', margin: '20px 0' }} />
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: 24 }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: G, fontWeight: 700, fontSize: 16 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={p.action} style={{
                width: '100%', padding: '12px 0',
                background: p.highlight ? G : '#fff',
                color: p.highlight ? '#fff' : NAVY,
                border: p.highlight ? 'none' : `1.5px solid #E5E7EB`,
                borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>{p.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCta() {
  const nav = useNavigate()
  return (
    <section style={{ background: NAVY, padding: '80px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>🚀</div>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.3 }}>
          Ready to run your next harambee stress-free?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', marginBottom: 32, lineHeight: 1.6 }}>
          Join organizers across Kenya who've ditched the spreadsheet and let Pochi handle the bookkeeping.
        </p>
        <button onClick={() => nav('/signup')} style={{
          background: G, color: '#fff', border: 'none', borderRadius: 12,
          padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,166,81,0.4)',
        }}>Create your free account</button>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 14 }}>
          Free forever on the Spark plan. No credit card required.
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const nav = useNavigate()
  return (
    <footer style={{ background: '#111827', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: G, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 15,
          }}>P</div>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Pochi</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginLeft: 8 }}>© 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Sign in', '/login'], ['Sign up', '/signup']].map(([label, path]) => (
            <button key={path} onClick={() => nav(path)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: 0,
            }}>{label}</button>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <TrustBanner />
      <Features />
      <Testimonials />
      <Faq />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  )
}
