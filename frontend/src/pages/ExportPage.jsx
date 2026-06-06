import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { fundraiserApi } from '../services/api'

export default function ExportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fundraiser, setFundraiser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    fundraiserApi.get(id)
      .then(r => setFundraiser(r.data))
      .catch(() => toast.error('Failed to load fundraiser.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async (type) => {
    setDownloading(type)
    try {
      const res = type === 'pdf'
        ? await fundraiserApi.exportPdf(id)
        : await fundraiserApi.exportExcel(id)

      const ext = type === 'pdf' ? 'pdf' : 'xlsx'
      const mimeType = type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }))
      const a = document.createElement('a')
      a.href = url
      a.download = `pochi-${fundraiser.account_reference}.${ext}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`${type.toUpperCase()} downloaded!`)
    } catch (err) {
      toast.error(`Failed to export ${type.toUpperCase()}.`)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <Layout><div style={{ padding: 32, color: '#9CA3AF' }}>Loading...</div></Layout>
  if (!fundraiser) return <Layout><div style={{ padding: 32, color: '#E53935' }}>Not found.</div></Layout>

  return (
    <Layout>
      <div style={{ padding: '28px 32px', maxWidth: 560 }}>
        <button onClick={() => navigate(`/fundraisers/${id}`)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: 13, padding: 0, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>← Fundraiser</button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>Export Ledger</h1>
        <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 24 }}>{fundraiser.title}</p>

        <div style={{ display: 'grid', gap: 14 }}>
          {/* PDF */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, background: '#FEF2F2',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>PDF Ledger</div>
                <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5, marginBottom: 12 }}>
                  Formatted ledger with contributor list, totals, and progress. Good for printing or sharing.
                </div>
                <button onClick={() => handleDownload('pdf')} disabled={downloading === 'pdf'} style={{
                  padding: '8px 16px',
                  background: downloading === 'pdf' ? '#9CA3AF' : '#1A1A2E',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 600, cursor: downloading === 'pdf' ? 'not-allowed' : 'pointer',
                }}>
                  {downloading === 'pdf' ? 'Generating...' : '↓ Download PDF'}
                </button>
              </div>
            </div>
          </div>

          {/* Excel */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, background: '#E8F8EF',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>📊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>Excel Spreadsheet</div>
                <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5, marginBottom: 12 }}>
                  Full data export with contributors and transactions sheets. Good for further analysis.
                </div>
                <button onClick={() => handleDownload('excel')} disabled={downloading === 'excel'} style={{
                  padding: '8px 16px',
                  background: downloading === 'excel' ? '#9CA3AF' : '#00A651',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 600, cursor: downloading === 'excel' ? 'not-allowed' : 'pointer',
                }}>
                  {downloading === 'excel' ? 'Generating...' : '↓ Download Excel'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 20, padding: '12px 14px',
          background: '#F7F8FA', border: '1px solid #E5E7EB', borderRadius: 10,
          fontSize: 12, color: '#4B5563', lineHeight: 1.5,
        }}>
          <strong style={{ color: '#1A1A2E' }}>What's included:</strong> All contributors with pledge amounts and paid amounts · All confirmed M-Pesa transactions · Matched and unmatched status · Progress summary
        </div>
      </div>
    </Layout>
  )
}
