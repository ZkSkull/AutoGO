import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './Auth.css';

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register, showToast } = useApp();

  const [mode,     setMode]     = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [userType, setUserType] = useState(params.get('type') || 'client');
  const [showPw,   setShowPw]   = useState(false);
  const [pwStr,    setPwStr]    = useState({ width: '0%', color: '#888', label: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [email, setEmail]     = useState('');
  const [pw,    setPw]        = useState('');
  const [name,  setName]      = useState('');
  const [phone, setPhone]     = useState('');
  const [storeName, setStoreName] = useState('');
  const [cnpj,  setCnpj]      = useState('');
  const [addr,  setAddr]      = useState('');
  const [cpf,   setCpf]       = useState('');
  const [vehicleType, setVehicleType] = useState('moto');
  const [regPw, setRegPw]     = useState('');
  const [confPw,setConfPw]    = useState('');
  const [agreed,setAgreed]    = useState(false);

  const checkStrength = (val) => {
    let score = 0;
    if (val.length >= 8)           score++;
    if (/[A-Z]/.test(val))         score++;
    if (/[0-9]/.test(val))         score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const lvl = [
      { width: '25%',  color: '#EF4444', label: 'Fraca'     },
      { width: '50%',  color: '#F97316', label: 'Razoável'  },
      { width: '75%',  color: '#EAB308', label: 'Boa'       },
      { width: '100%', color: '#22C55E', label: 'Excelente' },
    ];
    setPwStr(lvl[score - 1] || { width: '0%', color: '#888', label: '' });
    setRegPw(val);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !pw) { setError('Preencha todos os campos.'); return; }
    setLoading(true);
    try {
      await login(email, pw);
      showToast('Login realizado com sucesso!', 'success');
      setTimeout(() => {
        if (userType === 'merchant') navigate('/merchant');
        else if (userType === 'driver') navigate('/driver');
        else navigate('/client');
      }, 500);
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regPw !== confPw) { setError('As senhas não coincidem.'); return; }
    if (regPw.length < 8) { setError('Senha mínima de 8 caracteres.'); return; }
    if (!agreed)          { setError('Aceite os termos para continuar.'); return; }
    setLoading(true);
    try {
      await register({ email, password: regPw, name: userType === 'merchant' ? storeName : name, role: userType, phone, cpf, storeName, cnpj, address: addr, vehicleType });
      showToast('Conta criada! Verifique seu e-mail para confirmar.', 'success');
      setMode('login');
    } catch (err) {
      setError(err.message.includes('already registered') ? 'E-mail já cadastrado.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (val) => {
    let v = val.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    setPhone(v);
  };

  const TYPE_TABS = [
    { key: 'client',   label: 'Cliente',     icon: 'fa-user'       },
    { key: 'merchant', label: 'Comerciante', icon: 'fa-store'      },
    { key: 'driver',   label: 'Entregador',  icon: 'fa-motorcycle' },
  ];

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-inner">
          <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
            <span className="logo-icon"><i className="fa-solid fa-gear" /></span>
            <span>Peça<span className="logo-red">Rápida</span></span>
          </a>
          <div className="auth-tagline">
            <h2>Autopeças<br />na velocidade<br />certa.</h2>
            <p>+12.000 produtos, +340 lojas, entrega expressa.</p>
          </div>
          <div className="auth-features">
            {[['fa-shield-halved','Compra 100% segura'],['fa-truck-fast','Entrega expressa'],['fa-rotate-left','Garantia na compra']].map(([icon, label]) => (
              <div key={icon} className="auth-feat"><i className={`fa-solid ${icon}`} /> {label}</div>
            ))}
          </div>
          <div className="auth-bg-glyph"><i className="fa-solid fa-gear" /></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-type-tabs">
            {TYPE_TABS.map(t => (
              <button key={t.key} className={`type-tab${userType === t.key ? ' active' : ''}`} onClick={() => setUserType(t.key)}>
                <i className={`fa-solid ${t.icon}`} /> {t.label}
              </button>
            ))}
          </div>
          <div className="auth-tabs">
            <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Entrar</button>
            <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>Cadastrar</button>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <h3 className="form-title">Bem-vindo de volta!</h3>
              <div className="form-group"><label>E-mail</label><div className="input-wrap"><i className="fa-solid fa-envelope inp-icon" /><input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
              <div className="form-group"><label>Senha</label><div className="input-wrap"><i className="fa-solid fa-lock inp-icon" /><input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} required /><button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}><i className={`fa-solid fa-eye${showPw ? '-slash' : ''}`} /></button></div></div>
              <a href="#" className="auth-forgot">Esqueci minha senha</a>
              {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Entrando…</> : <>Entrar <i className="fa-solid fa-arrow-right" /></>}
              </button>
              <div className="auth-divider"><span>ou continue com</span></div>
              <div className="social-row">
                <button type="button" className="btn-social" onClick={() => showToast('Em breve!','info')}><i className="fa-brands fa-google" /> Google</button>
                <button type="button" className="btn-social" onClick={() => showToast('Em breve!','info')}><i className="fa-brands fa-facebook" /> Facebook</button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              <h3 className="form-title">Criar conta</h3>

              {userType === 'client' && (<>
                <div className="form-group"><label>Nome completo</label><div className="input-wrap"><i className="fa-solid fa-user inp-icon" /><input type="text" placeholder="João Silva" value={name} onChange={e => setName(e.target.value)} required /></div></div>
                <div className="form-group"><label>Telefone</label><div className="input-wrap"><i className="fa-solid fa-phone inp-icon" /><input type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => maskPhone(e.target.value)} /></div></div>
              </>)}

              {userType === 'merchant' && (<>
                <div className="form-group"><label>Nome da loja</label><div className="input-wrap"><i className="fa-solid fa-store inp-icon" /><input type="text" placeholder="Auto Peças Silva" value={storeName} onChange={e => setStoreName(e.target.value)} required /></div></div>
                <div className="form-row">
                  <div className="form-group"><label>CNPJ</label><div className="input-wrap"><i className="fa-solid fa-id-card inp-icon" /><input type="text" placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} /></div></div>
                  <div className="form-group"><label>Telefone</label><div className="input-wrap"><i className="fa-solid fa-phone inp-icon" /><input type="tel" value={phone} onChange={e => maskPhone(e.target.value)} /></div></div>
                </div>
                <div className="form-group"><label>Endereço</label><div className="input-wrap"><i className="fa-solid fa-location-dot inp-icon" /><input type="text" placeholder="Rua das Peças, 100 — São Paulo, SP" value={addr} onChange={e => setAddr(e.target.value)} /></div></div>
              </>)}

              {userType === 'driver' && (<>
                <div className="form-group"><label>Nome completo</label><div className="input-wrap"><i className="fa-solid fa-user inp-icon" /><input type="text" placeholder="Lucas Motta" value={name} onChange={e => setName(e.target.value)} required /></div></div>
                <div className="form-row">
                  <div className="form-group"><label>CPF</label><div className="input-wrap"><i className="fa-solid fa-id-card inp-icon" /><input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} /></div></div>
                  <div className="form-group"><label>Telefone</label><div className="input-wrap"><i className="fa-solid fa-phone inp-icon" /><input type="tel" value={phone} onChange={e => maskPhone(e.target.value)} /></div></div>
                </div>
                <div className="form-group"><label>Veículo</label><select value={vehicleType} onChange={e => setVehicleType(e.target.value)}><option value="moto">Moto</option><option value="bike">Bicicleta</option><option value="car">Carro</option><option value="van">Van</option></select></div>
              </>)}

              <div className="form-group"><label>E-mail</label><div className="input-wrap"><i className="fa-solid fa-envelope inp-icon" /><input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
              <div className="form-group">
                <label>Senha</label>
                <div className="input-wrap"><i className="fa-solid fa-lock inp-icon" /><input type={showPw ? 'text' : 'password'} placeholder="Mín. 8 caracteres" value={regPw} onChange={e => checkStrength(e.target.value)} required /><button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}><i className={`fa-solid fa-eye${showPw ? '-slash' : ''}`} /></button></div>
                {regPw && <><div className="pw-strength"><div className="pw-bar" style={{ width: pwStr.width, background: pwStr.color }} /></div><div className="pw-label" style={{ color: pwStr.color }}>{pwStr.label}</div></>}
              </div>
              <div className="form-group"><label>Confirmar senha</label><div className="input-wrap"><i className="fa-solid fa-lock inp-icon" /><input type="password" placeholder="Repita a senha" value={confPw} onChange={e => setConfPw(e.target.value)} required /></div></div>
              <div className="form-check"><input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} /><label htmlFor="terms">Concordo com os <a href="#">Termos</a> e <a href="#">Privacidade</a></label></div>
              {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Criando…</> : <>Criar conta <i className="fa-solid fa-arrow-right" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}