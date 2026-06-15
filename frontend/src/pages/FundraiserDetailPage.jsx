import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { fundraiserApi, contributorApi, whatsappApi, transactionApi } from '../services/api'

const PLEDGE_COLORS = {
  unpledged: '#9CA3AF', pledged: '#F59E0B', partial: '#F59E0B',
  complete: '#00A651', overpaid: '#00A651',
}
const MATCH_BADGE = {
  auto_matched: { bg: '#E8F8EF', color: '#00A651', label: 'Auto' },
  manually_matched: { bg: '#EFF6FF', color: '#3B82F6', label: 'Manual' },
  unmatched: { bg: '#FEF2F2', color: '#E53935', label: 'Unmatched' },
}
const STATUS_COLOR = { active: '#00A651', paused: '#F59E0B', closed: '#9CA3AF' }

export default function FundraiserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('contributors')
  const [copying, setCopying] = useState(false)

  // WhatsApp
  const [waForm, setWaForm] = useState({ whatsapp_group_id: '', bot_phone_number: '' })
  const [waConnecting, setWaConnecting] = useState(false)
  const [waEditing, setWaEditing] = useState(false)
  const [waBotReady, setWaBotReady] = useState(false)
  const [waGroups, setWaGroups] = useState([])
  const [waGroupsLoading, setWaGroupsLoading] = useState(false)
  const [usedGroupIds, setUsedGroupIds] = useState([])
  const [langSaving, setLangSaving] = useState(false)

  // Edit fundraiser
  const [editingFundraiser, setEditingFundraiser] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // Transactions tab
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)

  // Edit / delete contributor
  const [editingContributor, setEditingContributor] = useState(null)
  const [editContribForm, setEditContribForm] = useState({})
  const [editContribSaving, setEditContribSaving] = useState(false)
  const [deletingContributor, setDeletingContributor] = useState(null)

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

  useEffect(() => {
    const check = async () => {
      try {
        const r = await whatsappApi.status()
        setWaBotReady(r.data.connected)
      } catch (err) {
        console.error('[WA status check failed]', err?.response?.status, err?.message)
      }
    }
    check()
    const interval = setInterval(check, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (waBotReady && waGroups.length === 0 && !waGroupsLoading) loadWaGroups()
  }, [waBotReady])

  useEffect(() => {
    if (tab === 'transactions' && transactions.length === 0 && !txLoading) loadTransactions()
  }, [tab])

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  const loadWaGroups = async () => {
    setWaGroupsLoading(true)
    try {
      const groupsRes = await whatsappApi.groups()
      setWaGroups(groupsRes.data)
    } catch {
      toast.error('Could not load groups. Is the bot connected?')
    } finally {
      setWaGroupsLoading(false)
    }
    try {
      const fundraisersRes = await fundraiserApi.list()
      const taken = fundraisersRes.data
        .filter(f => f.id !== id && f.whatsapp_group_id)
        .map(f => f.whatsapp_group_id)
      setUsedGroupIds(taken)
    } catch { /* non-critical */ }
  }

  const handleConnectWhatsapp = async (e) => {
    e.preventDefault()
    if (!waForm.whatsapp_group_id.trim()) return toast.error('Select a WhatsApp group.')
    setWaConnecting(true)
    try {
      await fundraiserApi.connectWhatsapp(id, {
        whatsapp_group_id: waForm.whatsapp_group_id.trim(),
        bot_phone_number: waForm.bot_phone_number.trim() || undefined,
      })
      toast.success('WhatsApp group connected!')
      setWaEditing(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to connect WhatsApp group.')
    } finally {
      setWaConnecting(false)
    }
  }

  const handleLangChange = async (lang) => {
    if (langSaving || summary.bot_language === lang) return
    setLangSaving(true)
    try {
      await fundraiserApi.update(id, { bot_language: lang })
      setSummary(s => ({ ...s, bot_language: lang }))
      toast.success(`Bot language set to ${lang === 'en' ? 'English' : 'Swahili'}.`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update language.')
    } finally {
      setLangSaving(false)
    }
  }

  // ── Edit fundraiser ───────────────────────────────────────────────────────

  const startEditFundraiser = () => {
    setEditForm({
      title: summary.title,
      description: summary.description || '',
      target_amount: summary.target_amount,
      paybill_number: summary.paybill_number || '',
      till_number: summary.till_number || '',
      deadline: summary.deadline ? new Date(summary.deadline).toISOString().split('T')[0] : '',
    })
    setEditingFundraiser(true)
  }

  const handleSaveFundraiser = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim()) return toast.error('Title is required.')
    if (!editForm.target_amount) return toast.error('Target amount is required.')
    setEditSaving(true)
    try {
      await fundraiserApi.update(id, {
        title: editForm.title.trim(),
        description: editForm.description || null,
        target_amount: parseInt(editForm.target_amount),
        paybill_number: editForm.paybill_number || null,
        till_number: editForm.till_number || null,
        deadline: editForm.deadline || null,
      })
      toast.success('Fundraiser updated.')
      setEditingFundraiser(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleStatusChange = async (status) => {
    const label = status === 'active' ? 'reactivated' : status === 'paused' ? 'paused' : 'closed'
    try {
      await fundraiserApi.update(id, { status })
      toast.success(`Fundraiser ${label}.`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.')
    }
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  const loadTransactions = async () => {
    setTxLoading(true)
    try {
      const res = await transactionApi.list(id)
      setTransactions(res.data)
    } catch {
      toast.error('Failed to load transactions.')
    } finally {
      setTxLoading(false)
    }
  }

  // ── Edit / delete contributor ─────────────────────────────────────────────

  const startEditContributor = (c) => {
    setEditContribForm({ full_name: c.full_name, pledge_amount: c.pledge_amount, notes: c.notes || '' })
    setEditingContributor(c.id)
    setDeletingContributor(null)
  }

  const handleSaveContributor = async (cid) => {
    if (!editContribForm.full_name.trim()) return toast.error('Name is required.')
    setEditContribSaving(true)
    try {
      await contributorApi.update(id, cid, {
        full_name: editContribForm.full_name.trim(),
        pledge_amount: parseInt(editContribForm.pledge_amount) || 0,
        notes: editContribForm.notes || null,
      })
      toast.success('Contributor updated.')
      setEditingContributor(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update.')
    } finally {
      setEditContribSaving(false)
    }
  }

  const handleDeleteContributor = async (cid) => {
    try {
      await contributorApi.delete(id, cid)
      toast.success('Contributor removed.')
      setDeletingContributor(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove contributor.')
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

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <Layout><div style={{ padding: 32, color: '#9CA3AF' }}>Loading...</div></Layout>
  if (!summary) return <Layout><div style={{ padding: 32, color: '#E53935' }}>Fundraiser not found.</div></Layout>

  const pct = summary.progress_pct
  const iStyle = {
    width: '100%', padding: '8px 10px',
    border: '1px solid #E5E7EB', borderRadius: 7,
    fontSize: 13, outline: 'none', background: '#F7F8FA',
    boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <Layout>
      <div style={{ padding: '28px 32px' }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: 13, padding: 0, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>← Dashboard</button>

        {/* ── Hero ── */}
        <div style={{
          background: '#1A1A2E', padding: '20px 24px', marginBottom: 0,
          borderRadius: editingFundraiser ? '16px 16px 0 0' : 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{summary.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Ref: {summary.account_reference}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: `${STATUS_COLOR[summary.status]}22`,
                  color: STATUS_COLOR[summary.status],
                }}>{summary.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={editingFundraiser ? () => setEditingFundraiser(false) : startEditFundraiser} style={{
                padding: '7px 14px',
                background: editingFundraiser ? 'rgba(0,166,81,0.25)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${editingFundraiser ? '#00A651' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 7, color: editingFundraiser ? '#00A651' : '#fff',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>{editingFundraiser ? '✕ Cancel edit' : '✏ Edit'}</button>
              <Link to={`/fundraisers/${id}/export`} style={{
                padding: '7px 14px', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 7, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 500,
              }}>Export</Link>
              <Link to={`/fundraisers/${id}/unmatched`} style={{
                padding: '7px 14px',
                background: summary.unmatched_transactions > 0 ? '#E53935' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${summary.unmatched_transactions > 0 ? '#E53935' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 7, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 500,
              }}>
                {summary.unmatched_transactions > 0 ? `⚠ ${summary.unmatched_transactions} Unmatched` : 'Unmatched (0)'}
              </Link>
            </div>
          </div>

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

        {/* ── Edit fundraiser panel ── */}
        {editingFundraiser && (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderTop: 'none',
            borderRadius: '0 0 12px 12px', padding: 20, marginBottom: 20,
          }}>
            <form onSubmit={handleSaveFundraiser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 4 }}>Title</label>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 4 }}>Target (KES)</label>
                  <input type="number" value={editForm.target_amount} onChange={e => setEditForm(f => ({ ...f, target_amount: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 4 }}>Paybill number</label>
                  <input value={editForm.paybill_number} onChange={e => setEditForm(f => ({ ...f, paybill_number: e.target.value }))} placeholder="Optional" style={iStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 4 }}>Till number</label>
                  <input value={editForm.till_number} onChange={e => setEditForm(f => ({ ...f, till_number: e.target.value }))} placeholder="Optional" style={iStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 4 }}>Deadline</label>
                  <input type="date" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 4 }}>Description</label>
                  <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" style={iStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B5563', marginBottom: 6 }}>Status</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { s: 'active', label: 'Active' },
                    { s: 'paused', label: 'Pause' },
                    { s: 'closed', label: 'Close' },
                  ].map(({ s, label }) => {
                    const isCurrent = summary.status === s
                    const c = STATUS_COLOR[s]
                    return (
                      <button key={s} type="button"
                        onClick={() => !isCurrent && handleStatusChange(s)}
                        style={{
                          padding: '6px 16px', borderRadius: 7,
                          border: `1px solid ${isCurrent ? c : '#E5E7EB'}`,
                          background: isCurrent ? `${c}18` : '#fff',
                          color: isCurrent ? c : '#4B5563',
                          fontSize: 12, fontWeight: isCurrent ? 600 : 400,
                          cursor: isCurrent ? 'default' : 'pointer',
                        }}
                      >{isCurrent ? `● ${label}` : label}</button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={editSaving} style={{
                  padding: '8px 18px', background: editSaving ? '#9CA3AF' : '#00A651',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 600, cursor: editSaving ? 'not-allowed' : 'pointer',
                }}>{editSaving ? 'Saving...' : 'Save changes'}</button>
                <button type="button" onClick={() => setEditingFundraiser(false)} style={{
                  padding: '8px 18px', background: 'none', border: '1px solid #E5E7EB',
                  borderRadius: 7, fontSize: 13, color: '#4B5563', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {!editingFundraiser && <div style={{ marginBottom: 20 }} />}

        {/* ── Setup cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
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
            }}>{copying ? '✓ Copied!' : '📋 Copy link'}</button>
          </div>

          {/* Daraja status */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>M-Pesa webhook</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 10 }}>
              {summary.daraja_webhook_registered ? '✅ Connected — payments tracked automatically' : 'Not connected yet'}
            </div>
            {!summary.daraja_webhook_registered && (
              <button onClick={handleConnectDaraja} style={{
                width: '100%', padding: '8px 12px', background: '#1A1A2E', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Connect Daraja</button>
            )}
          </div>

          {/* WhatsApp group */}
          <div style={{ background: '#fff', border: `1px solid ${waBotReady ? '#BBF7D0' : '#E5E7EB'}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>WhatsApp group</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: waBotReady ? '#00A651' : '#F3F4F6',
                color: waBotReady ? '#fff' : '#9CA3AF',
              }}>{waBotReady ? '● Bot online' : '○ Bot offline'}</span>
            </div>

            {summary.whatsapp_group_id && !waEditing ? (
              <>
                <div style={{ fontSize: 11, color: '#00A651', marginBottom: 6, fontWeight: 600 }}>✅ Group connected</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10, wordBreak: 'break-all' }}>{summary.whatsapp_group_id}</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 5, fontWeight: 500 }}>Bot language</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ code: 'en', label: 'English' }, { code: 'sw', label: 'Swahili' }].map(({ code, label }) => {
                      const active = (summary.bot_language || 'en') === code
                      return (
                        <button key={code} type="button" disabled={langSaving} onClick={() => handleLangChange(code)} style={{
                          flex: 1, padding: '6px 0',
                          background: active ? '#00A651' : '#F7F8FA',
                          color: active ? '#fff' : '#4B5563',
                          border: `1px solid ${active ? '#00A651' : '#E5E7EB'}`,
                          borderRadius: 6, fontSize: 12, fontWeight: active ? 600 : 400,
                          cursor: langSaving ? 'not-allowed' : 'pointer',
                        }}>{label}</button>
                      )
                    })}
                  </div>
                </div>
                <button onClick={() => {
                  setWaForm({ whatsapp_group_id: summary.whatsapp_group_id, bot_phone_number: summary.bot_phone_number || '' })
                  setWaEditing(true)
                  loadWaGroups()
                }} style={{
                  width: '100%', padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB',
                  borderRadius: 7, fontSize: 12, color: '#4B5563', cursor: 'pointer',
                }}>Change group</button>
              </>
            ) : !waBotReady ? (
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
                  Bot is offline. Go to <a href="/settings" style={{ color: '#00A651' }}>Settings</a> to connect it.
                </div>
                <button onClick={async () => {
                  try {
                    const r = await whatsappApi.status()
                    setWaBotReady(r.data.connected)
                    if (!r.data.connected) toast.error('Bot is still offline. Check Settings.')
                  } catch { toast.error('Could not reach bot.') }
                }} style={{
                  width: '100%', padding: '7px 12px', background: '#F7F8FA', border: '1px solid #E5E7EB',
                  borderRadius: 7, fontSize: 12, color: '#4B5563', cursor: 'pointer',
                }}>Check bot status</button>
              </div>
            ) : waGroupsLoading ? (
              <div style={{ fontSize: 11, color: '#9CA3AF', padding: '8px 0' }}>Loading your groups...</div>
            ) : waBotReady && waGroups.length === 0 ? (
              <div>
                <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 8 }}>Bot is online. Load your groups to connect one.</div>
                <button type="button" onClick={loadWaGroups} style={{
                  width: '100%', padding: '8px 12px', background: '#25D366', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Load my groups</button>
              </div>
            ) : (
              <form onSubmit={handleConnectWhatsapp}>
                {waGroups.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
                    No groups found.{' '}
                    <button type="button" onClick={loadWaGroups} style={{ background: 'none', border: 'none', color: '#00A651', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Retry</button>
                  </div>
                ) : (
                  <>
                    <select
                      value={waForm.whatsapp_group_id}
                      onChange={e => setWaForm(f => ({ ...f, whatsapp_group_id: e.target.value }))}
                      style={{
                        width: '100%', padding: '7px 10px', marginBottom: 6,
                        border: `1px solid ${usedGroupIds.includes(waForm.whatsapp_group_id) ? '#F59E0B' : '#E5E7EB'}`,
                        borderRadius: 6, fontSize: 12, outline: 'none', background: '#F7F8FA', boxSizing: 'border-box',
                      }}
                    >
                      <option value="">— Choose a group —</option>
                      {waGroups.map(g => (
                        <option key={g.id} value={g.id}>
                          {usedGroupIds.includes(g.id) ? '⚠ ' : ''}{g.name} ({g.participants} members){usedGroupIds.includes(g.id) ? ' — already used' : ''}
                        </option>
                      ))}
                    </select>
                    {usedGroupIds.includes(waForm.whatsapp_group_id) && (
                      <div style={{ fontSize: 11, color: '#92400E', background: '#FFF9E6', border: '1px solid #F59E0B', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>
                        This group is already connected to another fundraiser.
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  {waEditing && (
                    <button type="button" onClick={() => setWaEditing(false)} style={{
                      flex: 1, padding: '7px 0', background: 'none', border: '1px solid #E5E7EB',
                      borderRadius: 6, fontSize: 12, color: '#4B5563', cursor: 'pointer',
                    }}>Cancel</button>
                  )}
                  <button type="submit" disabled={waConnecting || !waForm.whatsapp_group_id} style={{
                    flex: 1, padding: '7px 0',
                    background: (waConnecting || !waForm.whatsapp_group_id) ? '#9CA3AF' : '#25D366',
                    color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: (waConnecting || !waForm.whatsapp_group_id) ? 'not-allowed' : 'pointer',
                  }}>{waConnecting ? 'Connecting...' : 'Connect'}</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 2, background: '#E5E7EB', borderRadius: 8, padding: 3 }}>
            {[
              { key: 'contributors', label: `Contributors (${contributors.length})` },
              { key: 'transactions', label: 'Transactions' },
              { key: 'info', label: 'Info' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none',
                background: tab === key ? '#fff' : 'transparent',
                color: tab === key ? '#1A1A2E' : '#9CA3AF',
                fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: 'pointer',
                boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>{label}</button>
            ))}
          </div>
          {summary.unmatched_transactions > 0 && (
            <button onClick={() => navigate(`/fundraisers/${id}/unmatched`)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', background: '#E53935', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <span>⚠</span>
              {summary.unmatched_transactions} Unmatched payment{summary.unmatched_transactions > 1 ? 's' : ''} — click to review
            </button>
          )}
        </div>

        {/* ── Contributors tab ── */}
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
                    {['Name', 'Phone', 'Pledge', 'Paid', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contributors.map(c => {
                    if (editingContributor === c.id) {
                      return (
                        <tr key={c.id} style={{ background: '#F0FFF4', borderBottom: '1px solid #BBF7D0' }}>
                          <td colSpan={6} style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                              <div style={{ flex: '2 1 140px' }}>
                                <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 3 }}>Full name</div>
                                <input value={editContribForm.full_name}
                                  onChange={e => setEditContribForm(f => ({ ...f, full_name: e.target.value }))}
                                  style={{ ...iStyle, borderColor: '#BBF7D0' }} />
                              </div>
                              <div style={{ flex: '1 1 100px' }}>
                                <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 3 }}>Pledge (KES)</div>
                                <input type="number" value={editContribForm.pledge_amount}
                                  onChange={e => setEditContribForm(f => ({ ...f, pledge_amount: e.target.value }))}
                                  style={{ ...iStyle, borderColor: '#BBF7D0' }} />
                              </div>
                              <div style={{ flex: '2 1 140px' }}>
                                <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 3 }}>Notes</div>
                                <input value={editContribForm.notes}
                                  onChange={e => setEditContribForm(f => ({ ...f, notes: e.target.value }))}
                                  placeholder="Optional"
                                  style={{ ...iStyle, borderColor: '#BBF7D0' }} />
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => handleSaveContributor(c.id)} disabled={editContribSaving} style={{
                                  padding: '8px 14px', background: editContribSaving ? '#9CA3AF' : '#00A651',
                                  color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                  cursor: editContribSaving ? 'not-allowed' : 'pointer',
                                }}>{editContribSaving ? '...' : 'Save'}</button>
                                <button onClick={() => setEditingContributor(null)} style={{
                                  padding: '8px 12px', background: 'none', border: '1px solid #E5E7EB',
                                  borderRadius: 6, fontSize: 12, color: '#4B5563', cursor: 'pointer',
                                }}>Cancel</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    if (deletingContributor === c.id) {
                      return (
                        <tr key={c.id} style={{ background: '#FFF5F5', borderBottom: '1px solid #FECACA' }}>
                          <td colSpan={6} style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 13, color: '#E53935' }}>
                                Remove <strong>{c.full_name}</strong>? This cannot be undone.
                              </span>
                              <button onClick={() => handleDeleteContributor(c.id)} style={{
                                padding: '6px 14px', background: '#E53935', color: '#fff',
                                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              }}>Yes, remove</button>
                              <button onClick={() => setDeletingContributor(null)} style={{
                                padding: '6px 12px', background: 'none', border: '1px solid #E5E7EB',
                                borderRadius: 6, fontSize: 12, color: '#4B5563', cursor: 'pointer',
                              }}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
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
                          <div style={{ display: 'flex', gap: 5 }}>
                            {c.pledge_status !== 'complete' && c.pledge_status !== 'overpaid' && (
                              <button onClick={() => handleRemind(c.id)} style={{
                                padding: '4px 9px', background: 'none', border: '1px solid #E5E7EB',
                                borderRadius: 5, fontSize: 11, color: '#4B5563', cursor: 'pointer',
                              }}>Remind</button>
                            )}
                            <button onClick={() => startEditContributor(c)} style={{
                              padding: '4px 9px', background: 'none', border: '1px solid #E5E7EB',
                              borderRadius: 5, fontSize: 11, color: '#4B5563', cursor: 'pointer',
                            }}>Edit</button>
                            <button onClick={() => { setDeletingContributor(c.id); setEditingContributor(null) }} style={{
                              padding: '4px 9px', background: 'none', border: '1px solid #FECACA',
                              borderRadius: 5, fontSize: 11, color: '#E53935', cursor: 'pointer',
                            }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Transactions tab ── */}
        {tab === 'transactions' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            {txLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No transactions yet.</div>
            ) : (
              <>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#4B5563' }}>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
                  <button onClick={loadTransactions} style={{ background: 'none', border: 'none', fontSize: 11, color: '#00A651', cursor: 'pointer' }}>↻ Refresh</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #E5E7EB' }}>
                      {['Date', 'M-Pesa ID', 'Sender', 'Amount', 'Matched to', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const badge = MATCH_BADGE[tx.match_status] || MATCH_BADGE.unmatched
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#4B5563', whiteSpace: 'nowrap' }}>
                            {new Date(tx.received_at).toLocaleDateString('en-KE')}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>
                            {tx.mpesa_transaction_id}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>{tx.mpesa_sender_name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{tx.mpesa_sender_phone}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#00A651', whiteSpace: 'nowrap' }}>
                            KES {tx.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: tx.contributor ? '#1A1A2E' : '#9CA3AF' }}>
                            {tx.contributor?.full_name || '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {tx.match_status === 'unmatched' ? (
                              <Link to={`/fundraisers/${id}/unmatched`} style={{
                                padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                                background: badge.bg, color: badge.color, textDecoration: 'none',
                              }}>Match →</Link>
                            ) : (
                              <span style={{
                                padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                                background: badge.bg, color: badge.color,
                              }}>{badge.label}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── Info tab ── */}
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
