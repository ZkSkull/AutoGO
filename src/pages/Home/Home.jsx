import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { PRODUCTS, STORES, CATEGORIES, fmt } from '../../data';
import { useApp } from '../../context/AppContext';
import './Home.css';

// ─── Brand data ───────────────────────────────────────────────────────────────
const BRANDS = [
  { name: 'Bosch',       textColor: '#C8102E', type: 'text-icon' },
  { name: 'NGK',         textColor: '#fff',    type: 'circle',   bg: '#E31837' },
  { name: 'Nakata',      textColor: '#003087', type: 'text'      },
  { name: 'Mobil',       textColor: '#E31837', type: 'text'      },
  { name: 'Mann Filter', textColor: '#fff',    type: 'box',      bg: '#007A33' },
  { name: 'Castrol',     textColor: '#009A44', type: 'text'      },
  { name: 'Dayco',       textColor: '#00AEEF', type: 'dash'      },
  { name: 'LUK',         textColor: '#000',    type: 'box-dark', bg: '#F5C400' },
  { name: 'Moura',       textColor: '#E31837', type: 'text'      },
  { name: 'Valeo',       textColor: '#78BE20', type: 'text'      },
  { name: 'Duralast',    textColor: '#003087', type: 'italic'    },
  { name: 'Wega',        textColor: '#C8102E', type: 'text'      },
];

