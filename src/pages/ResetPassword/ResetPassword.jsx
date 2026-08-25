import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../lib/api';
import './ResetPassword.css';
import logo from '../../assets/images/logo-auto-go-branco.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, showToast } = useApp();

  const recovery = params.get('type') === 'recovery';

  const [pw, setPw] = useState('');
  const [conf, setConf] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.length < 8) { setError('Senha mínima de 8 caracteres.'); return; }
    if (pw !== conf) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      await authApi.updatePassword(pw);
      setDone(true);
      showToast('Senha redefinida com sucesso!', 'success');
    } catch (err) {
      setError(err.message === 'New password should be different from the old password.'
        ? 'A nova senha deve ser diferente da atual.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!recovery && !user) {
    return (
      <div className="rp-layout">
        <div className="rp-card">
          <img src={logo} alt="AutoGO" className="rp-logo" />
          <i className="fa-solid fa-lock" style={{ fontSize: '2.5rem', color: 'var(--red)', display: 'block', margin: '1rem 0' }} />
          <h2>Link inválido</h2>
          <p style={{ color: 'var(--gray-400)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
            Este link de redefinição não é válido. Solicite um novo na tela de login.
          </p>
          <button className="btn btn-primary btn-full" onClick={() => navigate('/auth')}>Ir para o login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-layout">
      <div className="rp-card">
        <img src={logo} alt="AutoGO" className="rp-logo" />

        {done ? (
          <>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '2.5rem', color: 'var(--green)', display: 'block', margin: '1rem 0' }} />
            <h2>Senha redefinida!</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
              Sua senha foi atualizada. Faça login com a nova senha.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/auth')}>Ir para o login</button>
          </>
        ) : (
          <>
            <div className="rp-icon-wrap"><i className="fa-solid fa-lock" /></div>
            <h2>Definir nova senha</h2>
            <p className="rp-desc">Escolha uma nova senha para sua conta.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nova senha</label>
                <input type="password" placeholder="Mín. 8 caracteres" value={pw} onChange={e => setPw(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirmar nova senha</label>
                <input type="password" placeholder="Repita a senha" value={conf} onChange={e => setConf(e.target.value)} required />
              </div>
              {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Salvando…</> : <><i className="fa-solid fa-check" /> Redefinir senha</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
