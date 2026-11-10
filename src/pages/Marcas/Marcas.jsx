import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../lib/supabase.js';
import { mockDb } from '../../data/mockData';
import { fmt } from '../../data';
import './Marcas.css';

const BRAND_COLORS = {
  'Bosch':    { bg:'#C8102E', text:'#fff'    },
  'NGK':      { bg:'#E31837', text:'#fff'    },
  'TRW':      { bg:'#003087', text:'#fff'    },
  'Monroe':   { bg:'#F5A623', text:'#000'    },
  'Heliar':   { bg:'#E31837', text:'#fff'    },
  'Gates':    { bg:'#00AEEF', text:'#fff'    },
  'Mahle':    { bg:'#007A33', text:'#fff'    },
  'Brembo':   { bg:'#E31837', text:'#fff'    },
  'Cofap':    { bg:'#003087', text:'#fff'    },
  'Modine':   { bg:'#1A1A1A', text:'#fff'    },
  'Magneti':  { bg:'#8B0000', text:'#fff'    },
  'Nakata':   { bg:'#003087', text:'#fff'    },
  'Dayco':    { bg:'#00AEEF', text:'#fff'    },
  'Valeo':    { bg:'#78BE20', text:'#fff'    },
  'default':  { bg:'#1A1A1A', text:'#fff'    },
};

const CATS = ['Todas','Motor','Freios','Suspensão','Elétrica','Filtros','Transmissão','Arrefecimento','Acessórios'];

