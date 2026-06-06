import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⊞' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const { organizer, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: '#00A651',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16,
            }}>P</div>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Pochi</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px',
                borderRadius: 8,
                margin: '2px 8px',
                background: pathname === item.path ? 'rgba(0,166,81,0.15)' : 'transparent',
                color: pathname === item.path ? '#00A651' : '#9CA3AF',
                fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                <span>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{organizer?.full_name}</div>
            <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>{organizer?.phone_number}</div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#9CA3AF',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            cursor: 'pointer',
            width: '100%',
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
