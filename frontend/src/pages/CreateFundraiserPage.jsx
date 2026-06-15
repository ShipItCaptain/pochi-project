import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { fundraiserApi } from '../services/api'

export default function CreateFundraiserPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_amount: '',
    paybill_number: '',
    paybill_account: '',
    till_number: '',
    deadline: '',
  })

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Enter a fundraiser title.')
    if (!form.target_amount) return toast.error('Enter a target amount.')
    if (!form.paybill_number && !form.till_number) return toast.error('Add a Paybill or Till number.')
    if (form.paybill_number && !form.paybill_account.trim()) return toast.error('Enter the account number for your paybill.')

    setLoading(true)
    try {
      const res = await fundraiserApi.create({
        title: form.title,
        description: form.description || undefined,
        target_amount: parseInt(form.target_amount),
        paybill_number: form.paybill_number || undefined,
        account_reference: form.paybill_number && form.paybill_account.trim() ? form.paybill_account.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : undefined,
        till_number: form.till_number || undefined,
        deadline: form.deadline || undefined,
      })
      toast.success('Fundraiser created!')
      navigate(`/fundraisers/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create fundraiser.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #E5E7EB', borderRadius: 8,
    fontSize: 14, outline: 'none', background: '#F7F8FA',
    boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: '#4B5563', marginBottom: 6,
  }

  return (
    <Layout>
      <div style={{ padding: '28px 32px', maxWidth: 600 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9CA3AF', fontSize: 14, padding: 0, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>← Back</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>New Fundraiser</h1>
          <p style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>Create a fundraiser to start collecting contributions</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: '0 0 16px' }}>Fundraiser details</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Title</label>
              <input value={form.title} onChange={set('title')} placeholder="e.g. Wanjiru Kitchen Harambee" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.description} onChange={set('description')} placeholder="What is this fundraiser for?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Target amount (KES)</label>
              <input type="number" value={form.target_amount} onChange={set('target_amount')} placeholder="50000" min={1} style={inputStyle} />
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Free plan: max KES 30,000</p>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Deadline <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <input type="date" value={form.deadline} onChange={set('deadline')} style={inputStyle} />
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: '0 0 6px' }}>M-Pesa details</h2>
            <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 16 }}>Money goes directly to YOUR Paybill or Till. Pochi never holds funds.</p>

            <div style={{ marginBottom: form.paybill_number ? 0 : 16 }}>
              <label style={labelStyle}>Paybill number</label>
              <input value={form.paybill_number} onChange={set('paybill_number')} placeholder="522522" style={inputStyle} />
            </div>

            {form.paybill_number && (
              <div style={{ marginBottom: 16, marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #00A651' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Account number <span style={{ color: '#E53935' }}>*</span></label>
                  <button
                    type="button"
                    onClick={() => {
                      const ref = 'PCH' + Math.random().toString(36).substring(2, 6).toUpperCase()
                      setForm(f => ({ ...f, paybill_account: ref }))
                    }}
                    style={{ fontSize: 11, color: '#00A651', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                  >
                    Auto-generate
                  </button>
                </div>
                <input
                  value={form.paybill_account}
                  onChange={set('paybill_account')}
                  placeholder="e.g. HARAMBEE2025 or your bank account number"
                  maxLength={30}
                  style={{ ...inputStyle, borderColor: form.paybill_number && !form.paybill_account.trim() ? '#E53935' : '#E5E7EB' }}
                />
                <div style={{ marginTop: 8, padding: '8px 10px', background: '#FFF9E6', border: '1px solid #F59E0B', borderRadius: 7, fontSize: 11, color: '#92400E', lineHeight: 1.6 }}>
                  <strong>Bank paybill</strong> (Equity 247247, KCB 522522, Co-op 400200, etc.) — enter your <strong>actual bank account number</strong>. Contributors must type it exactly or the money won't reach you.<br />
                  <strong>Business paybill</strong> (your own shortcode) — enter any memorable reference like <em>HARAMBEE2025</em>, or click Auto-generate.
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Or Till number</label>
              <input value={form.till_number} onChange={set('till_number')} placeholder="123456" style={inputStyle} />
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Enter either Paybill or Till number</p>
            </div>
          </div>

          <div style={{
            background: '#E8F8EF',
            border: '1px solid rgba(0,166,81,0.2)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            display: 'flex', gap: 8,
          }}>
            <span>🛡️</span>
            <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
              Pochi registers a webhook on your Paybill to receive payment notifications. Your M-Pesa setup stays unchanged — you keep full control of your funds.
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13,
            background: loading ? '#9CA3AF' : '#00A651',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Creating...' : 'Create Fundraiser'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