function BrandLogo({ brand }) {
  const base = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 5 };
  if (brand.type === 'circle') return (
    <div style={{ ...base, background: brand.bg, borderRadius: '50%', width: 64, height: 64, flexDirection: 'column', gap: 1 }}>
      <span style={{ color: brand.textColor, fontWeight: 900, fontSize: '.9rem', fontFamily: 'var(--font-head)' }}>{brand.name}</span>
      <span style={{ color: brand.textColor, fontSize: '.55rem', fontWeight: 700, opacity: .85 }}>SPARK PLUGS</span>
    </div>
  );
  if (brand.type === 'box' || brand.type === 'box-dark') return (
    <div style={{ background: brand.bg, border: `2px solid ${brand.bg}`, borderRadius: 5, padding: '4px 10px' }}>
      <span style={{ color: brand.textColor, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-head)' }}>{brand.name}</span>
    </div>
  );
  if (brand.type === 'italic') return (
    <span style={{ color: brand.textColor, fontStyle: 'italic', fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Georgia, serif' }}>{brand.name}</span>
  );
  if (brand.type === 'dash') return (
    <span style={{ color: brand.textColor, fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-head)', letterSpacing: '.05em' }}>—{brand.name}—</span>
  );
  if (brand.type === 'text-icon') return (
    <div style={base}>
      <span style={{ color: brand.textColor, fontSize: '1rem' }}>⊕</span>
      <span style={{ color: brand.textColor, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-head)' }}>{brand.name}</span>
    </div>
  );
  return <span style={{ color: brand.textColor, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-head)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{brand.name}</span>;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const doSearch = () => { if (search.trim()) navigate(`/client?search=${encodeURIComponent(search)}`); };

  return (
    <div className="home-page">
      <Navbar transparent />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-stripe s1" /><div className="hero-stripe s2" /><div className="hero-stripe s3" />
        </div>
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge"><i className="fa-solid fa-bolt" /> Entrega Expressa</div>
            <h1 className="hero-title">Autopeças<br /><span className="accent">na sua porta.</span></h1>
            <p className="hero-sub">Encontre peças originais e remanufaturadas das melhores lojas da sua cidade. Rápido, confiável e rastreável.</p>
            <div className="hero-search-row">
              <input
                type="text"
                placeholder="Buscar peça, marca ou modelo do veículo…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
              <button className="btn btn-primary" onClick={doSearch}>
                <i className="fa-solid fa-magnifying-glass" /> Buscar
              </button>
            </div>
            <div className="hero-chips">
              {['Filtro de óleo', 'Pastilha de freio', 'Bateria', 'Amortecedor', 'Correia dentada', 'Vela de ignição'].map(c => (
                <span key={c} className="chip" onClick={() => navigate(`/client?search=${encodeURIComponent(c)}`)}>{c}</span>
              ))}
            </div>
          </div>
          <div className="hero-cards">
            {[
              { icon: 'fa-circle-check', val: '+12.000', lbl: 'peças disponíveis', delay: '0s'   },
              { icon: 'fa-store',        val: '+340',    lbl: 'lojas parceiras',   delay: '.8s'  },
              { icon: 'fa-truck-fast',   val: '45 min',  lbl: 'entrega expressa',  delay: '1.6s' },
            ].map(c => (
              <div key={c.val} className="hero-card" style={{ animationDelay: c.delay }}>
                <i className={`fa-solid ${c.icon}`} />
                <div><strong>{c.val}</strong><br />{c.lbl}</div>
              </div>
            ))}
            <div className="hero-glyph"><i className="fa-solid fa-gear" /></div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar">
        <div className="container trust-bar-inner">
          {[
            ['fa-shield-halved', 'Compra 100% segura'],
            ['fa-rotate-left',   'Garantia na compra'],
            ['fa-truck-fast',    'Entrega em 45 min'],
            ['fa-headset',       'Suporte 7 dias / semana'],
            ['fa-certificate',   'Só peças originais'],
          ].map(([icon, label]) => (
            <div key={label} className="trust-item">
              <i className={`fa-solid ${icon}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="section" id="categorias">
        <div className="container">
          <div className="section-header">
            <h2>Categorias</h2>
            <p>Encontre tudo que seu veículo precisa</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.label} className="cat-card" onClick={() => navigate(`/categorias`)}>
                <div className="cat-icon"><i className={cat.icon} /></div>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/categorias')}>
              Ver todas as categorias <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section section-dark" id="produtos">
        <div className="container">
          <div className="section-header light">
            <h2>Produtos em Destaque</h2>
            <p>Os mais buscados agora</p>
          </div>
          <div className="products-grid">
            {PRODUCTS.slice(0, 8).map(p => (
              <div key={p.id} className="product-card dark" onClick={() => navigate(`/produto/${p.id}`)}>
                <div className="product-img">
                  <span>{p.icon}</span>
                  {p.badge && <span className="product-badge-tag">{p.badge}</span>}
                </div>
                <div className="product-body">
                  <div className="product-brand">{p.brand} · {'★'.repeat(Math.floor(p.rating))}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">{fmt(p.price)}</div>
                  <button
                    className="btn btn-primary btn-full"
                    style={{ marginTop: '.7rem', fontSize: '.88rem', padding: '.5rem' }}
                    onClick={e => { e.stopPropagation(); navigate(`/produto/${p.id}`); }}
                  >
                    <i className="fa-solid fa-cart-plus" /> Ver produto
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => navigate('/client')}>
              Ver todos os produtos <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </section>

      {/* ── STORES ── */}
      <section className="section" id="lojas">
        <div className="container">
          <div className="section-header">
            <h2>Lojas em Destaque</h2>
            <p>Parceiros verificados perto de você</p>
          </div>
          <div className="stores-grid">
            {STORES.map(s => (
              <div key={s.id} className="store-card" onClick={() => navigate('/lojas')}>
                <div className="store-card-header">
                  <div className="store-logo"><i className="fa-solid fa-store" /></div>
                  <div><h4>{s.name}</h4><span style={{ fontSize: '.8rem', color: 'var(--gray-400)' }}>{s.category}</span></div>
                </div>
                <div className="store-meta">
                  <span><i className="fa-solid fa-star" style={{ color: '#F5A623' }} /> {s.rating} ({s.reviews})</span>
                  <span><i className="fa-solid fa-location-dot" /> {s.distance}</span>
                  <span style={{ color: s.open ? 'var(--green)' : 'var(--red)' }}>
                    <i className="fa-solid fa-circle" style={{ fontSize: '.5rem' }} /> {s.open ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                <div style={{ marginTop: '.8rem', fontSize: '.82rem', color: 'var(--gray-400)' }}>{s.products} produtos</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/lojas')}>
              Ver todas as lojas <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="section brands-section" id="marcas">
        <div className="container">
          <div className="brands-header">
            <div>
              <h2 className="brands-title">Só Marcas Originais</h2>
              <div className="brands-title-bar" />
              <p style={{ color: 'var(--gray-400)', marginTop: '.5rem' }}>Trabalhamos apenas com as melhores marcas do mercado</p>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/marcas')}>
              Ver todas as marcas <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
          <div className="brands-grid">
            {BRANDS.map(brand => (
              <div key={brand.name} className="brand-card" onClick={() => navigate('/marcas')}>
                <div className="brand-logo-wrap"><BrandLogo brand={brand} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section section-red" id="como-funciona">
        <div className="container">
          <div className="section-header light">
            <h2>Como Funciona</h2>
            <p>Simples, rápido e seguro</p>
          </div>
          <div className="steps-row">
            {[
              { num: '01', icon: 'fa-magnifying-glass', title: 'Busque a peça',  desc: 'Pesquise pelo nome, código ou modelo do veículo.' },
              { num: '02', icon: 'fa-store',            title: 'Escolha a loja', desc: 'Compare preços e avaliações das lojas parceiras.' },
              { num: '03', icon: 'fa-cart-shopping',    title: 'Faça o pedido',  desc: 'Compre com segurança e acompanhe em tempo real.' },
              { num: '04', icon: 'fa-truck-fast',       title: 'Receba em casa', desc: 'Entrega expressa ou retire na loja, você escolhe.' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.num}>
                <div className="step">
                  <div className="step-num">{step.num}</div>
                  <div className="step-icon"><i className={`fa-solid ${step.icon}`} /></div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {i < arr.length - 1 && <div className="step-arrow"><i className="fa-solid fa-arrow-right" /></div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.3)' }} onClick={() => navigate('/como-funciona')}>
              Saiba mais <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA SPLIT ── */}
      <section className="cta-split">
        <div className="cta-split-card merchant">
          <i className="fa-solid fa-store" />
          <h3>Tem uma loja de autopeças?</h3>
          <p>Venda para milhares de clientes na sua região. Zero mensalidade para começar.</p>
          <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register&type=merchant')}>
            Quero ser parceiro
          </button>
        </div>
        <div className="cta-split-card driver">
          <i className="fa-solid fa-motorcycle" />
          <h3>Quer ganhar como entregador?</h3>
          <p>Trabalhe no seu horário e ganhe por entrega. Cadastre-se grátis.</p>
          <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register&type=driver')}>
            Quero entregar
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="container home-footer-inner">
          <div>
            <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
              <span className="logo-icon"><i className="fa-solid fa-gear" /></span>
              <span>Peça<span className="logo-red">Rápida</span></span>
            </a>
            <p style={{ color: 'rgba(255,255,255,.4)', marginTop: '.8rem', fontSize: '.88rem', maxWidth: 260 }}>
              O marketplace de autopeças mais rápido do Brasil.
            </p>
            <div className="footer-social">
              {[['fa-brands fa-instagram','#'],['fa-brands fa-facebook','#'],['fa-brands fa-whatsapp','#']].map(([icon, href]) => (
                <a key={icon} href={href} className="social-btn"><i className={icon} /></a>
              ))}
            </div>
          </div>
          {[
            { title: 'Páginas',  links: [['Categorias','/categorias'],['Lojas','/lojas'],['Marcas','/marcas'],['Como funciona','/como-funciona']] },
            { title: 'Produto',  links: [['Seja parceiro','/auth?mode=register&type=merchant'],['Seja entregador','/auth?mode=register&type=driver'],['Blog','#']] },
            { title: 'Suporte',  links: [['Ajuda','#'],['Fale conosco','#'],['Termos de uso','#'],['Privacidade','#']] },
          ].map(col => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} onClick={e => { e.preventDefault(); navigate(href); }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">© 2025 PeçaRápida. Todos os direitos reservados.</div>
      </footer>

      {/* ── CART FAB ── */}
      <div className="cart-fab" onClick={() => navigate('/client')}>
        <i className="fa-solid fa-cart-shopping" />
      </div>
    </div>
  );
}