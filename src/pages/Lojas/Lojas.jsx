import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { STORES, PRODUCTS, REVIEWS_DATA, fmt } from '../../data';
import './Lojas.css';

const STORE_EXTRAS = {
  1: { cover: '#1A1A1A', specialties: ['Motor','Filtros','Freios'], hours: 'Seg–Sex 8h–18h | Sáb 8h–13h', since: 2012, address: 'Rua das Peças, 100 — Centro, São Paulo' },
  2: { cover: '#0D2137', specialties: ['Elétrica','Motor','Transmissão'], hours: 'Seg–Sex 8h–17h | Sáb 8h–12h', since: 2008, address: 'Av. das Indústrias, 450 — Lapa, São Paulo' },
  3: { cover: '#1A0A00', specialties: ['Importados','Suspensão','Arrefecimento'], hours: 'Seg–Sex 7h–19h | Sáb 8h–15h', since: 2005, address: 'Rua dos Importados, 77 — Brás, São Paulo' },
  4: { cover: '#0A1A0A', specialties: ['Freios','Suspensão'], hours: 'Seg–Sex 8h–17h', since: 2018, address: 'Av. Brasil, 1200 — Santo André, SP' },
};

export default function Lojas() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = STORES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const store   = selected ? STORES.find(s => s.id === selected) : null;
  const extra   = selected ? STORE_EXTRAS[selected] : null;
  const storeProducts = selected ? PRODUCTS.filter(p => p.storeId === selected) : [];

  return (
    <PageLayout
      hero={
        <div className="page-hero-inner container">
          <div className="page-hero-eyebrow"><i className="fa-solid fa-store" /> Lojas Parceiras</div>
          <h1 className="page-hero-title">Encontre a loja<br /><span>mais perto de você</span></h1>
          <p className="page-hero-sub">+340 lojas verificadas com as melhores avaliações da sua região.</p>
          <div className="page-hero-glyph"><i className="fa-solid fa-store" /></div>
        </div>
      }
    >
      <section className="section">
        <div className="container">

          {/* Search + filter bar */}
          <div className="lojas-toolbar">
            <div className="lojas-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Buscar por nome ou especialidade…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="lojas-stats">
              <span><i className="fa-solid fa-store" /> {filtered.length} lojas</span>
              <span><i className="fa-solid fa-circle" style={{ color: 'var(--green)', fontSize: '.6rem' }} /> {STORES.filter(s => s.open).length} abertas agora</span>
            </div>
          </div>

          {/* Two-column layout when a store is selected */}
          <div className={`lojas-layout${selected ? ' has-detail' : ''}`}>

            {/* Store list */}
            <div className="lojas-list">
              {filtered.map(s => {
                const ex = STORE_EXTRAS[s.id];
                return (
                  <div
                    key={s.id}
                    className={`loja-card${selected === s.id ? ' active' : ''}`}
                    onClick={() => setSelected(selected === s.id ? null : s.id)}
                  >
                    {/* Cover accent */}
                    <div className="loja-cover" style={{ background: ex?.cover || 'var(--gray-900)' }}>
                      <i className="fa-solid fa-store" />
                      <span className={`loja-status-tag ${s.open ? 'open' : 'closed'}`}>
                        {s.open ? 'Aberta agora' : 'Fechada'}
                      </span>
                    </div>
                    <div className="loja-body">
                      <div className="loja-header">
                        <div>
                          <h3 className="loja-name">{s.name}</h3>
                          <p className="loja-category">{s.category}</p>
                        </div>
                        <div className="loja-rating">
                          <span className="rating-star">★</span>
                          <span className="rating-val">{s.rating}</span>
                          <span className="rating-count">({s.reviews})</span>
                        </div>
                      </div>
                      <div className="loja-meta">
                        <span><i className="fa-solid fa-location-dot" /> {s.distance}</span>
                        <span><i className="fa-solid fa-tags" /> {s.products} produtos</span>
                        {ex && <span><i className="fa-solid fa-calendar" /> Desde {ex.since}</span>}
                      </div>
                      {ex && (
                        <div className="loja-specialties">
                          {ex.specialties.map(sp => <span key={sp} className="specialty-chip">{sp}</span>)}
                        </div>
                      )}
                      <button
                        className="btn btn-primary btn-full loja-cta"
                        onClick={e => { e.stopPropagation(); navigate('/client'); }}
                      >
                        Ver produtos <i className="fa-solid fa-arrow-right" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Store detail panel */}
            {selected && store && extra && (
              <div className="loja-detail">
                <div className="loja-detail-cover" style={{ background: extra.cover }}>
                  <div className="loja-detail-avatar"><i className="fa-solid fa-store" /></div>
                  <button className="loja-detail-close" onClick={() => setSelected(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                <div className="loja-detail-body">
                  <div className="loja-detail-header">
                    <div>
                      <h2>{store.name}</h2>
                      <p style={{ color: 'var(--gray-400)', fontSize: '.9rem' }}>{store.category}</p>
                    </div>
                    <div className="loja-detail-stars">
                      <span style={{ color: '#F5A623', fontSize: '1.1rem' }}>★</span>
                      <strong>{store.rating}</strong>
                      <span style={{ color: 'var(--gray-400)', fontSize: '.85rem' }}>({store.reviews} avaliações)</span>
                    </div>
                  </div>
                  {/* Info rows */}
                  <div className="loja-detail-info">
                    {[
                      ['fa-location-dot', extra.address],
                      ['fa-clock',        extra.hours],
                      ['fa-tags',         `${store.products} produtos disponíveis`],
                      ['fa-calendar',     `Parceira desde ${extra.since}`],
                    ].map(([icon, val]) => (
                      <div key={icon} className="loja-detail-row">
                        <i className={`fa-solid ${icon}`} />
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Specialties */}
                  <div className="loja-detail-section">
                    <h4>Especialidades</h4>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.6rem' }}>
                      {extra.specialties.map(sp => <span key={sp} className="specialty-chip large">{sp}</span>)}
                    </div>
                  </div>
                  {/* Sample products */}
                  <div className="loja-detail-section">
                    <h4>Produtos em destaque</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '.8rem' }}>
                      {storeProducts.slice(0, 4).map(p => (
                        <div key={p.id} className="loja-product-row">
                          <span className="loja-product-icon">{p.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}</div>
                            <div style={{ fontSize: '.8rem', color: 'var(--gray-400)' }}>{p.brand}</div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, color: 'var(--red)', fontSize: '1rem' }}>{fmt(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Reviews */}
                  <div className="loja-detail-section">
                    <h4>Avaliações recentes</h4>
                    {REVIEWS_DATA.slice(0, 2).map(r => (
                      <div key={r.user} className="loja-review-card">
                        <div className="loja-review-header">
                          <div className="loja-review-avatar">{r.initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{r.user}</div>
                            <div style={{ color: '#F5A623', fontSize: '.8rem' }}>{'★'.repeat(r.stars)}</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--gray-400)' }}>{r.date}</div>
                        </div>
                        <p style={{ fontSize: '.85rem', color: 'var(--gray-500)', marginTop: '.5rem' }}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-full" style={{ marginTop: '.5rem' }} onClick={() => navigate('/client')}>
                    <i className="fa-solid fa-bag-shopping" /> Ver todos os produtos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--black)', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: '.8rem' }}>
            Tem uma loja de autopeças?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: '1.5rem', maxWidth: 480, margin: '0 auto 1.5rem' }}>
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