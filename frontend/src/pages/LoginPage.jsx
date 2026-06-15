import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/auth.store'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [step, setStep] = useState('identifier')
  const [identifier, setIdentifier] = useState('')
  const [resolvedPhone, setResolvedPhone] = useState('') // phone returned by requestOtp, used for verify
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    const val = identifier.trim()
    if (!val) return toast.error('Enter your email or phone number.')
    const isEmail = val.includes('@')
    setLoading(true)
    try {
      const payload = isEmail ? { email: val } : { phone_number: val }
      const res = await authApi.requestOtp(payload)
      setResolvedPhone(res.data.phone_number) // always use the phone returned by server for verify
      toast.success('OTP sent to your email.')
      setStep('otp')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp.trim()) return toast.error('Enter the OTP.')
    setLoading(true)
    try {
      const res = await authApi.verifyOtp({ phone_number: resolvedPhone, otp })
      setAuth(res.data.token, res.data.organizer)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: '#00A651',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 24,
            margin: '0 auto 12px',
          }}>P</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Sign in to Pochi</h1>
          <p style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>Keep your Paybill. Keep your WhatsApp group.</p>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 24,
        }}>
          {step === 'identifier' ? (
            <form onSubmit={handleRequestOtp}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#4B5563', marginBottom: 6 }}>
                  Email or phone number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="you@example.com or 07XX XXX XXX"
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #E5E7EB', borderRadius: 8,
                    fontSize: 14, outline: 'none',
                    background: '#F7F8FA', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  We'll send a one-time code to the email on your account.
                </p>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 12,
                background: loading ? '#9CA3AF' : '#00A651',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => { setStep('identifier'); setOtp('') }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, padding: 0,
                }}>←</button>
                <span style={{ fontSize: 13, color: '#4B5563' }}>OTP sent to your email on file</span>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#4B5563', marginBottom: 6 }}>
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #E5E7EB', borderRadius: 8,
                    fontSize: 20, letterSpacing: 8, textAlign: 'center',
                    outline: 'none', background: '#F7F8FA', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>OTP expires in 10 minutes</p>
              </div>
              <button type="submit" disabled={loading || otp.length < 6} style={{
                width: '100%', padding: 12,
                background: (loading || otp.length < 6) ? '#9CA3AF' : '#00A651',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#4B5563', marginTop: 16 }}>
          New to Pochi? <Link to="/signup" style={{ color: '#00A651', textDecoration: 'none', fontWeight: 500 }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
