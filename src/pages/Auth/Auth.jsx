import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../lib/api';
import { loginSchema, registerSchema, forgotSchema, firstIssue } from '../../lib/validation';
import './Auth.css';
import logo from '../../assets/images/logo-auto-go-branco.png';

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register, showToast } = useApp();

  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');

  // Cadastro: passo 1 = escolha de tipo, passo 2 = formulário
  const [regStep, setRegStep] = useState(1);
  const [userType, setUserType] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [pwStr, setPwStr] = useState({ width: '0%', color: '#888', label: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Campos compartilhados (login e cadastro)
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  // Campos de cadastro
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [addr, setAddr] = useState('');
  const [cpf, setCpf] = useState('');
  const [vehicleType, setVehicleType] = useState('moto');
  const [regPw, setRegPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Esqueci senha
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // ── Helpers ──────────────────────────────────────────────────
  const checkStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const lvl = [
      { width: '25%', color: '#EF4444', label: 'Fraca' },
      { width: '50%', color: '#F97316', label: 'Razoável' },
      { width: '75%', color: '#EAB308', label: 'Boa' },
      { width: '100%', color: '#22C55E', label: 'Excelente' },
    ];
    setPwStr(lvl[score - 1] || { width: '0%', color: '#888', label: '' });
    setRegPw(val);
  };

  const maskPhone = (val) => {
    let v = val.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    setPhone(v);
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    if (m === 'register') { setRegStep(1); setUserType(''); }
  };

  // ── Login universal — redireciona pelo role salvo no banco ───
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const check = loginSchema.safeParse({ email, password: pw });
    if (!check.success) { setError(firstIssue(check)); return; }
    setLoading(true);
    try {
      const data = await login(email, pw);
      const prof = await authApi.getProfile(data.user.id);

      showToast('Login realizado com sucesso!', 'success');
      setTimeout(() => {
        const role = prof.role || 'client';
        if (role === 'merchant') navigate('/merchant');
        else if (role === 'driver') navigate('/driver');
        else navigate('/client');
      }, 400);
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cadastro ─────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const check = registerSchema.safeParse({
      name,
      storeName,
      phone,
      cpf,
      cnpj,
      address: addr,
      email,
      password: regPw,
      confirm: confPw,
      agreed,
    });
    if (!check.success) { setError(firstIssue(check)); return; }
    setLoading(true);
    try {
      await register({
        email, password: regPw,
        name: userType === 'merchant' ? storeName : name,
        role: userType, phone, cpf, storeName, cnpj, address: addr, vehicleType,
      });
      showToast('Conta criada! Verifique seu e-mail para confirmar.', 'success');
      switchMode('login');
    } catch (err) {
      setError(err.message.includes('already registered') ? 'E-mail já cadastrado.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Esqueci senha ─────────────────────────────────────────────
  const handleForgot = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setForgotError('');
    const check = forgotSchema.safeParse({ email: forgotEmail });
    if (!check.success) { setForgotError(firstIssue(check)); return; }
    setForgotLoading(true);
    try {
      await authApi.resetPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      setForgotError('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Cards de tipo de conta ────────────────────────────────────
  const TYPE_CARDS = [
    { key: 'client', icon: 'fa-user', label: 'Cliente', desc: 'Compre autopeças com entrega rápida' },
    { key: 'merchant', icon: 'fa-store', label: 'Comerciante', desc: 'Venda seus produtos para milhares de clientes' },
    { key: 'driver', icon: 'fa-motorcycle', label: 'Entregador', desc: 'Faça entregas e ganhe dinheiro' },
  ];

  const activeCard = TYPE_CARDS.find(t => t.key === userType);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="auth-layout">

      {/* ── LADO ESQUERDO ── */}
      <div className="auth-left">
        <div className="auth-left-inner">

          <div className="auth-header">
            <img src={logo} alt="AutoGO" className="auth-logo-img" />

            <div className="auth-tagline">
              <h2 className="auth-title">
                AUTOPEÇAS <br />
                NA VELOCIDADE <br />
                CERTA.
              </h2>

              <p className="auth-sub">
                +12.000 produtos, +340 lojas, entrega expressa.
              </p>
            </div>
          </div>

          <div className="auth-features">
            <div className="auth-feat">
              <i className="fa-solid fa-shield-halved" />
              Compra 100% segura
            </div>
            <div className="auth-feat">
              <i className="fa-solid fa-truck-fast" />
              Entrega expressa
            </div>
            <div className="auth-feat">
              <i className="fa-solid fa-rotate-left" />
              Garantia na compra
            </div>
          </div>

        </div>

        <div className="auth-bg-glyph">
          <i className="fa-solid fa-gear" />
        </div>
      </div>

      {/* ── LADO DIREITO ── */}
      <div className="auth-right">
        <div className="auth-box">

          {/* ══════════ LOGIN ══════════ */}
          {mode === 'login' && (
            <>
              <div className="auth-tabs">
                <button className="auth-tab active">Entrar</button>
                <button className="auth-tab" onClick={() => switchMode('register')}>Cadastrar</button>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <h3 className="form-title">Bem-vindo de volta!</h3>

                <div className="form-group">
                  <label>E-mail</label>
                  <div className="input-wrap">
                    <i className="fa-solid fa-envelope inp-icon" />
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Senha</label>
                  <div className="input-wrap">
                    <i className="fa-solid fa-lock inp-icon" />
                    <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}>
                      <i className={`fa-solid fa-eye${showPw ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>

                <button type="button" className="auth-forgot" onClick={() => { setForgotEmail(email); setMode('forgot'); setError(''); }}>
                  Esqueci minha senha
                </button>

                {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Entrando…</> : <>Entrar <i className="fa-solid fa-arrow-right" /></>}
                </button>

                <div className="auth-divider"><span>ou continue com</span></div>
                <div className="social-row">
                  <button type="button" className="btn-social" onClick={() => showToast('Em breve!', 'info')}><i className="fa-brands fa-google" /> Google</button>
                  <button type="button" className="btn-social" onClick={() => showToast('Em breve!', 'info')}><i className="fa-brands fa-facebook" /> Facebook</button>
                </div>
              </form>
            </>
          )}

          {/* ══════════ CADASTRO ══════════ */}
          {mode === 'register' && (
            <>
              <div className="auth-tabs">
                <button className="auth-tab" onClick={() => switchMode('login')}>Entrar</button>
                <button className="auth-tab active">Cadastrar</button>
              </div>

              {/* PASSO 1: escolha de tipo */}
              {regStep === 1 && (
                <div className="auth-form">
                  <h3 className="form-title">Quem é você?</h3>
                  <p className="reg-step-desc">Escolha como quer usar o AutoGO</p>

                  <div className="type-cards">
                    {TYPE_CARDS.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        className={`type-card${userType === t.key ? ' active' : ''}`}
                        onClick={() => setUserType(t.key)}
                      >
                        <div className="type-card-icon">
                          <i className={`fa-solid ${t.icon}`} />
                        </div>
                        <div className="type-card-text">
                          <strong>{t.label}</strong>
                          <span>{t.desc}</span>
                        </div>
                        <div className="type-card-check">
                          <i className="fa-solid fa-circle-check" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    disabled={!userType}
                    onClick={() => { setError(''); setRegStep(2); }}
                    style={{ marginTop: '1.5rem' }}
                  >
                    Continuar <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              )}

              {/* PASSO 2: formulário */}
              {regStep === 2 && (
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="reg-step2-header">
                    <button type="button" className="auth-back-btn" onClick={() => { setRegStep(1); setError(''); }}>
                      <i className="fa-solid fa-arrow-left" /> Voltar
                    </button>
                    <span className={`reg-type-badge reg-type-badge--${userType}`}>
                      <i className={`fa-solid ${activeCard?.icon}`} /> {activeCard?.label}
                    </span>
                  </div>

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
                    <div className="input-wrap">
                      <i className="fa-solid fa-lock inp-icon" />
                      <input type={showPw ? 'text' : 'password'} placeholder="Mín. 8 caracteres" value={regPw} onChange={e => checkStrength(e.target.value)} required />
                      <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}><i className={`fa-solid fa-eye${showPw ? '-slash' : ''}`} /></button>
                    </div>
                    {regPw && <><div className="pw-strength"><div className="pw-bar" style={{ width: pwStr.width, background: pwStr.color }} /></div><div className="pw-label" style={{ color: pwStr.color }}>{pwStr.label}</div></>}
                  </div>

                  <div className="form-group"><label>Confirmar senha</label><div className="input-wrap"><i className="fa-solid fa-lock inp-icon" /><input type="password" placeholder="Repita a senha" value={confPw} onChange={e => setConfPw(e.target.value)} required /></div></div>

                  <div className="form-check">
                    <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                    <label htmlFor="terms">Concordo com os <a href="#">Termos</a> e <a href="#">Privacidade</a></label>
                  </div>

                  {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Criando…</> : <>Criar conta <i className="fa-solid fa-arrow-right" /></>}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ══════════ ESQUECI SENHA ══════════ */}
          {mode === 'forgot' && (
            <div className="auth-form">
              <button type="button" className="auth-back-btn" onClick={() => { setMode('login'); setForgotSent(false); setForgotError(''); setForgotEmail(''); }}>
                <i className="fa-solid fa-arrow-left" /> Voltar ao login
              </button>

              {!forgotSent ? (
                <>
                  <div className="forgot-header">
                    <div className="forgot-icon-wrap"><i className="fa-solid fa-lock" /></div>
                    <h3 className="form-title">Recuperar senha</h3>
                    <p className="forgot-desc">Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.</p>
                  </div>
                  <form onSubmit={handleForgot}>
                    <div className="form-group">
                      <label>E-mail</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-envelope inp-icon" />
                        <input type="email" placeholder="seu@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                      </div>
                    </div>
                    {forgotError && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {forgotError}</div>}
                    <button type="submit" className="btn btn-primary btn-full" disabled={forgotLoading}>
                      {forgotLoading ? <><i className="fa-solid fa-spinner fa-spin" /> Enviando…</> : <><i className="fa-solid fa-paper-plane" /> Enviar link de recuperação</>}
                    </button>
                  </form>
                </>
              ) : (
                <div className="forgot-success">
                  <div className="forgot-success-anim"><i className="fa-solid fa-circle-check" /></div>
                  <h3>E-mail enviado!</h3>
                  <p>Clique no link que enviamos para</p>
                  <div className="forgot-email-pill"><i className="fa-solid fa-envelope" /> {forgotEmail}</div>
                  <div className="forgot-spam-tip">
                    <i className="fa-solid fa-triangle-exclamation" />
                    Não recebeu? Verifique sua pasta de spam ou lixo eletrônico.
                  </div>
                  <button type="button" className="btn btn-primary btn-full" onClick={() => { setMode('login'); setForgotSent(false); setForgotEmail(''); }}>
                    <i className="fa-solid fa-arrow-left" /> Voltar ao login
                  </button>
                  <div className="forgot-or">ou</div>
                  <button type="button" className="forgot-resend-btn" disabled={forgotLoading} onClick={handleForgot}>
                    {forgotLoading ? 'Reenviando…' : 'Reenviar e-mail'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}