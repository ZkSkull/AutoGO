import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../lib/supabase.js';
import { fmt } from '../../data';
import './Lojas.css';

const COVER_COLORS = ['#1A1A1A','#0D2137','#1A0A00','#0A1A0A','#1A0A1A','#0A0A1A','#1A1A0A'];

export default function Lojas() {
  const navigate = useNavigate();

  const [stores,    setStores]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [search,     setSearch]     = useState('');
  const [onlyOpen,   setOnlyOpen]   = useState(false);

  // Detail panel state
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeReviews,  setStoreReviews]  = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selected) loadStoreDetail(selected);
    else { setStoreProducts([]); setStoreReviews([]); }
  }, [selected]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*, owner:profiles(name)')
        .order('rating', { ascending: false });
      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreDetail = async (storeId) => {
    setDetailLoading(true);
    try {
      // Produtos da loja
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(4);
      setStoreProducts(prods || []);

      // Avaliações da loja
      const { data: revs } = await supabase
        .from('reviews')
        .select('*, user:profiles(name)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(3);
      setStoreReviews(revs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = stores
    .filter(s => !onlyOpen || s.is_open)
    .filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.address || '').toLowerCase().includes(search.toLowerCase())
    );

  const store = selected ? stores.find(s => s.id === selected) : null;

  return (
    <PageLayout
      hero={
        <div className="page-hero-inner container">
          <div className="page-hero-eyebrow"><i className="fa-solid fa-store" /> Lojas Parceiras</div>
          <h1 className="page-hero-title">Encontre a loja<br /><span>mais perto de você</span></h1>
          <p className="page-hero-sub">Lojas verificadas com as melhores avaliações da sua região.</p>
          <div className="page-hero-glyph"><i className="fa-solid fa-store" /></div>
        </div>
      }
    >
      <section className="section">
        <div className="container">

          {/* Toolbar */}
          <div className="lojas-toolbar">
            <div className="lojas-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Buscar por nome, categoria ou endereço…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)'}} onClick={() => setSearch('')}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
            <div className="lojas-stats">
              <label style={{display:'flex',alignItems:'center',gap:'.4rem',cursor:'pointer',fontSize:'.85rem',fontWeight:600,color:onlyOpen?'var(--green)':'var(--gray-400)'}}>
                <input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)} style={{accentColor:'var(--green)'}} />
                Somente abertas
              </label>
              <span><i className="fa-solid fa-store" /> {filtered.length} lojas</span>
              <span><i className="fa-solid fa-circle" style={{color:'var(--green)',fontSize:'.6rem'}} /> {stores.filter(s=>s.is_open).length} abertas</span>
            </div>
          </div>

          {/* Layout */}
          <div className={`lojas-layout${selected ? ' has-detail' : ''}`}>

            {/* Lista de lojas */}
            <div className="lojas-list">
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="loja-card" style={{padding:0,overflow:'hidden'}}>
                    <div style={{height:80,background:'var(--gray-200)',animation:'pulse 1.5s infinite'}} />
                    <div style={{padding:'1rem'}}>
                      <div style={{height:18,width:'60%',background:'var(--gray-200)',borderRadius:4,marginBottom:'.5rem',animation:'pulse 1.5s infinite'}} />
                      <div style={{height:14,width:'40%',background:'var(--gray-100)',borderRadius:4,animation:'pulse 1.5s infinite'}} />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-store-slash" />
                  <p>Nenhuma loja encontrada.</p>
                  {search && <button className="btn btn-outline" onClick={()=>setSearch('')}>Limpar busca</button>}
                </div>
              ) : filtered.map((s, idx) => (
                <div
                  key={s.id}
                  className={`loja-card${selected===s.id?' active':''}`}
                  onClick={() => setSelected(selected===s.id ? null : s.id)}
                >
                  <div className="loja-cover" style={{background: COVER_COLORS[idx % COVER_COLORS.length]}}>
                    {s.logo_url
                      ? <img src={s.logo_url} alt={s.name} style={{width:48,height:48,objectFit:'contain',borderRadius:8}} />
                      : <i className="fa-solid fa-store" />
                    }
                    <span className={`loja-status-tag ${s.is_open?'open':'closed'}`}>
                      {s.is_open ? 'Aberta agora' : 'Fechada'}
                    </span>
                  </div>
                  <div className="loja-body">
                    <div className="loja-header">
                      <div>
                        <h3 className="loja-name">{s.name}</h3>
                        <p className="loja-category">{s.category || 'Autopeças'}</p>
                      </div>
                      <div className="loja-rating">
                        <span className="rating-star">★</span>
                        <span className="rating-val">{Number(s.rating||5).toFixed(1)}</span>
                        <span className="rating-count">({s.total_reviews||0})</span>
                      </div>
                    </div>
                    <div className="loja-meta">
                      {s.address && <span><i className="fa-solid fa-location-dot" /> {s.address.split('—')[0]?.trim()}</span>}
                      {s.phone   && <span><i className="fa-solid fa-phone" /> {s.phone}</span>}
                    </div>
                    <button
                      className="btn btn-primary btn-full loja-cta"
                      onClick={e => { e.stopPropagation(); setSelected(s.id); }}
                    >
                      Ver detalhes <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Painel de detalhes */}
            {selected && store && (
              <div className="loja-detail">
                <div className="loja-detail-cover" style={{background: COVER_COLORS[stores.findIndex(s=>s.id===selected) % COVER_COLORS.length]}}>
                  <div className="loja-detail-avatar">
                    {store.logo_url
                      ? <img src={store.logo_url} alt={store.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                      : <i className="fa-solid fa-store" />
                    }
                  </div>
                  <button className="loja-detail-close" onClick={() => setSelected(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>

                <div className="loja-detail-body">
                  <div className="loja-detail-header">
                    <div>
                      <h2>{store.name}</h2>
                      <p style={{color:'var(--gray-400)',fontSize:'.9rem'}}>{store.category || 'Autopeças'}</p>
                    </div>
                    <div className="loja-detail-stars">
                      <span style={{color:'#F5A623',fontSize:'1.1rem'}}>★</span>
                      <strong>{Number(store.rating||5).toFixed(1)}</strong>
                      <span style={{color:'var(--gray-400)',fontSize:'.85rem'}}>({store.total_reviews||0} avaliações)</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.6rem .9rem',background:store.is_open?'rgba(34,197,94,.1)':'rgba(225,26,44,.08)',borderRadius:'var(--radius)',marginBottom:'.8rem'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:store.is_open?'var(--green)':'var(--red)'}} />
                    <span style={{fontSize:'.88rem',fontWeight:600,color:store.is_open?'var(--green)':'var(--red)'}}>
                      {store.is_open ? 'Aberta agora' : 'Fechada no momento'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="loja-detail-info">
                    {[
                      store.address && ['fa-location-dot', store.address],
                      store.phone   && ['fa-phone',        store.phone],
                      store.email   && ['fa-envelope',     store.email],
                      store.delivery_radius_km && ['fa-truck-fast', `Entrega em até ${store.delivery_radius_km} km`],
                    ].filter(Boolean).map(([icon, val]) => (
                      <div key={icon} className="loja-detail-row">
                        <i className={`fa-solid ${icon}`} />
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Produtos */}
                  <div className="loja-detail-section">
                    <h4>Produtos em destaque</h4>
                    {detailLoading ? (
                      <div style={{height:60,background:'var(--gray-100)',borderRadius:'var(--radius)',marginTop:'.6rem'}} />
                    ) : storeProducts.length === 0 ? (
                      <p style={{color:'var(--gray-400)',fontSize:'.85rem',marginTop:'.6rem'}}>Nenhum produto cadastrado ainda.</p>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:'.6rem',marginTop:'.8rem'}}>
                        {storeProducts.map(p => (
                          <div key={p.id} className="loja-product-row">
                            <span className="loja-product-icon">
                              {p.images?.length > 0
                                ? <img src={p.images[0]} alt={p.name} style={{width:36,height:36,objectFit:'cover',borderRadius:6}} />
                                : p.icon_emoji || '🔩'
                              }
                            </span>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:600,fontSize:'.9rem'}}>{p.name}</div>
                              <div style={{fontSize:'.8rem',color:'var(--gray-400)'}}>{p.brand} · {p.category}</div>
                            </div>
                            <span style={{fontFamily:'var(--font-head)',fontWeight:900,color:'var(--red)',fontSize:'1rem'}}>{fmt(p.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Avaliações */}
                  <div className="loja-detail-section">
                    <h4>Avaliações recentes</h4>
                    {detailLoading ? (
                      <div style={{height:60,background:'var(--gray-100)',borderRadius:'var(--radius)',marginTop:'.6rem'}} />
                    ) : storeReviews.length === 0 ? (
                      <p style={{color:'var(--gray-400)',fontSize:'.85rem',marginTop:'.6rem'}}>Nenhuma avaliação ainda.</p>
                    ) : storeReviews.map(r => (
                      <div key={r.id} className="loja-review-card">
                        <div className="loja-review-header">
                          <div className="loja-review-avatar">
                            {r.user?.name?.slice(0,2).toUpperCase() || '??'}
                          </div>
                          <div>
                            <div style={{fontWeight:600,fontSize:'.88rem'}}>{r.user?.name || 'Anônimo'}</div>
                            <div style={{color:'#F5A623',fontSize:'.8rem'}}>{'★'.repeat(r.rating)}</div>
                          </div>
                          <div style={{marginLeft:'auto',fontSize:'.78rem',color:'var(--gray-400)'}}>
                            {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {r.comment && <p style={{fontSize:'.85rem',color:'var(--gray-500)',marginTop:'.5rem'}}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary btn-full" style={{marginTop:'.5rem'}} onClick={() => navigate('/client')}>
                    <i className="fa-solid fa-bag-shopping" /> Ver todos os produtos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:'var(--black)',padding:'4rem 0'}}>
        <div className="container" style={{textAlign:'center'}}>
          <h2 style={{fontFamily:'var(--font-head)',fontSize:'2.4rem',fontWeight:900,color:'#fff',textTransform:'uppercase',marginBottom:'.8rem'}}>
            Tem uma loja de autopeças?
          </h2>
          <p style={{color:'rgba(255,255,255,.5)',marginBottom:'1.5rem',maxWidth:480,margin:'0 auto 1.5rem'}}>
            Cadastre-se como parceiro e alcance milhares de clientes na sua região.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register&type=merchant')}>
            Quero ser parceiro
          </button>
        </div>
      </section>
    </PageLayout>
  );
}