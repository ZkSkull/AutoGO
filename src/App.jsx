import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Toast from './components/Toast';

import Home         from './pages/Home/Home';
import Auth         from './pages/Auth/Auth';
import Categorias   from './pages/Categorias/Categorias';
import Lojas        from './pages/Lojas/Lojas';
import Marcas       from './pages/Marcas/Marcas';
import ComoFunciona from './pages/ComoFunciona/ComoFunciona';
import Produto      from './pages/Produto/Produto';
import NotFound     from './pages/NotFound/NotFound';
import Client       from './pages/Client/Client';
import Merchant     from './pages/Merchant/Merchant';
import Driver       from './pages/Driver/Driver';

function LoadingScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--black)', gap:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
        <i className="fa-solid fa-gear fa-spin" style={{ fontSize:'2rem', color:'var(--red)' }} />
        <span style={{ fontFamily:'var(--font-head)', fontSize:'2rem', fontWeight:900, color:'#fff' }}>
          Peça<span style={{ color:'var(--red)' }}>Rápida</span>
        </span>
      </div>
      <p style={{ color:'rgba(255,255,255,.4)', fontSize:'.9rem' }}>Carregando...</p>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useApp();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/auth" replace />;
  if (role && profile && profile.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, profile, loading } = useApp();
  if (loading) return <LoadingScreen />;

  const authRedirect = user && profile
    ? <Navigate to={
        profile.role === 'merchant' ? '/merchant' :
        profile.role === 'driver'   ? '/driver'   : '/client'
      } replace />
    : <Auth />;

  return (
    <>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/categorias"    element={<Categorias />} />
        <Route path="/lojas"         element={<Lojas />} />
        <Route path="/marcas"        element={<Marcas />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
        <Route path="/produto/:id"   element={<Produto />} />
        <Route path="/auth"          element={authRedirect} />
        <Route path="/client"        element={<ProtectedRoute><Client /></ProtectedRoute>} />
        <Route path="/merchant"      element={<ProtectedRoute role="merchant"><Merchant /></ProtectedRoute>} />
        <Route path="/driver"        element={<ProtectedRoute role="driver"><Driver /></ProtectedRoute>} />
        <Route path="*"              element={<NotFound />} />
      </Routes>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}