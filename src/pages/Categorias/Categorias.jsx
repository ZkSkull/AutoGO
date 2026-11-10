import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../lib/supabase.js';
import { mockDb } from '../../data/mockData';
import { fmt } from '../../data';
import './Categorias.css';

const CAT_DETAILS = {
  'Motor':         { icon: 'fa-gauge-high',        color: '#E11A2C', desc: 'Peças para o coração do seu veículo — velas, correias, juntas e muito mais.' },
  'Freios':        { icon: 'fa-circle-stop',       color: '#1A1A1A', desc: 'Pastilhas, discos, tambores e fluidos para a segurança na frenagem.' },
  'Suspensão':     { icon: 'fa-car-burst',         color: '#3B82F6', desc: 'Amortecedores, molas, coxins e pivôs para conforto e estabilidade.' },
  'Elétrica':      { icon: 'fa-bolt',              color: '#EAB308', desc: 'Baterias, alternadores, sensores e cabos elétricos originais.' },
  'Filtros':       { icon: 'fa-filter',            color: '#22C55E', desc: 'Filtros de óleo, ar, combustível e cabine para manter o motor limpo.' },
  'Transmissão':   { icon: 'fa-gears',             color: '#8B5CF6', desc: 'Embreagens, rolamentos, eixos e componentes de câmbio.' },
  'Arrefecimento': { icon: 'fa-temperature-half',  color: '#06B6D4', desc: 'Radiadores, termostatos, bombas d\'água e mangueiras.' },
  'Acessórios':    { icon: 'fa-wrench',            color: '#F97316', desc: 'Ferramentas, fluidos, tapetes e itens para customização.' },
};

