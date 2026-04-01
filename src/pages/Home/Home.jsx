import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase.js';
import { CATEGORIES, fmt } from '../../data';
import './Home.css';

const BRAND_COLORS = {
  'Bosch':'#C8102E','NGK':'#E31837','TRW':'#003087','Monroe':'#F5A623',
  'Heliar':'#E31837','Gates':'#00AEEF','Mahle':'#007A33','Brembo':'#E31837',
  'Cofap':'#003087','Modine':'#1A1A1A','Magneti':'#8B0000','Nakata':'#003087',
  'Dayco':'#00AEEF','Valeo':'#78BE20','Wega':'#C8102E','default':'#1A1A1A',
};

export default function Home() {
  const navigate = useNavigate();
  const { cartTotal } = useApp();
  const [search,   setSearch]   = useState('');
  const [products, setProducts] = useState([]);
  const [stores,   setStores]   = useState([]);
  const [brands,   setBrands]   = useState([]);
  const [stats,    setStats]    = useState({ products: 0, stores: 0 });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Produtos em destaque
      const { data: prods } = await supabase
        .from('products')
        .select('*, store:stores(name)')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);
      setProducts((prods || []).map(p => ({ ...p, icon: p.icon_emoji || '🔩' })));

      // Lojas em destaque
      const { data: strs } = await supabase
        .from('stores')
        .select('*')
        .order('rating', { ascending: false })
        .limit(4);
      setStores(strs || []);

      // Marcas únicas
      const { data: brandData } = await supabase
        .from('products')
        .select('brand')
        .eq('is_active', true);
      const uniqueBrands = [...new Set((brandData || []).map(p => p.brand))].slice(0, 12);
      setBrands(uniqueBrands);

      // Stats reais
      setStats({
        products: prods?.length ? (await supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true)).count || 0 : 0,
        stores:   strs?.length  ? (await supabase.from('stores').select('id',   { count: 'exact' })).count || 0 : 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <p className="hero-sub">Encontre peças originais e remanufaturadas das melhores lojas da sua cidade.</p>
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
              {['Filtro de óleo','Pastilha de freio','Bateria','Amortecedor','Correia dentada','Vela de ignição'].map(c => (
                <span key={c} className="chip" onClick={() => navigate(`/client?search=${encodeURIComponent(c)}`)}>{c}</span>
              ))}
            </div>
          </div>
          <div className="hero-cards">
            {[
              { icon:'fa-circle-check', val: stats.products > 0 ? `+${stats.products.toLocaleString('pt-BR')}` : '+12.000', lbl:'peças disponíveis', delay:'0s'   },
              { icon:'fa-store',        val: stats.stores   > 0 ? `+${stats.stores}`                            : '+340',    lbl:'lojas parceiras',  delay:'.8s'  },
              { icon:'fa-truck-fast',   val:'45 min',                                                                         lbl:'entrega expressa', delay:'1.6s' },
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
            ['fa-shield-halved','Compra 100% segura'],
            ['fa-rotate-left',  'Garantia na compra'],
            ['fa-truck-fast',   'Entrega em 45 min'],
            ['fa-headset',      'Suporte 7 dias / semana'],
            ['fa-certificate',  'Só peças originais'],
          ].map(([icon, label]) => (
            <div key={label} className="trust-item">
              <i className={`fa-solid ${icon}`} /><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="section" id="categorias">
        <div className="container">
          <div className="section-header"><h2>Categorias</h2><p>Encontre tudo que seu veículo precisa</p></div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.label} className="cat-card" onClick={() => navigate('/categorias')}>
                <div className="cat-icon"><i className={cat.icon} /></div>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:'2rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/categorias')}>
              Ver todas as categorias <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section section-dark" id="produtos">
        <div className="container">
          <div className="section-header light"><h2>Produtos em Destaque</h2><p>Os mais buscados agora</p></div>
          {loading ? (
            <div className="products-grid">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{ height:220, background:'rgba(255,255,255,.05)', borderRadius:'var(--radius-lg)', animation:'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem 0', color:'rgba(255,255,255,.4)' }}>
              <i className="fa-solid fa-box-open" style={{ fontSize:'2rem', display:'block', marginBottom:'1rem' }} />
              <p>Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(p => (
                <div key={p.id} className="product-card dark" onClick={() => navigate(`/produto/${p.id}`)}>
                  <div className="product-img">
                    {p.images?.length > 0
                      ? <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                      : <span>{p.icon}</span>
                    }
                    {p.badge && <span className="product-badge-tag">{p.badge}</span>}
                  </div>
                  <div className="product-body">
                    <div className="product-brand">{p.brand} · {'★'.repeat(Math.floor(p.rating || 5))}</div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">{fmt(p.price)}</div>
                    <button
                      className="btn btn-primary btn-full"
                      style={{ marginTop:'.7rem', fontSize:'.88rem', padding:'.5rem' }}
                      onClick={e => { e.stopPropagation(); navigate(`/produto/${p.id}`); }}
                    >
                      <i className="fa-solid fa-eye" /> Ver produto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign:'center', marginTop:'2.5rem' }}>
            <button className="btn btn-outline" style={{ borderColor:'rgba(255,255,255,.3)', color:'#fff' }} onClick={() => navigate('/client')}>
              Ver todos os produtos <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </section>

      {/* ── STORES ── */}
      <section className="section" id="lojas">
        <div className="container">
          <div className="section-header"><h2>Lojas em Destaque</h2><p>Parceiros verificados perto de você</p></div>
          {loading ? (
            <div className="stores-grid">
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height:160, background:'var(--gray-100)', borderRadius:'var(--radius-lg)', animation:'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem 0', color:'var(--gray-400)' }}>
              <p>Nenhuma loja cadastrada ainda.</p>
            </div>
          ) : (
            <div className="stores-grid">
              {stores.map(s => (
                <div key={s.id} className="store-card" onClick={() => navigate('/lojas')}>
                  <div className="store-card-header">
                    <div className="store-logo">
                      {s.logo_url
                        ? <img src={s.logo_url} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} />
                        : <i className="fa-solid fa-store" />
                      }
                    </div>
                    <div>
                      <h4>{s.name}</h4>
                      <span style={{ fontSize:'.8rem', color:'var(--gray-400)' }}>{s.category || 'Autopeças'}</span>
                    </div>
                  </div>
                  <div className="store-meta">
                    <span><i className="fa-solid fa-star" style={{ color:'#F5A623' }} /> {Number(s.rating||5).toFixed(1)} ({s.total_reviews||0})</span>
                    {s.address && <span><i className="fa-solid fa-location-dot" /> {s.address.split(',')[0]}</span>}
                    <span style={{ color: s.is_open ? 'var(--green)' : 'var(--red)' }}>
                      <i className="fa-solid fa-circle" style={{ fontSize:'.5rem' }} /> {s.is_open ? 'Aberta' : 'Fechada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign:'center', marginTop:'2rem' }}>
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
              <p style={{ color:'var(--gray-400)', marginTop:'.5rem' }}>Trabalhamos apenas com as melhores marcas do mercado</p>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/marcas')}>
              Ver todas as marcas <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
          {loading ? (
            <div className="brands-grid">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} className="brand-card">
                  <div style={{ height:40, width:'80%', background:'var(--gray-200)', borderRadius:4, animation:'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="brands-grid">
              {brands.map(name => (
                <div key={name} className="brand-card" onClick={() => navigate('/marcas')}>
                  <div className="brand-logo-wrap">
                    <div style={{
                      background: BRAND_COLORS[name] || BRAND_COLORS['default'],
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontFamily: 'var(--font-head)',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      letterSpacing: '.02em',
                    }}>
                      {name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section section-red" id="como-funciona">
        <div className="container">
          <div className="section-header light"><h2>Como Funciona</h2><p>Simples, rápido e seguro</p></div>
          <div className="steps-row">
            {[
              { num:'01', icon:'fa-magnifying-glass', title:'Busque a peça',  desc:'Pesquise pelo nome, código ou modelo do veículo.' },
              { num:'02', icon:'fa-store',            title:'Escolha a loja', desc:'Compare preços e avaliações das lojas parceiras.' },
              { num:'03', icon:'fa-cart-shopping',    title:'Faça o pedido',  desc:'Compre com segurança e acompanhe em tempo real.' },
              { num:'04', icon:'fa-truck-fast',       title:'Receba em casa', desc:'Entrega expressa ou retire na loja, você escolhe.' },
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
          <div style={{ textAlign:'center', marginTop:'2.5rem' }}>
            <button className="btn" style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'2px solid rgba(255,255,255,.3)' }} onClick={() => navigate('/como-funciona')}>
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
          <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register&type=merchant')}>Quero ser parceiro</button>
        </div>
        <div className="cta-split-card driver">
          <i className="fa-solid fa-motorcycle" />
          <h3>Quer ganhar como entregador?</h3>
          <p>Trabalhe no seu horário e ganhe por entrega. Cadastre-se grátis.</p>
          <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register&type=driver')}>Quero entregar</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="container home-footer-inner">
          <div>
            <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
              <span className="logo-icon"><i className="fa-solid fa-gear" /></span>
              <span>Auto<span className="logo-red">GO</span></span>
            </a>
            <p style={{ color:'rgba(255,255,255,.4)', marginTop:'.8rem', fontSize:'.88rem', maxWidth:260 }}>
              O marketplace de autopeças mais rápido do Brasil.
            </p>
            <div className="footer-social">
              {[['fa-brands fa-instagram','#'],['fa-brands fa-facebook','#'],['fa-brands fa-whatsapp','#']].map(([icon, href]) => (
                <a key={icon} href={href} className="social-btn"><i className={icon} /></a>
              ))}
            </div>
          </div>
          {[
            { title:'Páginas', links:[['Categorias','/categorias'],['Lojas','/lojas'],['Marcas','/marcas'],['Como funciona','/como-funciona']] },
            { title:'Produto', links:[['Seja parceiro','/auth?mode=register&type=merchant'],['Seja entregador','/auth?mode=register&type=driver'],['Blog','#']] },
            { title:'Suporte', links:[['Ajuda','#'],['Fale conosco','#'],['Termos de uso','#'],['Privacidade','#']] },
          ].map(col => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} onClick={e => { e.preventDefault(); navigate(href); }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">© 2025 AutoGO. Todos os direitos reservados.</div>
      </footer>

      {/* ── CART FAB ── */}
      <div className="cart-fab" onClick={() => navigate('/client')}>
        <i className="fa-solid fa-cart-shopping" />
        {cartTotal > 0 && <span className="cart-fab-count">{cartTotal}</span>}
      </div>
    </div>
  );
}