import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../lib/api';
import { loginSchema, registerSchema, forgotSchema, firstIssue } from '../../lib/validation';
import './Auth.css';
import logo from '../../assets/images/logo-auto-go-branco.png';

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, loginAsDemo, register, showToast } = useApp();

  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');

  // Cadastro: passo 1 = escolha de tipo, passo 2 = formulário
  const [regStep, setRegStep] = useState(1);
  const [userType, setUserType] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [pwStr, setPwStr] = useState({ width: '0%', color: '#888', label: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState('');

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

  // ── Contas Demo para Apresentação ────────────────────────────
  const DEMO_ACCOUNTS = [
    {
      role: 'client',
      label: 'Cliente',
      name: 'João Silva',
      email: 'cliente@autogo.com',
      icon: 'fa-user',
      badge: 'Consumidor',
      desc: 'Catálogo de autopeças, carrinho, compras e pedidos',
      color: '#3B82F6',
    },
    {
      role: 'merchant',
      label: 'Comerciante',
      name: 'Auto Peças Bandeirantes',
      email: 'loja@autogo.com',
      icon: 'fa-store',
      badge: 'Lojista',
      desc: 'Catálogo próprio, estoque, pedidos recebidos e métricas',
      color: '#E11A2C',
    },
    {
      role: 'driver',
      label: 'Entregador',
      name: 'Lucas Motta',
      email: 'entregador@autogo.com',
      icon: 'fa-motorcycle',
      badge: 'Parceiro',
      desc: 'Fila de entregas, rotas, aceitar corridas e ganhos',
      color: '#22C55E',
    },
  ];

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

  // ── Acesso rápido com tempo de autenticação realista ──────────
  const handleQuickDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    setDemoLoadingRole(role);
    try {
      const data = await loginAsDemo(role);
      showToast('Login realizado com sucesso!', 'success');
      const targetRole = data?.profile?.role || role;
      if (targetRole === 'merchant') navigate('/merchant');
      else if (targetRole === 'driver') navigate('/driver');
      else navigate('/client');
    } catch (err) {
      setError('Erro ao iniciar demonstração: ' + err.message);
    } finally {
      setLoading(false);
      setDemoLoadingRole('');
    }
  };

  const handleFillDemo = (demo) => {
    setEmail(demo.email);
    setPw('senha123');
    setError('');
    showToast(`Credenciais de ${demo.label} preenchidas!`, 'info');
  };

  // ── Login universal ──────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const check = loginSchema.safeParse({ email, password: pw });
    if (!check.success) { setError(firstIssue(check)); return; }
    setLoading(true);
    try {
      const data = await login(email, pw);
      const prof = data?.profile || await authApi.getProfile(data?.user?.id);

      showToast('Login realizado com sucesso!', 'success');
      setTimeout(() => {
        const role = prof?.role || data?.user?.role || 'client';
        if (role === 'merchant') navigate('/merchant');
        else if (role === 'driver') navigate('/driver');
        else navigate('/client');
      }, 250);
    } catch (err) {
      const msg = err?.message || '';
      if (msg === 'Invalid login credentials' || msg.includes('Invalid')) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(msg || 'Falha ao autenticar. Experimente usar os botões de Acesso Rápido abaixo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Cadastro ─────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const check = registerSchema.safeParse({
      name: userType === 'merchant' ? (storeName || 'Loja') : name,
      storeName: userType === 'merchant' ? storeName : (name || 'Cliente'),
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
      showToast('Conta criada com sucesso!', 'success');
      setTimeout(() => {
        if (userType === 'merchant') navigate('/merchant');
        else if (userType === 'driver') navigate('/driver');
        else navigate('/client');
      }, 350);
    } catch (err) {
      setError(err?.message?.includes('already registered') ? 'E-mail já cadastrado.' : (err?.message || 'Erro ao criar conta.'));
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
            <Link to="/" title="Ir para início">
              <img src={logo} alt="AutoGO" className="auth-logo-img" />
            </Link>

            <div className="auth-tagline">
              <h2 className="auth-title">
                AUTOPEÇAS <br />
                NA VELOCIDADE <br />
                CERTA.
              </h2>

              <p className="auth-sub">
                +12.000 produtos, +340 lojas parceiras, entrega expressa em minutos.
              </p>
            </div>
          </div>

          <div className="auth-features">
            <div className="auth-feat">
              <i className="fa-solid fa-shield-halved" />
              <span>Compra 100% segura e garantida</span>
            </div>
            <div className="auth-feat">
              <i className="fa-solid fa-truck-fast" />
              <span>Entrega expressa com rastreio em tempo real</span>
            </div>
            <div className="auth-feat">
              <i className="fa-solid fa-rotate-left" />
              <span>Garantia de procedência e peças originais</span>
            </div>
          </div>

          <div className="auth-presentation-pill">
            <i className="fa-solid fa-bolt" />
            <span>Ambiente pronto para demonstração com dados mockados</span>
          </div>

        </div>

        <div className="auth-bg-glyph">
          <i className="fa-solid fa-gear" />
        </div>
      </div>

      {/* ── LADO DIREITO ── */}
      <div className="auth-right">
        <div className="auth-box">

          <div className="auth-top-nav">
            <Link to="/" className="auth-home-btn">
              <i className="fa-solid fa-arrow-left" /> Voltar ao site
            </Link>
          </div>

          {/* ══════════ LOGIN ══════════ */}
          {mode === 'login' && (
            <>
              <div className="auth-tabs">
                <button className="auth-tab active" type="button">Entrar</button>
                <button className="auth-tab" type="button" onClick={() => switchMode('register')}>Cadastrar</button>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <h3 className="form-title">Bem-vindo de volta!</h3>

                <div className="form-group">
                  <label>E-mail</label>
                  <div className="input-wrap">
                    <i className="fa-solid fa-envelope inp-icon" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Senha</label>
                  <div className="input-wrap">
                    <i className="fa-solid fa-lock inp-icon" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={pw}
                      onChange={e => setPw(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      <i className={`fa-solid fa-eye${showPw ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="auth-options-row">
                  <span className="auth-pw-hint">Dica demo: qualquer senha com 8+ dígitos</span>
                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() => { setForgotEmail(email); setMode('forgot'); setError(''); }}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {error && (
                  <div className="form-error">
                    <i className="fa-solid fa-circle-exclamation" /> {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Entrando…</>
                  ) : (
                    <>Entrar na conta <i className="fa-solid fa-arrow-right" /></>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>contas para apresentação</span>
              </div>

              {/* ── SEÇÃO DE ACESSO PARA APRESENTAÇÃO ── */}
              <div className="demo-showcase-box">
                <div className="demo-header">
                  <div className="demo-header-badge">
                    <i className="fa-solid fa-wand-magic-sparkles" /> Modo Apresentação
                  </div>
                  <span className="demo-header-hint">Selecione um perfil para preencher ou entrar:</span>
                </div>

                <div className="demo-cards-row">
                  {DEMO_ACCOUNTS.map((d) => (
                    <div
                      key={d.role}
                      className="demo-card"
                      style={{ '--role-color': d.color }}
                    >
                      <div className="demo-card-head">
                        <div className="demo-card-icon">
                          <i className={`fa-solid ${d.icon}`} />
                        </div>
                        <div className="demo-card-info">
                          <strong>{d.label}</strong>
                          <span className="demo-card-name">{d.email}</span>
                        </div>
                      </div>

                      <p className="demo-card-desc">{d.desc}</p>

                      <div className="demo-card-actions">
                        <button
                          type="button"
                          className="btn-demo-fill"
                          onClick={() => handleFillDemo(d)}
                          disabled={loading}
                          title="Preencher credenciais no formulário acima"
                        >
                          <i className="fa-solid fa-pen-to-square" /> Preencher dados
                        </button>
                        <button
                          type="button"
                          className="btn-demo-quick"
                          onClick={() => handleQuickDemoLogin(d.role)}
                          disabled={loading}
                          title={`Autenticar como ${d.label}`}
                        >
                          {demoLoadingRole === d.role ? (
                            <><i className="fa-solid fa-spinner fa-spin" /> Entrando…</>
                          ) : (
                            <><i className="fa-solid fa-arrow-right-to-bracket" /> Entrar</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════ CADASTRO ══════════ */}
          {mode === 'register' && (
            <>
              <div className="auth-tabs">
                <button className="auth-tab" type="button" onClick={() => switchMode('login')}>Entrar</button>
                <button className="auth-tab active" type="button">Cadastrar</button>
              </div>

              {/* PASSO 1: escolha de tipo */}
              {regStep === 1 && (
                <div className="auth-form">
                  <h3 className="form-title">Quem é você?</h3>
                  <p className="reg-step-desc">Escolha como deseja se cadastrar na AutoGO:</p>

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
                    Continuar cadastro <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              )}

              {/* PASSO 2: formulário */}
              {regStep === 2 && (
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="reg-step2-header">
                    <button type="button" className="auth-back-btn" onClick={() => { setRegStep(1); setError(''); }}>
                      <i className="fa-solid fa-arrow-left" /> Alterar perfil
                    </button>
                    <span className={`reg-type-badge reg-type-badge--${userType}`}>
                      <i className={`fa-solid ${activeCard?.icon}`} /> {activeCard?.label}
                    </span>
                  </div>

                  <h3 className="form-title">Criar conta como {activeCard?.label}</h3>

                  {userType === 'client' && (<>
                    <div className="form-group">
                      <label>Nome completo</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-user inp-icon" />
                        <input type="text" placeholder="João Silva" value={name} onChange={e => setName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-phone inp-icon" />
                        <input type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => maskPhone(e.target.value)} />
                      </div>
                    </div>
                  </>)}

                  {userType === 'merchant' && (<>
                    <div className="form-group">
                      <label>Nome da loja</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-store inp-icon" />
                        <input type="text" placeholder="Auto Peças Central" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>CNPJ</label>
                        <div className="input-wrap">
                          <i className="fa-solid fa-id-card inp-icon" />
                          <input type="text" placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Telefone comercial</label>
                        <div className="input-wrap">
                          <i className="fa-solid fa-phone inp-icon" />
                          <input type="tel" value={phone} onChange={e => maskPhone(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Endereço da loja</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-location-dot inp-icon" />
                        <input type="text" placeholder="Rua das Peças, 100 — São Paulo, SP" value={addr} onChange={e => setAddr(e.target.value)} />
                      </div>
                    </div>
                  </>)}

                  {userType === 'driver' && (<>
                    <div className="form-group">
                      <label>Nome completo</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-user inp-icon" />
                        <input type="text" placeholder="Lucas Motta" value={name} onChange={e => setName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>CPF</label>
                        <div className="input-wrap">
                          <i className="fa-solid fa-id-card inp-icon" />
                          <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Telefone</label>
                        <div className="input-wrap">
                          <i className="fa-solid fa-phone inp-icon" />
                          <input type="tel" value={phone} onChange={e => maskPhone(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Veículo de entrega</label>
                      <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                        <option value="moto">Motocicleta (Recomendado para rotas rápidas)</option>
                        <option value="car">Carro (Peças médias/pesadas)</option>
                        <option value="van">Furgão / Utilitário (Cargas volumosas)</option>
                        <option value="bike">Bicicleta</option>
                      </select>
                    </div>
                  </>)}

                  <div className="form-group">
                    <label>E-mail de acesso</label>
                    <div className="input-wrap">
                      <i className="fa-solid fa-envelope inp-icon" />
                      <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Senha</label>
                    <div className="input-wrap">
                      <i className="fa-solid fa-lock inp-icon" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Mín. 8 caracteres"
                        value={regPw}
                        onChange={e => checkStrength(e.target.value)}
                        required
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}>
                        <i className={`fa-solid fa-eye${showPw ? '-slash' : ''}`} />
                      </button>
                    </div>
                    {regPw && (
                      <>
                        <div className="pw-strength">
                          <div className="pw-bar" style={{ width: pwStr.width, background: pwStr.color }} />
                        </div>
                        <div className="pw-label" style={{ color: pwStr.color }}>{pwStr.label}</div>
                      </>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Confirmar senha</label>
                    <div className="input-wrap">
                      <i className="fa-solid fa-lock inp-icon" />
                      <input
                        type="password"
                        placeholder="Repita a senha"
                        value={confPw}
                        onChange={e => setConfPw(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-check">
                    <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                    <label htmlFor="terms">Concordo com os <a href="#termos" onClick={e => e.preventDefault()}>Termos de Serviço</a> e <a href="#privacidade" onClick={e => e.preventDefault()}>Política de Privacidade</a></label>
                  </div>

                  {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Criando conta…</> : <>Finalizar cadastro <i className="fa-solid fa-arrow-right" /></>}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ══════════ ESQUECI SENHA ══════════ */}
          {mode === 'forgot' && (
            <div className="auth-form">
              <button
                type="button"
                className="auth-back-btn"
                onClick={() => { setMode('login'); setForgotSent(false); setForgotError(''); setForgotEmail(''); }}
              >
                <i className="fa-solid fa-arrow-left" /> Voltar ao login
              </button>

              {!forgotSent ? (
                <>
                  <div className="forgot-header">
                    <div className="forgot-icon-wrap"><i className="fa-solid fa-lock" /></div>
                    <h3 className="form-title">Recuperar senha</h3>
                    <p className="forgot-desc">Informe seu e-mail cadastrado para enviarmos as instruções de recuperação de senha.</p>
                  </div>
                  <form onSubmit={handleForgot}>
                    <div className="form-group">
                      <label>E-mail</label>
                      <div className="input-wrap">
                        <i className="fa-solid fa-envelope inp-icon" />
                        <input
                          type="email"
                          placeholder="seu@email.com"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          required
                        />
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
                  <h3>Link enviado com sucesso!</h3>
                  <p>Enviamos as instruções de recuperação para:</p>
                  <div className="forgot-email-pill"><i className="fa-solid fa-envelope" /> {forgotEmail}</div>
                  <div className="forgot-spam-tip">
                    <i className="fa-solid fa-circle-info" />
                    Para fins de demonstração, o envio foi simulado com sucesso.
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    onClick={() => { setMode('login'); setForgotSent(false); setForgotEmail(''); }}
                  >
                    <i className="fa-solid fa-arrow-left" /> Retornar ao login
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
