import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { PRODUCTS, CATEGORIES, fmt } from '../../data';
import './Categorias.css';

const CAT_DETAILS = {
  'Motor':         { icon: 'fa-engine',          color: '#E11A2C', desc: 'Peças para o coração do seu veículo — velas, correias, juntas e muito mais.' },
  'Freios':        { icon: 'fa-circle-stop',      color: '#1A1A1A', desc: 'Pastilhas, discos, tambores e fluidos para a segurança na frenagem.' },
  'Suspensão':     { icon: 'fa-car-burst',        color: '#3B82F6', desc: 'Amortecedores, molas, coxins e pivôs para conforto e estabilidade.' },
  'Elétrica':      { icon: 'fa-bolt',             color: '#EAB308', desc: 'Baterias, alternadores, sensores e cabos elétricos originais.' },
  'Filtros':       { icon: 'fa-filter',           color: '#22C55E', desc: 'Filtros de óleo, ar, combustível e cabine para manter o motor limpo.' },
  'Transmissão':   { icon: 'fa-gears',            color: '#8B5CF6', desc: 'Embreagens, rolamentos, eixos e componentes de câmbio.' },
  'Arrefecimento': { icon: 'fa-temperature-half', color: '#06B6D4', desc: 'Radiadores, termostatos, bombas d\'água e mangueiras.' },
  'Acessórios':    { icon: 'fa-wrench',           color: '#F97316', desc: 'Ferramentas, fluidos, tapetes e itens para customização.' },
};

export default function Categorias() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const catProducts = selected ? PRODUCTS.filter(p => p.category === selected) : [];

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
      <section className="section">
        <div className="container">
          <div className="cat-page-grid">
            {CATEGORIES.map(cat => {
              const detail = CAT_DETAILS[cat.label] || {};
              const count  = PRODUCTS.filter(p => p.category === cat.label).length;
              const isActive = selected === cat.label;
              return (
                <div
                  key={cat.label}
                  className={`cat-page-card${isActive ? ' active' : ''}`}
                  onClick={() => setSelected(isActive ? null : cat.label)}
                  style={{ '--cat-color': detail.color || 'var(--red)' }}
                >
                  <div className="cat-page-icon"><i className={cat.icon} /></div>
                  <div className="cat-page-body">
                    <h3>{cat.label}</h3>
                    <p>{detail.desc}</p>
                    <span className="cat-page-count">{count} produtos</span>
                  </div>
                  <div className="cat-page-arrow">
                    <i className={`fa-solid fa-chevron-${isActive ? 'up' : 'right'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selected && (
        <section className="section" style={{ background: 'var(--gray-100)', paddingTop: '2rem' }}>
          <div className="container">
            <div className="cat-products-header">
              <div>
                <h2 className="cat-products-title">
                  <i className={`fa-solid ${CAT_DETAILS[selected]?.icon}`} style={{ color: CAT_DETAILS[selected]?.color }} />
                  {selected}
                </h2>
                <p style={{ color: 'var(--gray-400)', marginTop: '.3rem' }}>{catProducts.length} produtos encontrados</p>
              </div>
              <button className="btn btn-primary" onClick={() => navigate(`/client?cat=${encodeURIComponent(selected)}`)}>
                Ver todos <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
            <div className="products-grid">
              {catProducts.map(p => (
                <div key={p.id} className="product-card light" onClick={() => navigate('/client?cat=' + encodeURIComponent(selected))}>
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
                      onClick={e => { e.stopPropagation(); navigate('/client?cat=' + encodeURIComponent(selected)); }}
                    >
                      <i className="fa-solid fa-cart-plus" /> Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!selected && (
        <section style={{ background: 'var(--black)', padding: '4rem 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
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