export default function Categorias() {
  const navigate = useNavigate();

  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(null);
  const [catProducts, setCatProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selected) loadCatProducts(selected);
    else setCatProducts([]);
  }, [selected]);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      // Buscar contagem de produtos por categoria
      const { data, error: err } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true);

      if (err) throw err;

      const list = data && data.length ? data : mockDb.getProducts();
      const countMap = {};
      list.forEach(p => {
        countMap[p.category] = (countMap[p.category] || 0) + 1;
      });

      const cats = Object.keys(CAT_DETAILS).map(name => ({
        name,
        ...CAT_DETAILS[name],
        count: countMap[name] || 0,
      }));
      setCategories(cats);
    } catch {
      try {
        const list = mockDb.getProducts();
        const countMap = {};
        list.forEach(p => {
          countMap[p.category] = (countMap[p.category] || 0) + 1;
        });
        const cats = Object.keys(CAT_DETAILS).map(name => ({
          name, ...CAT_DETAILS[name], count: countMap[name] || 0,
        }));
        setCategories(cats);
      } catch {
        setError('Não foi possível carregar as categorias no momento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCatProducts = async (catName) => {
    setProdLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*, store:stores(name)')
        .eq('category', catName)
        .eq('is_active', true)
        .order('rating', { ascending: false });
      if (err) throw err;
      const list = data && data.length ? data : mockDb.getProducts({ category: catName });
      setCatProducts((list || []).map(p => ({
        ...p,
        icon:   p.icon_emoji || '🔩',
        compat: p.compatibility || '',
      })));
    } catch {
      const fallback = mockDb.getProducts({ category: catName });
      setCatProducts((fallback || []).map(p => ({
        ...p,
        icon:   p.icon_emoji || '🔩',
        compat: p.compatibility || '',
      })));
    } finally {
      setProdLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    !search.trim() ||
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout
      hero={
        <div className="page-hero-inner container">
          <div className="page-hero-eyebrow"><i className="fa-solid fa-layer-group" /> Categorias</div>
          <h1 className="page-hero-title">Explore por<br /><span>Categoria</span></h1>
          <p className="page-hero-sub">Navegue pelas categorias e encontre exatamente a peça que seu veículo precisa.</p>
          <div className="page-hero-glyph"><i className="fa-solid fa-gears" /></div>
        </div>
      }
    >
      {/* Grid de categorias */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="search-bar-std">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Pesquisar categoria ou tipo de peça…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
            <span style={{ fontSize: '.88rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              <i className="fa-solid fa-layer-group" style={{ color: 'var(--red)', marginRight: '.35rem' }} />
              {filteredCategories.length} categoria{filteredCategories.length !== 1 ? 's' : ''}
            </span>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-banner-msg"><i className="fa-solid fa-triangle-exclamation" /> {error}</span>
              <button className="btn btn-outline btn-sm" onClick={loadCategories}>Tentar novamente</button>
            </div>
          )}

          {loading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1rem'}}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{height:90,background:'var(--gray-200)',borderRadius:'var(--radius-lg)',animation:'pulse 1.5s infinite'}} />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-layer-group" />
              <p>Nenhuma categoria encontrada para "{search}".</p>
              <button className="btn btn-outline" onClick={() => setSearch('')}>Limpar busca</button>
            </div>
          ) : (
            <div className="cat-page-grid">
              {filteredCategories.map(cat => {
                const isActive = selected === cat.name;
                return (
                  <div
                    key={cat.name}
                    className={`cat-page-card${isActive ? ' active' : ''}`}
                    onClick={() => setSelected(isActive ? null : cat.name)}
                    style={{ '--cat-color': cat.color }}
                  >
                    <div className="cat-page-icon">
                      <i className={`fa-solid ${cat.icon}`} />
                    </div>
                    <div className="cat-page-body">
                      <h3>{cat.name}</h3>
                      <p>{cat.desc}</p>
                      <span className="cat-page-count">{cat.count} produto{cat.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="cat-page-arrow">
                      <i className={`fa-solid fa-chevron-${isActive ? 'up' : 'right'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Produtos da categoria selecionada */}
      {selected && (
        <section className="section" style={{background:'var(--gray-100)',paddingTop:'2rem'}}>
          <div className="container">
            <div className="cat-products-header">
              <div>
                <h2 className="cat-products-title">
                  <i className={`fa-solid ${CAT_DETAILS[selected]?.icon}`} style={{color: CAT_DETAILS[selected]?.color}} />
                  {selected}
                </h2>
                <p style={{color:'var(--gray-400)',marginTop:'.3rem'}}>
                  {prodLoading ? 'Carregando...' : `${catProducts.length} produto${catProducts.length !== 1 ? 's' : ''} encontrado${catProducts.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => navigate(`/client?cat=${encodeURIComponent(selected)}`)}>
                Ver todos <i className="fa-solid fa-arrow-right" />
              </button>
            </div>

            {prodLoading ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{height:220,background:'var(--gray-200)',borderRadius:'var(--radius-lg)',animation:'pulse 1.5s infinite'}} />
                ))}
              </div>
            ) : catProducts.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-box-open" />
                <p>Nenhum produto nesta categoria ainda.</p>
                <button className="btn btn-outline" onClick={() => setSelected(null)}>Ver outras categorias</button>
              </div>
            ) : (
              <div className="products-grid">
                {catProducts.map(p => (
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
                      <div className="product-brand">{p.brand} {p.store && <span style={{color:'var(--gray-400)',fontSize:'.75rem'}}>· {p.store.name}</span>}</div>
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
        </section>
      )}

      {/* CTA */}
      {!selected && (
        <section style={{background:'var(--black)',padding:'4rem 0'}}>
          <div className="container" style={{textAlign:'center'}}>
            <p style={{color:'rgba(255,255,255,.5)',marginBottom:'.5rem',fontFamily:'var(--font-head)',letterSpacing:'.1em',textTransform:'uppercase',fontSize:'.9rem'}}>
              Não encontrou o que procura?
            </p>
            <h2 style={{fontFamily:'var(--font-head)',fontSize:'2.4rem',fontWeight:900,color:'#fff',marginBottom:'1.5rem',textTransform:'uppercase'}}>
              Busque pela peça diretamente
            </h2>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/client')}>
              <i className="fa-solid fa-magnifying-glass" /> Ir para a loja
            </button>
          </div>
        </section>
      )}
    </PageLayout>
  );
}