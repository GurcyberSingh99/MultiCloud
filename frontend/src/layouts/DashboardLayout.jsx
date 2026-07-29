import { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GridScan from '../components/GridScan';
import ElectricBorder from '../components/ElectricBorder';
import './DashboardLayout.css';

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/vms', icon: '🖥️', label: 'Virtual Machines' },
  { path: '/storage', icon: '💾', label: 'Storage' },
  { path: '/billing', icon: '💰', label: 'Billing & Costs' },
  { path: '/monitoring', icon: '📈', label: 'Monitoring' },
  { path: '/alerts', icon: '🔔', label: 'Alerts' },
  { path: '/analytics', icon: '📉', label: 'Analytics' },
  { path: '/credentials', icon: '🔑', label: 'Cloud API Keys' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname);

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* GridScan Dynamic Background */}
      <div className="gridscan-background-wrapper">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#2F293A"
          gridScale={0.09}
          scanColor="#2d3cd9"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
        />
      </div>

      {/* Sidebar with ElectricBorder */}
      <aside className="sidebar">
        <ElectricBorder color="#818cf8" speed={1} chaos={0.12} borderRadius={16}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <span className="logo-icon"></span>
              {!sidebarCollapsed && <span className="logo-text">CloudPilot</span>}
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <Link to="/credentials" className="cloud-status" style={{ textDecoration: 'none', color: 'inherit' }} title="Manage Cloud API Keys">
              {!sidebarCollapsed && <span className="text-sm text-muted">Cloud Keys</span>}
              <div className="status-dots">
                <span className="status-dot aws" title="AWS Configured">●</span>
                <span className="status-dot azure" title="Azure Configured">●</span>
                <span className="status-dot gcp" title="GCP Configured">●</span>
              </div>
            </Link>
          </div>
        </ElectricBorder>
      </aside>




      {/* Main Content Area */}
      <div className="main-area">
        {/* Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="header-title">{currentPage?.label || 'Dashboard'}</h2>
          </div>
          <div className="header-right">
            <div className="header-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search resources..."
              />
            </div>
            <button className="header-notifications" title="Notifications">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <div className="header-user">
              <div className="user-avatar">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              {user && (
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              )}
              <button className="btn btn-sm btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
