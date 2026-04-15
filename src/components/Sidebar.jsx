import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import logo from "../assets/images/logo-auto-go-branco.png";

export default function Sidebar({ items, active, onNav, storeName, initials, role, sidebarOpen, setSidebarOpen }) {
  const { logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 199, display: 'none' }}
          className="sidebar-mobile-overlay"
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <a
            className="logo"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <img src={logo} alt="AutoGO" className="sidebar-logo-img" />
          </a>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Profile */}
        <div className="sidebar-store">
          <div className={`store-avatar ${role === 'client' || role === 'driver' ? 'gray' : ''}`}>
            {role === 'merchant' ? <i className="fa-solid fa-store" /> :
              role === 'driver' ? <i className="fa-solid fa-motorcycle" /> :
                <i className="fa-solid fa-user" />}
          </div>
          <div className="store-info">
            <strong>{storeName}</strong>
            <span className="store-badge">
              <i className="fa-solid fa-circle-check" />
              {role === 'merchant' ? 'Comerciante' : role === 'driver' ? 'Entregador' : 'Cliente'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {items.map(item => (
            <button
              key={item.page}
              className={`nav-item${active === item.page ? ' active' : ''}`}
              onClick={() => { onNav(item.page); setSidebarOpen(false); }}
            >
              <i className={item.icon} />
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="nav-item nav-logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}