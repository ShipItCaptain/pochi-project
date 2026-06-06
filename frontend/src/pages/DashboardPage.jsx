import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { fundraiserApi } from '../services/api'
import { useAuthStore } from '../store/auth.store'

const StatusBadge = ({ status }) => {
  const colors = {
    active: { bg: '#E8F8EF', color: '#00A651' },
    paused: { bg: '#FEF3E2', color: '#F59E0B' },
    closed: { bg: '#F3F4F6', color: '#9CA3AF' },
  }
  const s = colors[status] || colors.active
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 500,
    }}>{status}</span>
  )
}

export default function DashboardPage() {
  const [fundraisers, setFundraisers] = useState([])
  const [loading, setLoading] = useState(true)
  const organizer = useAuthStore(s => s.organizer)
  const navigate = useNavigate()

  useEffect(() => {
    fundraiserApi.list()
      .then(r => setFundraisers(r.data))
      .catch(() => toast.error('Failed to load fundraisers.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div style={{ padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
              Habari, {organizer?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>Your fundraisers are tracked here</p>
          </div>
          <button
            onClick={() => navigate('/fundraisers/new')}
            style={{
              padding: '10px 18px',
              background: '#00A651',
              color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            + New Fundraiser
          </button>
        </div>

        {/* Plan banner for free tier */}
        {organizer?.subscription_plan === 'spark' && (
          <div style={{
            background: '#FEF3E2',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>Free Spark Plan</span>
              <span style={{ fontSize: 12, color: '#B45309', marginLeft: 8 }}>1 fundraiser · 20 contributors · KES 30k cap</span>
            </div>
            <Link to="/settings" style={{
              fontSize: 12, fontWeight: 600, color: '#00A651', textDecoration: 'none',
              padding: '5px 12px', border: '1px solid #00A651', borderRadius: 6,
            }}>Upgrade →</Link>
          </div>
        )}

        {/* Fundraisers list */}
        {loading ? (
          <div style={{ color: '#9CA3AF', textAlign: 'center', paddingTop: 60 }}>Loading...</div>
        ) : fundraisers.length === 0 ? (
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1A1A2E', margin: '0 0 8px' }}>No fundraisers yet</h2>
            <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 20 }}>Create your first fundraiser to start coordinating contributions</p>
            <button
              onClick={() => navigate('/fundraisers/new')}
              style={{
                padding: '10px 20px',
                background: '#00A651', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >+ Create Fundraiser</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {fundraisers.map(f => {
              const pct = f.target_amount > 0 ? Math.round((f.total_paid / f.target_amount) * 100) : 0
              return (
                <Link key={f.id} to={`/fundraisers/${f.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '16px 20px',
                    transition: 'box-shadow 0.15s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', margin: '0 0 4px' }}>{f.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <StatusBadge status={f.status} />
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Ref: {f.account_reference}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#00A651' }}>
                          KES {f.total_paid.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>of KES {f.target_amount.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#00A651', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 20 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{pct}%</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>raised</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{f._count?.contributors || 0}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>contributors</span>
                      </div>
                      {f._count?.transactions > 0 && (
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{f._count.transactions}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>payments</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