export default function Marcas() {
  const navigate = useNavigate();

  const [brands,      setBrands]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [selected,    setSelected]    = useState(null);
  const [catFilter,   setCatFilter]   = useState('Todas');
  const [search,      setSearch]      = useState('');
  const [brandProds,  setBrandProds]  = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selected) loadBrandProducts(selected);
    else setBrandProds([]);
  }, [selected]);

  const buildBrandsList = (rows) => {
    const brandMap = {};
    (rows || []).forEach(p => {
      if (!p?.brand) return;
      if (!brandMap[p.brand]) {
        brandMap[p.brand] = { name: p.brand, count: 0, categories: new Set() };
      }
      brandMap[p.brand].count++;
      if (p.category) brandMap[p.brand].categories.add(p.category);
    });
    return Object.values(brandMap).map(b => ({
      ...b,
      categories: Array.from(b.categories),
    })).sort((a, b) => b.count - a.count);
  };

  const loadBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('brand, category')
        .eq('is_active', true);

      if (err) throw err;
      const rows = data && data.length ? data : mockDb.getProducts();
      setBrands(buildBrandsList(rows));
    } catch {
      try {
        setBrands(buildBrandsList(mockDb.getProducts()));
      } catch {
        setError('Não foi possível carregar as marcas no momento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBrandProducts = async (brandName) => {
    setProdLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*, store:stores(name)')
        .eq('brand', brandName)
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (err) throw err;
      const list = data && data.length ? data : mockDb.getProducts().filter(p => p.brand === brandName);
      setBrandProds((list || []).map(p => ({
        ...p,
        icon:   p.icon_emoji || '🔩',
        compat: p.compatibility || '',
      })));
    } catch {
      const fallback = mockDb.getProducts().filter(p => p.brand === brandName);
      setBrandProds((fallback || []).map(p => ({
        ...p,
        icon:   p.icon_emoji || '🔩',
        compat: p.compatibility || '',
      })));
    } finally {
      setProdLoading(false);
    }
  };

  const filtered = brands
    .filter(b => catFilter === 'Todas' || b.categories.includes(catFilter))
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const getBrandStyle = (name) => BRAND_COLORS[name] || BRAND_COLORS['default'];

  return (
    <PageLayout
      hero={
        <div className="page-hero-inner container">
          <div className="page-hero-eyebrow"><i className="fa-solid fa-certificate" /> Marcas</div>
          <h1 className="page-hero-title">Só marcas<br /><span>originais</span></h1>
          <p className="page-hero-sub">Trabalhamos apenas com as melhores e mais confiáveis marcas do mercado.</p>
          <div className="page-hero-glyph"><i className="fa-solid fa-certificate" /></div>
        </div>
      }
    >
      <section className="section">
        <div className="container">

          {/* Toolbar */}
          <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}>
            <div className="search-bar-std">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Buscar marca…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
            <span style={{fontSize:'.85rem',color:'var(--gray-500)',fontWeight:500,whiteSpace:'nowrap'}}>
              <i className="fa-solid fa-certificate" style={{color:'var(--red)',marginRight:'.35rem'}} />
              {filtered.length} marca{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-banner-msg"><i className="fa-solid fa-triangle-exclamation" /> {error}</span>
              <button className="btn btn-outline btn-sm" onClick={loadBrands}>Tentar novamente</button>
            </div>
          )}

          {/* Category filter */}
          <div className="marcas-cat-strip">
            {CATS.map(c => (
              <button
                key={c}
                className={`cat-pill${catFilter === c ? ' active' : ''}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Brands grid */}
          {loading ? (
            <div className="marcas-grid">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} style={{height:110,background:'var(--gray-200)',borderRadius:'var(--radius-lg)',animation:'pulse 1.5s infinite'}} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-certificate" />
              <p>{search ? `Nenhuma marca encontrada para "${search}"` : 'Nenhuma marca disponível nesta categoria.'}</p>
              <button className="btn btn-outline" onClick={() => { setSearch(''); setCatFilter('Todas'); }}>Limpar filtros</button>
            </div>
          ) : (
            <div className="marcas-grid">
              {filtered.map(b => {
                const style   = getBrandStyle(b.name);
                const isActive = selected === b.name;
                return (
                  <div
                    key={b.name}
                    className={`marca-card${isActive ? ' active' : ''}`}
                    onClick={() => setSelected(isActive ? null : b.name)}
                  >
                    {/* Logo */}
                    <div
                      className="marca-logo"
                      style={{ background: style.bg, color: style.text }}
                    >
                      <span>{b.name.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div className="marca-info">
                      <div className="marca-name">{b.name}</div>
                      <div className="marca-count">{b.count} produto{b.count !== 1 ? 's' : ''}</div>
                    </div>
                    {/* Category chips */}
                    <div className="marca-cats">
                      {b.categories.slice(0,2).map(c => (
                        <span key={c} className="marca-cat-chip">{c}</span>
                      ))}
                      {b.categories.length > 2 && (
                        <span className="marca-cat-chip">+{b.categories.length - 2}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Produtos da marca selecionada */}
          {selected && (
            <div className="marcas-detail" style={{marginTop:'2.5rem'}}>
              <div className="cat-products-header">
                <div>
                  <h2 className="cat-products-title" style={{display:'flex',alignItems:'center',gap:'.7rem'}}>
                    <div style={{
                      width:40, height:40, borderRadius:8,
                      background: getBrandStyle(selected).bg,
                      color: getBrandStyle(selected).text,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:900, fontSize:'.9rem',
                    }}>
                      {selected.slice(0,2).toUpperCase()}
                    </div>
                    {selected}
                  </h2>
                  <p style={{color:'var(--gray-400)',marginTop:'.3rem'}}>
                    {prodLoading ? 'Carregando...' : `${brandProds.length} produto${brandProds.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                  <i className="fa-solid fa-xmark" /> Fechar
                </button>
              </div>

              {prodLoading ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem',marginTop:'1rem'}}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{height:220,background:'var(--gray-200)',borderRadius:'var(--radius-lg)',animation:'pulse 1.5s infinite'}} />
                  ))}
                </div>
              ) : brandProds.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-box-open" />
                  <p>Nenhum produto desta marca disponível.</p>
                </div>
              ) : (
                <div className="products-grid" style={{marginTop:'1rem'}}>
                  {brandProds.map(p => (
                    <div
                      key={p.id}
                      className="product-card light"
                      onClick={() => navigate(`/produto/${p.id}`)}
                    >
                      <div className="product-img">
                        {p.images?.length > 0
                          ? <img src={p.images[0]} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} />
                          : <span>{p.icon}</span>
                        }
                        {p.badge && <span className="product-badge-tag">{p.badge}</span>}
                      </div>
                      <div className="product-body">
                        <div className="product-brand">
                          {p.brand}
                          {p.store && <span style={{color:'var(--gray-400)',fontSize:'.75rem'}}> · {p.store.name}</span>}
                        </div>
                        <div className="product-name">{p.name}</div>
                        <div className="product-price">{fmt(p.price)}</div>
                        <button
                          className="btn btn-primary btn-full"
                          style={{marginTop:'.7rem',fontSize:'.88rem',padding:'.5rem'}}
                          onClick={e => { e.stopPropagation(); navigate(`/produto/${p.id}`); }}
                        >
                          <i className="fa-solid fa-eye" /> Ver produto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* CTA */}
      <section style={{background:'var(--black)',padding:'4rem 0'}}>
        <div className="container" style={{textAlign:'center'}}>
          <h2 style={{fontFamily:'var(--font-head)',fontSize:'2.4rem',fontWeight:900,color:'#fff',textTransform:'uppercase',marginBottom:'.8rem'}}>
            Tem uma loja de autopeças?
          </h2>
          <p style={{color:'rgba(255,255,255,.5)',marginBottom:'1.5rem',maxWidth:480,margin:'0 auto 1.5rem'}}>
            Cadastre seus produtos e alcance milhares de clientes.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register&type=merchant')}>
            Quero ser parceiro
          </button>
        </div>
      </section>
    </PageLayout>
  );
}