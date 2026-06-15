import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { authApi, subscriptionApi, whatsappApi } from '../services/api'
import { useAuthStore } from '../store/auth.store'

const PLANS = [
  { id: 'spark', name: 'Spark', price: 'Free', sub: '1 fundraiser · 20 contributors · KES 30k cap', free: true },
  { id: 'solo_monthly', name: 'Solo Monthly', price: 'KES 999/mo', sub: 'Unlimited fundraisers and contributors' },
  { id: 'solo_quarterly', name: 'Solo Quarterly', price: 'KES 899/mo', sub: 'Save 10% · billed KES 2,697' },
  { id: 'solo_biannual', name: 'Solo 6 Months', price: 'KES 799/mo', sub: 'Save 20% · billed KES 4,794' },
  { id: 'solo_annual', name: 'Solo Annual', price: 'KES 699/mo', sub: 'Save 30% · billed KES 8,388' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { organizer, updateOrganizer, logout } = useAuthStore()
  const [profile, setProfile] = useState({ full_name: organizer?.full_name || '', email: organizer?.email || '' })
  const [saving, setSaving] = useState(false)
  const [subscribing, setSubscribing] = useState(null)
  const [subStatus, setSubStatus] = useState(null)

  // WhatsApp bot state
  const [waStatus, setWaStatus] = useState({ connected: false, initializing: false })
  const [waQr, setWaQr] = useState(null)
  const [waActionLoading, setWaActionLoading] = useState(false)

  useEffect(() => {
    subscriptionApi.status().then(r => setSubStatus(r.data)).catch(() => {})
  }, [])

  // Poll every 2s — fast enough to show QR the moment Chrome boots (~20s)
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await whatsappApi.qr()
        if (cancelled) return
        setWaStatus({ connected: res.data.connected, initializing: res.data.initializing })
        setWaQr(res.data.qr || null)
      } catch (_) {}
    }
    poll()
    const interval = setInterval(poll, 2000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const handleWaDisconnect = async () => {
    setWaActionLoading(true)
    try {
      await whatsappApi.disconnect()
      setWaStatus({ connected: false, initializing: false })
      setWaQr(null)
      toast.success('WhatsApp bot disconnected.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to disconnect.')
    } finally {
      setWaActionLoading(false)
    }
  }

  const handleWaReinit = async () => {
    setWaActionLoading(true)
    setWaQr(null)
    try {
      await whatsappApi.reinit()
      toast.success('Reconnecting — new QR code will appear shortly.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reconnect.')
    } finally {
      setWaActionLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile(profile)
      updateOrganizer(res.data)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubscribe = async (planId) => {
    setSubscribing(planId)
    try {
      const res = await subscriptionApi.initiate({ plan: planId })
      toast.success(res.data.message)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate payment.')
    } finally {
      setSubscribing(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <div style={{ padding: '28px 32px', maxWidth: 640 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 24px' }}>Settings</h1>

        {/* Profile */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', margin: '0 0 16px' }}>Profile</h2>
          <form onSubmit={handleSaveProfile}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#4B5563', marginBottom: 5 }}>Phone number</label>
              <input value={organizer?.phone_number || ''} disabled style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #E5E7EB', borderRadius: 8,
                fontSize: 14, background: '#F3F4F6', color: '#9CA3AF',
                boxSizing: 'border-box',
              }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#4B5563', marginBottom: 5 }}>Full name</label>
              <input
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 14, background: '#F7F8FA', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#4B5563', marginBottom: 5 }}>
                Email <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 14, background: '#F7F8FA', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button type="submit" disabled={saving} style={{
              padding: '9px 18px',
              background: saving ? '#9CA3AF' : '#00A651',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Subscription */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', margin: '0 0 4px' }}>Subscription</h2>
          <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 16 }}>
            Current plan: <strong style={{ color: '#00A651' }}>{subStatus?.subscription_plan || organizer?.subscription_plan}</strong>
            {subStatus?.subscription_expires_at && (
              <span style={{ color: '#9CA3AF', marginLeft: 8 }}>· Expires {new Date(subStatus.subscription_expires_at).toLocaleDateString('en-KE')}</span>
            )}
          </p>

          <div style={{ display: 'grid', gap: 10 }}>
            {PLANS.map(plan => {
              const basePlan = subStatus?.subscription_plan || organizer?.subscription_plan
              const specificPlan = subStatus?.current_plan_type
              const isCurrent = plan.free
                ? basePlan === 'spark'
                : specificPlan === plan.id
              return (
                <div key={plan.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px',
                  border: `1px solid ${isCurrent ? '#00A651' : '#E5E7EB'}`,
                  borderRadius: 10,
                  background: isCurrent ? '#E8F8EF' : '#fff',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{plan.name}</div>
                    <div style={{ fontSize: 11, color: '#4B5563' }}>{plan.sub}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{plan.price}</span>
                    {!plan.free && !isCurrent && (
                      <button
                        disabled={subscribing === plan.id}
                        onClick={() => handleSubscribe(plan.id)}
                        style={{
                          padding: '6px 14px',
                          background: subscribing === plan.id ? '#9CA3AF' : '#00A651',
                          color: '#fff', border: 'none', borderRadius: 7,
                          fontSize: 12, fontWeight: 600,
                          cursor: subscribing === plan.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {subscribing === plan.id ? '...' : 'Subscribe'}
                      </button>
                    )}
                    {isCurrent && <span style={{ fontSize: 11, color: '#00A651', fontWeight: 600 }}>Current</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* WhatsApp Bot */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>WhatsApp Bot</h2>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: waStatus.connected ? '#E8F8EF' : waStatus.initializing ? '#FEF9C3' : '#FEF2F2',
              color: waStatus.connected ? '#00A651' : waStatus.initializing ? '#B45309' : '#E53935',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {waStatus.connected ? 'Connected' : waStatus.initializing ? 'Waiting for scan' : 'Disconnected'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 16 }}>
            Connect a WhatsApp number to send automatic payment updates to your fundraiser groups.
          </p>

          {waStatus.connected ? (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: '#E8F8EF', border: '1px solid #BBF7D0', borderRadius: 8, marginBottom: 14,
              }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontSize: 13, color: '#065F46', fontWeight: 500 }}>Bot is active and ready to send messages.</span>
              </div>
              <button
                onClick={handleWaDisconnect}
                disabled={waActionLoading}
                style={{
                  padding: '8px 16px',
                  background: '#FEF2F2', border: '1px solid #E53935',
                  color: '#E53935', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: waActionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {waActionLoading ? 'Disconnecting...' : 'Disconnect bot'}
              </button>
            </div>
          ) : (
            <div>
              {waQr ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 12 }}>
                    Open WhatsApp on your bot number → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → scan below
                  </p>
                  <div style={{
                    display: 'inline-block',
                    padding: 12,
                    background: '#fff',
                    border: '2px solid #E5E7EB',
                    borderRadius: 12,
                    marginBottom: 12,
                  }}>
                    <img src={waQr} alt="WhatsApp QR Code" style={{ width: 200, height: 200, display: 'block' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 14 }}>QR code refreshes automatically every 60 seconds</p>
                  <button
                    onClick={handleWaReinit}
                    disabled={waActionLoading}
                    style={{
                      padding: '7px 14px',
                      background: '#F7F8FA', border: '1px solid #E5E7EB',
                      color: '#4B5563', borderRadius: 8,
                      fontSize: 12, fontWeight: 500, cursor: waActionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {waActionLoading ? 'Refreshing...' : 'Refresh QR code'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  {waStatus.initializing ? (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                      <p style={{ fontSize: 13, color: '#4B5563', margin: '0 0 4px' }}>Starting WhatsApp bot…</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 12px' }}>QR code will appear in a few seconds</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📵</div>
                      <p style={{ fontSize: 13, color: '#4B5563', margin: '0 0 12px' }}>Bot is not running.</p>
                      <button
                        onClick={handleWaReinit}
                        disabled={waActionLoading}
                        style={{
                          padding: '8px 18px',
                          background: waActionLoading ? '#9CA3AF' : '#00A651',
                          color: '#fff', border: 'none', borderRadius: 8,
                          fontSize: 13, fontWeight: 600, cursor: waActionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {waActionLoading ? 'Starting...' : 'Start bot'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E53935', margin: '0 0 12px' }}>Account</h2>
          <button onClick={handleLogout} style={{
            padding: '8px 16px',
            background: '#FEF2F2', border: '1px solid #E53935',
            color: '#E53935', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Sign out</button>
        </div>
      </div>
    </Layout>
  )
}
