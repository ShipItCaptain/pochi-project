import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { transactionApi, contributorApi } from '../services/api'

export default function UnmatchedResolvePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [unmatched, setUnmatched] = useState([])
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(null)
  const [selectedTx, setSelectedTx] = useState(null)

  const load = async () => {
    try {
      const [txRes, cRes] = await Promise.all([
        transactionApi.listUnmatched(id),
        contributorApi.list(id),
      ])
      setUnmatched(txRes.data)
      setContributors(cRes.data)
    } catch {
      toast.error('Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMatch = async (txId, contributorId) => {
    setMatching(txId)
    try {
      await transactionApi.match(id, txId, { contributor_id: contributorId })
      toast.success('Transaction matched!')
      setSelectedTx(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Match failed.')
    } finally {
      setMatching(null)
    }
  }

  if (loading) return <Layout><div style={{ padding: 32, color: '#9CA3AF' }}>Loading...</div></Layout>

  return (
    <Layout>
      <div style={{ padding: '28px 32px' }}>
        <button onClick={() => navigate(`/fundraisers/${id}`)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: 13, padding: 0, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>← Fundraiser</button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>Unmatched Transactions</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 24 }}>
          {unmatched.length} payment{unmatched.length !== 1 ? 's' : ''} need{unmatched.length === 1 ? 's' : ''} to be manually matched
        </p>

        {unmatched.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            padding: 48, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', margin: '0 0 6px' }}>All payments matched!</h2>
            <p style={{ fontSize: 13, color: '#4B5563' }}>No unmatched transactions to resolve.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {unmatched.map(tx => (
              <div key={tx.id} style={{
                background: '#fff',
                border: `1px solid ${selectedTx === tx.id ? '#00A651' : '#E5E7EB'}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {/* Transaction info */}
                <div style={{ padding: '14px 16px', borderBottom: selectedTx === tx.id ? '1px solid #E5E7EB' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E' }}>{tx.mpesa_sender_name}</div>
                      <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{tx.mpesa_sender_phone}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {new Date(tx.received_at).toLocaleString('en-KE')} · ID: {tx.mpesa_transaction_id}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#00A651' }}>KES {tx.amount.toLocaleString()}</div>
                      <span style={{ fontSize: 11, background: '#FEF2F2', color: '#E53935', padding: '2px 8px', borderRadius: 20 }}>Unmatched</span>
                    </div>
                  </div>

                  {selectedTx !== tx.id && (
                    <button onClick={() => setSelectedTx(tx.id)} style={{
                      marginTop: 12, padding: '7px 14px',
                      background: '#1A1A2E', color: '#fff',
                      border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>Match to contributor →</button>
                  )}
                </div>

                {/* Contributor picker */}
                {selectedTx === tx.id && (
                  <div style={{ padding: '14px 16px', background: '#F7F8FA' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 10 }}>Select contributor:</div>
                    <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                      {contributors.map(c => (
                        <div key={c.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 12px',
                          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>{c.full_name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.phone_number} · Balance: KES {(c.pledge_amount - c.paid_amount).toLocaleString()}</div>
                          </div>
                          <button
                            disabled={matching === tx.id}
                            onClick={() => handleMatch(tx.id, c.id)}
                            style={{
                              padding: '6px 14px',
                              background: '#00A651', color: '#fff',
                              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              cursor: matching === tx.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {matching === tx.id ? 'Matching...' : 'Match'}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelectedTx(null)} style={{
                      marginTop: 10, padding: '6px 12px',
                      background: 'none', border: '1px solid #E5E7EB',
                      borderRadius: 6, fontSize: 12, color: '#4B5563', cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
