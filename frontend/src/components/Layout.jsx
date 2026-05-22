import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  Tags,
  BarChart3,
  LogOut,
  Menu,
  X,
  Wallet,
} from 'lucide-react'

function SidebarItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        sidebar-item
        ${isActive ? 'sidebar-item-active' : ''}
      `}
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <div
        style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--color-gray-200)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Wallet size={24} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-gray-900)',
                lineHeight: 1.25,
              }}
            >
              Smart Expense
            </h1>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-gray-500)',
              }}
            >
              Track & Manage
            </p>
          </div>
        </div>
      </div>

      <nav
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          flex: 1,
        }}
      >
        <SidebarItem
          to="/"
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={() => setMobileMenuOpen(false)}
        />
        <SidebarItem
          to="/expenses"
          icon={Receipt}
          label="Expenses"
          onClick={() => setMobileMenuOpen(false)}
        />
        <SidebarItem
          to="/categories"
          icon={Tags}
          label="Categories"
          onClick={() => setMobileMenuOpen(false)}
        />
        <SidebarItem
          to="/analytics"
          icon={BarChart3}
          label="Analytics"
          onClick={() => setMobileMenuOpen(false)}
        />
      </nav>

      <div
        style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--color-gray-200)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-gray-50)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-600)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 500,
                color: 'var(--color-gray-900)',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name}
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-gray-500)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%' }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Wallet size={20} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
            Smart Expense
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-button"
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`mobile-sidebar ${mobileMenuOpen ? 'mobile-sidebar-open' : ''}`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
