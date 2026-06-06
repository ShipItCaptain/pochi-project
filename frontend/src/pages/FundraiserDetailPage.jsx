import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { fundraiserApi, contributorApi } from '../services/api'

const PLEDGE_COLORS = {
  unpledged: '#9CA3AF',
  pledged: '#F59E0B',
  partial: '#F59E0B',
  complete: '#00A651',
  overpaid: '#00A651',
}

export default function FundraiserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('contributors')
  const [copying, setCopying] = useState(false)

  const load = async () => {
    try {
      const [sumRes, contribRes] = await Promise.all([
        fundraiserApi.summary(id),
        contributorApi.list(id),
      ])
      setSummary(sumRes.data)
      setContributors(contribRes.data)
    } catch {
      toast.error('Failed to load fundraiser.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const copyRegLink = () => {
    const link = `${window.location.origin}/register/${summary.registration_link_token}`
    navigator.clipboard.writeText(link)
    toast.success('Registration link copied!')
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const handleConnectDaraja = async () => {
    try {
      await fundraiserApi.connectDaraja(id)
      toast.success('Daraja webhook registered!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to connect Daraja.')
    }
  }

  const handleRemind = async (cid) => {
    try {
      await contributorApi.remind(id, cid)
      toast.success('Reminder sent.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reminder.')
    }
  }

  if (loading) return <Layout><div style={{ padding: 32, color: '#9CA3AF' }}>Loading...</div></Layout>
  if (!summary) return <Layout><div style={{ padding: 32, color: '#E53935' }}>Fundraiser not found.</div></Layout>

  const pct = summary.progress_pct

  return (
    <Layout>
      <div style={{ padding: '28px 32px' }}>
        {/* Breadcrumb */}
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: 13, padding: 0, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>← Dashboard</button>

        {/* Hero */}
        <div style={{
          background: '#1A1A2E',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{summary.title}</h1>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Ref: {summary.account_reference}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/fundraisers/${id}/export`} style={{
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 7, color: '#fff', textDecoration: 'none',
                fontSize: 12, fontWeight: 500,
              }}>Export</Link>
              <Link to={`/fundraisers/${id}/unmatched`} style={{
                padding: '7px 14px',
                background: summary.unmatched_transactions > 0 ? '#E53935' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${summary.unmatched_transactions > 0 ? '#E53935' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 7, color: '#fff', textDecoration: 'none',
                fontSize: 12, fontWeight: 500,
              }}>
                {summary.unmatched_transactions > 0 ? `⚠ ${summary.unmatched_transactions} Unmatched` : 'Transactions'}
              </Link>
            </div>
          </div>

          {/* Progress */}
          <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#00A651', borderRadius: 4 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { v: `KES ${summary.total_paid.toLocaleString()}`, l: 'Raised' },
              { v: `${pct}%`, l: `of KES ${summary.target_amount.toLocaleString()}`, color: '#00A651' },
              { v: contributors.length, l: 'Contributors' },
              { v: summary.paid_contributors, l: 'Fully paid' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: i > 0 ? 'center' : 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color || '#fff' }}>{item.v}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Registration link */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>Registration link</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 10 }}>Share in your WhatsApp group</div>
            <button onClick={copyRegLink} style={{
              width: '100%', padding: '8px 12px',
              background: copying ? '#E8F8EF' : '#00A651',
              color: copying ? '#00A651' : '#fff',
              border: copying ? '1px solid #00A651' : 'none',
              borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {copying ? '✓ Copied!' : '📋 Copy link'}
            </button>
          </div>

          {/* Daraja status */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>M-Pesa webhook</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 10 }}>
              {summary.daraja_webhook_registered ? '✅ Connected — payments are tracked automatically' : 'Not connected yet'}
            </div>
            {!summary.daraja_webhook_registered && (
              <button onClick={handleConnectDaraja} style={{
                width: '100%', padding: '8px 12px',
                background: '#1A1A2E', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Connect Daraja</button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#E5E7EB', borderRadius: 8, padding: 3, width: 'fit-content' }}>
          {['contributors', 'info'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#1A1A2E' : '#9CA3AF',
              fontSize: 13, fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
              {t === 'contributors' ? `Contributors (${contributors.length})` : 'Info'}
            </button>
          ))}
        </div>

        {/* Contributors table */}
        {tab === 'contributors' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            {contributors.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                No contributors yet. Share the registration link above.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #E5E7EB' }}>
                    {['Name', 'Phone', 'Pledge', 'Paid', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contributors.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>{c.full_name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#4B5563' }}>{c.phone_number}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1A1A2E' }}>KES {c.pledge_amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#00A651' }}>KES {c.paid_amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                          background: `${PLEDGE_COLORS[c.pledge_status]}18`,
                          color: PLEDGE_COLORS[c.pledge_status],
                        }}>{c.pledge_status}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {c.pledge_status !== 'complete' && c.pledge_status !== 'overpaid' && (
                          <button onClick={() => handleRemind(c.id)} style={{
                            padding: '4px 10px',
                            background: 'none', border: '1px solid #E5E7EB',
                            borderRadius: 5, fontSize: 11, color: '#4B5563', cursor: 'pointer',
                          }}>Remind</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'info' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            {[
              { label: 'Title', value: summary.title },
              { label: 'Description', value: summary.description || '—' },
              { label: 'Reference', value: summary.account_reference },
              { label: 'Paybill', value: summary.paybill_number || '—' },
              { label: 'Till', value: summary.till_number || '—' },
              { label: 'Deadline', value: summary.deadline ? new Date(summary.deadline).toLocaleDateString('en-KE') : '—' },
              { label: 'Status', value: summary.status },
              { label: 'Created', value: new Date(summary.created_at).toLocaleDateString('en-KE') },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #F3F4F6',
              }}>
                <span style={{ fontSize: 13, color: '#4B5563' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
