import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { authApi, subscriptionApi } from '../services/api'
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

  useEffect(() => {
    subscriptionApi.status().then(r => setSubStatus(r.data)).catch(() => {})
  }, [])

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
              const isCurrent = (subStatus?.subscription_plan || organizer?.subscription_plan) === (plan.free ? 'spark' : plan.id.replace('_monthly', '').replace('_quarterly', '').replace('_biannual', '').replace('_annual', ''))
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
