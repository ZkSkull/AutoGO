import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'var(--gray-100)', textAlign: 'center', padding: '2rem'
    }}>
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: '8rem',
        fontWeight: 900, color: 'var(--gray-200)', lineHeight: 1
      }}>
        404
      </div>
      <i className="fa-solid fa-gear" style={{
        fontSize: '3rem', color: 'var(--red)', margin: '1rem 0'
      }} />
      <h2 style={{
        fontFamily: 'var(--font-head)', fontSize: '2rem',
        fontWeight: 900, marginBottom: '.8rem'
      }}>
        Página não encontrada
      </h2>
      <p style={{ color: 'var(--gray-400)', marginBottom: '2rem', maxWidth: 380 }}>
        A página que você procura não existe ou foi movida.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <i className="fa-solid fa-house" /> Ir para o início
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/client')}>
          <i className="fa-solid fa-shop" /> Ver produtos
        </button>
      </div>
    </div>
  );
}