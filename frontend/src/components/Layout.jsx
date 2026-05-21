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
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        color: isActive ? 'var(--color-primary-700)' : 'var(--color-gray-600)',
        backgroundColor: isActive ? 'var(--color-primary-50)' : 'transparent',
        fontWeight: isActive ? 500 : 400,
        transition: 'all var(--transition-fast)',
        textDecoration: 'none',
      })}
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: 'white',
          borderRight: '1px solid var(--color-gray-200)',
          display: 'none',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          '@media (min-width: 1024px)': {
            display: 'flex',
          },
        }}
        className="desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--header-height)',
          background: 'white',
          borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          zIndex: 40,
        }}
        className="mobile-header"
      >
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
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            color: 'var(--color-gray-600)',
          }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 45,
            display: 'block',
          }}
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          background: 'white',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-base)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
        className="mobile-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: 0,
          paddingTop: 'var(--header-height)',
          minHeight: '100vh',
        }}
        className="main-content"
      >
        <div
          style={{
            padding: 'var(--space-6)',
          }}
        >
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex !important;
          }
          .mobile-header,
          .mobile-overlay,
          .mobile-sidebar {
            display: none !important;
          }
          .main-content {
            margin-left: var(--sidebar-width);
            padding-top: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout
