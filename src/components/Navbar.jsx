import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Navbar.css';
import logo from "../assets/images/logo-auto-go-branco.png";

const NAV_LINKS = [
  { label: 'Início',        path: '/'              },
  { label: 'Categorias',    path: '/categorias'    },
  { label: 'Lojas',         path: '/lojas'         },
  { label: 'Marcas',        path: '/marcas'        },
  { label: 'Como Funciona', path: '/como-funciona' },
  { label: 'Entregador',    path: '/driver'        },
];

export default function Navbar({ transparent = false }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { cartTotal, user, profile, logout } = useApp();
  const [scrolled, setScrolled] = useState(!transparent);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!transparent) { 
      setScrolled(true); 
      return; 
    }
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, [transparent]);

  const isActive = (path) => location.pathname === path;

  const handleDashboard = () => {
    if (!user) { 
      navigate('/auth'); 
      return; 
    }
    const role = profile?.role || user?.role || user?.type;
    if (role === 'merchant') navigate('/merchant');
    else if (role === 'driver') navigate('/driver');
    else navigate('/client');
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="container navbar-inner">

          {/* Logo */}
          <a
            className="logo"
            href=""
            onClick={e => {
              e.preventDefault();
              navigate('/');
              setMobileOpen(false);
            }}
          >
            <img src={logo} alt="AutoGO" className="logo-img" />
          </a>

          {/* Desktop links */}
          <div className="navbar-links">
            {NAV_LINKS.map(link => (
              <a
                key={link.path}
                href={link.path}
                className={`navbar-link${isActive(link.path) ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); navigate(link.path); }}
              >
                {link.label}
                {isActive(link.path) && <span className="navbar-link-dot" />}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Cart */}
            <button className="navbar-cart-btn" onClick={() => navigate('/client')}>
              <i className="fa-solid fa-cart-shopping" />
              {cartTotal > 0 && <span className="navbar-cart-count">{cartTotal}</span>}
            </button>

            {user ? (
              <>
                <button className="btn btn-primary navbar-btn-sm" onClick={handleDashboard}>
                  <i className="fa-solid fa-grid-2" /> Painel
                </button>
                <button className="btn btn-outline navbar-btn-sm" onClick={logout} title="Sair da conta">
                  <i className="fa-solid fa-right-from-bracket" /> Sair
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-outline navbar-btn-sm" onClick={() => navigate('/auth')}>
                  Entrar
                </button>
                <button className="btn btn-primary navbar-btn-sm" onClick={() => navigate('/auth?mode=register')}>
                  Cadastrar
                </button>
              </>
            )}

            {/* Burger */}
            <button className="navbar-burger" onClick={() => setMobileOpen(v => !v)}>
              <i className={`fa-solid fa-${mobileOpen ? 'xmark' : 'bars'}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="navbar-mobile-menu">
            {NAV_LINKS.map(link => (
              <a
                key={link.path}
                href={link.path}
                className={`mobile-link${isActive(link.path) ? ' active' : ''}`}
                onClick={e => {
                  e.preventDefault();
                  navigate(link.path);
                  setMobileOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}

            <div className="mobile-actions">
              {user ? (
                <>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => {
                      handleDashboard();
                      setMobileOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-grid-2" /> Ir para o Painel
                  </button>
                  <button
                    className="btn btn-outline btn-full"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket" /> Sair da conta
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-outline btn-full"
                    onClick={() => {
                      navigate('/auth');
                      setMobileOpen(false);
                    }}
                  >
                    Entrar
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => {
                      navigate('/auth?mode=register');
                      setMobileOpen(false);
                    }}
                  >
                    Cadastrar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Espaçamento */}
      <div className={`navbar-spacer${transparent ? ' transparent' : ''}`} />
    </>
  );
}