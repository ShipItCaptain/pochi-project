import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { contributorApi } from '../services/api'

const PLEDGE_CHIPS = [500, 1000, 1500, 2000, 5000]

const G = '#00A651'
const NAVY = '#1A1A2E'
const SF = '#F7F8FA'

export default function ContributorRegistrationPage() {
  const { token } = useParams()
  const [fundraiser, setFundraiser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('form')
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    pledge_amount: '',
  })

  useEffect(() => {
    contributorApi.getRegistrationInfo(token)
      .then(r => setFundraiser(r.data))
      .catch(() => toast.error('Invalid registration link.'))
      .finally(() => setLoading(false))
  }, [token])

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast.error('Enter your full name.')
    if (!form.phone_number.trim()) return toast.error('Enter your phone number.')

    setSubmitting(true)
    try {
      const res = await contributorApi.register(token, {
        full_name: form.full_name,
        phone_number: `254${form.phone_number.replace(/\D/g, '')}`,
        pledge_amount: parseInt(form.pledge_amount) || 0,
      })
      setRegistered(res.data)
      setStep('success')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: SF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  if (!fundraiser) {
    return (
      <div style={{ minHeight: '100vh', background: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
          <h2 style={{ fontSize: 18, color: NAVY, margin: '0 0 8px' }}>Link not found</h2>
          <p style={{ fontSize: 13, color: '#4B5563' }}>This registration link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const pct = fundraiser.target_amount > 0
    ? Math.round((fundraiser.total_paid / fundraiser.target_amount) * 100) : 0
  const daysLeft = fundraiser.deadline
    ? Math.max(0, Math.ceil((new Date(fundraiser.deadline) - new Date()) / (86400000)))
    : null

  return (
    <div style={{ minHeight: '100vh', background: SF, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: NAVY }}>
      {/* Dark header */}
      <div style={{ background: NAVY, padding: '16px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <div style={{ width: 24, height: 24, background: G, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>P</div>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Pochi</span>
        </div>

        {/* Fundraiser box */}
        <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 13 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{fundraiser.title}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
            {daysLeft !== null ? `${daysLeft} days left` : 'No deadline'}
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 7 }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: G, borderRadius: 3 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { v: `${(fundraiser.total_paid / 1000).toFixed(1)}k`, l: 'Raised' },
              { v: `${pct}%`, l: `of ${(fundraiser.target_amount / 1000).toFixed(0)}k`, color: G },
              { v: fundraiser._count?.contributors || 0, l: 'People' },
              { v: daysLeft !== null ? daysLeft : '∞', l: 'Days left' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: item.color || '#fff' }}>{item.v}</div>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {step === 'form' && (
          <form onSubmit={handleRegister}>
            <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Join this fundraiser</div>
              <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6, marginBottom: 14 }}>
                Register your contribution. Your name will appear in the WhatsApp group when you pay.
              </div>

              {/* Trust badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#E8F8EF', border: '0.5px solid rgba(0,166,81,.2)', borderRadius: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>
                  Money goes directly to the organizer's Paybill — Pochi never holds your funds
                </div>
              </div>

              {/* Full name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: 4 }}>Your full name</label>
                <input
                  value={form.full_name}
                  onChange={e => set('full_name')(e.target.value)}
                  placeholder="Same name as your M-Pesa account"
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: SF, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: 4 }}>Phone number</label>
                <div style={{ display: 'flex' }}>
                  <div style={{ padding: '11px', background: SF, border: '0.5px solid #D1D5DB', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 14, color: '#4B5563', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    🇰🇪 +254
                  </div>
                  <input
                    type="tel"
                    value={form.phone_number}
                    onChange={e => set('phone_number')(e.target.value.replace(/\D/g, ''))}
                    placeholder="7XX XXX XXX"
                    style={{ flex: 1, padding: '11px 12px', borderRadius: '0 8px 8px 0', border: '0.5px solid #D1D5DB', borderLeft: 'none', background: SF, fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Your M-Pesa number</div>
              </div>

              {/* Pledge */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: 4 }}>Pledge amount (KES)</label>
                <input
                  type="number"
                  value={form.pledge_amount}
                  onChange={e => set('pledge_amount')(e.target.value)}
                  placeholder="0"
                  min={0}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: SF, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {PLEDGE_CHIPS.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => set('pledge_amount')(String(amount))}
                      style={{
                        padding: '5px 12px', borderRadius: 16,
                        border: `0.5px solid ${parseInt(form.pledge_amount) === amount ? G : '#D1D5DB'}`,
                        background: parseInt(form.pledge_amount) === amount ? '#E8F8EF' : SF,
                        color: parseInt(form.pledge_amount) === amount ? G : '#4B5563',
                        fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: 13, background: submitting ? '#9CA3AF' : G,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {submitting ? 'Registering...' : '✓ Register my contribution'}
              </button>
              <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                By registering you agree to Pochi's Terms and Privacy Policy
              </p>
            </div>
          </form>
        )}

        {step === 'success' && registered && (
          <>
            {/* Success header */}
            <div style={{ background: G, borderRadius: 12, padding: '20px 16px', textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6 }}>You're registered! 🎉</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
                Your pledge of KES {registered.contributor.pledge_amount.toLocaleString()} has been recorded for {fundraiser.title}
              </div>
            </div>

            {/* Summary card */}
            <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Your summary</div>
              {[
                { l: 'Name', v: registered.contributor.full_name },
                { l: 'Phone', v: registered.contributor.phone_number },
                { l: 'Pledge', v: `KES ${registered.contributor.pledge_amount.toLocaleString()}`, color: G },
                { l: 'Paid so far', v: 'KES 0 — pending', color: '#F59E0B' },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #E5E7EB' }}>
                  <span style={{ fontSize: 12, color: '#4B5563' }}>{row.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: row.color || NAVY }}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Payment instructions */}
            <div style={{ background: NAVY, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Now send your money</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5, marginBottom: 10 }}>Use the reference below so Pochi matches your payment automatically.</div>
              {[
                { l: fundraiser.paybill_number ? 'Paybill number' : 'Till number', v: fundraiser.paybill_number || fundraiser.till_number },
                { l: 'Account reference', v: fundraiser.account_reference },
                { l: 'Amount', v: `KES ${registered.contributor.pledge_amount.toLocaleString()}`, color: G },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{row.l}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: row.color || '#fff', fontFamily: 'monospace' }}>{row.v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#E8FEF0', border: '0.5px solid rgba(37,211,102,.2)', borderRadius: 8 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>
                Once your payment lands, Pochi posts a confirmation in the WhatsApp group automatically. Nothing else needed from you.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
