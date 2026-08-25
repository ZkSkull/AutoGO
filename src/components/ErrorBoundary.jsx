import React from 'react';
import * as Sentry from '@sentry/react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    try { Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } }); } catch { /* noop */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          textAlign: 'center', background: '#0D0D0D', color: '#fff'
        }}>
          <i className="fa-solid fa-gear fa-spin" style={{ fontSize: '3rem', color: '#E11A2C', marginBottom: '1.5rem' }} />
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>
            Algo deu errado
          </h1>
          <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: '2rem', maxWidth: 400 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '.7rem 2rem', background: '#E11A2C', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '1rem'
            }}
          >
            <i className="fa-solid fa-rotate" style={{ marginRight: '.5rem' }} />
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}