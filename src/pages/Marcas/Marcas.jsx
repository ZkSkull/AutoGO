import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { PRODUCTS, fmt } from '../../data';
import './Marcas.css';

const ALL_BRANDS = [
  { name: 'Bosch',       textColor: '#C8102E', type: 'text-icon', category: 'Motor / Elétrica',     country: '🇩🇪', desc: 'Líder mundial em tecnologia automotiva, com peças de altíssima precisão.' },
  { name: 'NGK',         textColor: '#fff',    type: 'circle',    bg: '#E31837', category: 'Motor',  country: '🇯🇵', desc: 'A marca mais confiável em velas de ignição e sensores para veículos.' },
  { name: 'Nakata',      textColor: '#003087', type: 'text',      category: 'Suspensão',             country: '🇧🇷', desc: 'Empresa brasileira de excelência em componentes de suspensão e direção.' },
  { name: 'Mobil',       textColor: '#E31837', type: 'text',      category: 'Lubrificantes',         country: '🇺🇸', desc: 'Óleos e lubrificantes de alta performance para motores modernos.' },
  { name: 'Mann Filter', textColor: '#fff',    type: 'box',       bg: '#007A33', category: 'Filtros',country: '🇩🇪', desc: 'Filtros originais de alta eficiência para motor, ar e combustível.' },
  { name: 'Castrol',     textColor: '#009A44', type: 'text',      category: 'Lubrificantes',         country: '🇬🇧', desc: 'Lubrificantes sintéticos e minerais para todas as aplicações automotivas.' },
  { name: 'Dayco',       textColor: '#00AEEF', type: 'dash',      category: 'Motor',                 country: '🇺🇸', desc: 'Especialista em correias dentadas, kits de distribuição e tensores.' },
  { name: 'LUK',         textColor: '#000',    type: 'box-dark',  bg: '#F5C400', category: 'Transmissão', country: '🇩🇪', desc: 'O padrão de referência em kits de embreagem para veículos leves e pesados.' },
  { name: 'Moura',       textColor: '#E31837', type: 'text',      category: 'Elétrica',              country: '🇧🇷', desc: 'Baterias automotivas de alta durabilidade para carros, motos e caminhões.' },
  { name: 'Valeo',       textColor: '#78BE20', type: 'text',      category: 'Elétrica / Arrefecimento', country: '🇫🇷', desc: 'Inovação em sistemas elétricos, faróis e climatização automotiva.' },
  { name: 'Duralast',    textColor: '#003087', type: 'italic',    category: 'Freios / Elétrica',     country: '🇺🇸', desc: 'Peças de alta durabilidade para freios, baterias e sistemas elétricos.' },
  { name: 'Wega',        textColor: '#C8102E', type: 'text',      category: 'Motor / Filtros',       country: '🇧🇷', desc: 'Filtros e peças de motor com qualidade original para veículos nacionais.' },
  { name: 'Monroe',      textColor: '#E31837', type: 'text',      category: 'Suspensão',             country: '🇺🇸', desc: 'Amortecedores líderes de mercado para conforto e segurança na direção.' },
  { name: 'TRW',         textColor: '#003087', type: 'text',      category: 'Freios',                country: '🇩🇪', desc: 'Sistemas de freio e segurança ativa de classe mundial.' },
  { name: 'Gates',       textColor: '#E31837', type: 'text',      category: 'Motor',                 country: '🇺🇸', desc: 'Kits de correia dentada e componentes de transmissão de alta confiabilidade.' },
  { name: 'Heliar',      textColor: '#003087', type: 'text',      category: 'Elétrica',              country: '🇧🇷', desc: 'Baterias com tecnologia avançada e maior vida útil para o seu veículo.' },
  { name: 'Brembo',      textColor: '#E31837', type: 'text',      category: 'Freios',                country: '🇮🇹', desc: 'Discos e pastilhas de freio de alto desempenho, referência no automobilismo.' },
  { name: 'Mahle',       textColor: '#0057A8', type: 'text',      category: 'Motor / Filtros',       country: '🇩🇪', desc: 'Filtros, pistões e componentes de motor com precisão alemã.' },
  { name: 'Cofap',       textColor: '#E31837', type: 'text',      category: 'Suspensão',             country: '🇧🇷', desc: 'Amortecedores e componentes de suspensão fabricados no Brasil.' },
  { name: 'Modine',      textColor: '#003087', type: 'text',      category: 'Arrefecimento',         country: '🇺🇸', desc: 'Radiadores e componentes de arrefecimento de alta eficiência.' },
];

const CATS = ['Todas', 'Motor', 'Freios', 'Suspensão', 'Elétrica', 'Filtros', 'Transmissão', 'Arrefecimento', 'Lubrificantes'];

function BrandLogo({ brand, size = 'md' }) {
  const sz = size === 'lg' ? '2rem' : '1.35rem';
  const base = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' };

  if (brand.type === 'circle') return (
    <div style={{ ...base, background: brand.bg, borderRadius: '50%', width: size === 'lg' ? 80 : 64, height: size === 'lg' ? 80 : 64, flexDirection: 'column', gap: 1 }}>
      <span style={{ color: brand.textColor, fontWeight: 900, fontSize: size === 'lg' ? '1.1rem' : '.9rem', fontFamily: 'var(--font-head)' }}>{brand.name}</span>
      <span style={{ color: brand.textColor, fontSize: '.55rem', fontWeight: 700, opacity: .85 }}>SPARK PLUGS</span>
    </div>
  );
  if (brand.type === 'box' || brand.type === 'box-dark') return (
    <div style={{ background: brand.bg, border: `2px solid ${brand.textColor === '#000' ? '#F5C400' : brand.bg}`, borderRadius: 6, padding: '5px 12px' }}>
      <span style={{ color: brand.textColor, fontWeight: 900, fontSize: sz, fontFamily: 'var(--font-head)', letterSpacing: '.06em' }}>{brand.name}</span>
    </div>
  );
  if (brand.type === 'italic') return (
    <span style={{ color: brand.textColor, fontStyle: 'italic', fontWeight: 700, fontSize: sz, fontFamily: 'Georgia, serif' }}>{brand.name}</span>
  );
  if (brand.type === 'dash') return (
    <span style={{ color: brand.textColor, fontWeight: 900, fontSize: sz, fontFamily: 'var(--font-head)', letterSpacing: '.08em' }}>—{brand.name}—</span>
  );
  if (brand.type === 'text-icon') return (
    <div style={base}>
      <span style={{ color: brand.textColor, fontSize: sz }}>⊕</span>
      <span style={{ color: brand.textColor, fontWeight: 900, fontSize: sz, fontFamily: 'var(--font-head)' }}>{brand.name}</span>
    </div>
  );
  return (
    <span style={{ color: brand.textColor, fontWeight: 900, fontSize: sz, fontFamily: 'var(--font-head)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
      {brand.name}
    </span>
  );
}

export default function Marcas() {
  const navigate = useNavigate();
  const [cat, setCat]         = useState('Todas');
  const [selected, setSelected] = useState(null);

  const filtered = cat === 'Todas'
    ? ALL_BRANDS
    : ALL_BRANDS.filter(b => b.category.includes(cat));

  const brand = selected ? ALL_BRANDS.find(b => b.name === selected) : null;
  const brandProducts = brand ? PRODUCTS.filter(p => p.brand === brand.name) : [];

  return (
    <PageLayout
      hero={
        <div className="page-hero-inner container">
          <div className="page-hero-eyebrow"><i className="fa-solid fa-certificate" /> Marcas Parceiras</div>
          <h1 className="page-hero-title">Só Marcas<br /><span>Originais</span></h1>
          <p className="page-hero-sub">Trabalhamos apenas com marcas certificadas. Qualidade garantida em cada peça.</p>
          <div className="page-hero-glyph"><i className="fa-solid fa-award" /></div>
        </div>
      }
    >
      {/* Category filter */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="marcas-filter-bar">
            {CATS.map(c => (
              <button
                key={c}
                className={`marcas-filter-btn${cat === c ? ' active' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="marcas-count"><strong>{filtered.length}</strong> marcas encontradas</p>
        </div>
      </section>

      {/* Brands grid */}
      <section className="section" style={{ paddingTop: '1.5rem' }}>
        <div className="container">
          <div className={`marcas-grid${selected ? ' has-detail' : ''}`}>

            {/* Grid */}
            <div className="marcas-logo-grid">
              {filtered.map(b => (
                <div
                  key={b.name}
                  className={`marca-card${selected === b.name ? ' active' : ''}`}
                  onClick={() => setSelected(selected === b.name ? null : b.name)}
                >
                  <div className="marca-logo-wrap">
                    <BrandLogo brand={b} />
                  </div>
                  <div className="marca-card-footer">
                    <span>{b.country}</span>
                    <span className="marca-category-tag">{b.category.split(' / ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selected && brand && (
              <div className="marca-detail">
                <button className="marca-detail-close" onClick={() => setSelected(null)}>
                  <i className="fa-solid fa-xmark" />
                </button>
                <div className="marca-detail-logo">
                  <BrandLogo brand={brand} size="lg" />
                </div>
                <h2 className="marca-detail-name">{brand.name}</h2>
                <div className="marca-detail-meta">
                  <span>{brand.country} {brand.category}</span>
                </div>
                <p className="marca-detail-desc">{brand.desc}</p>

                {brandProducts.length > 0 && (
                  <div className="marca-detail-products">
                    <h4>Produtos disponíveis</h4>
                    {brandProducts.map(p => (
                      <div key={p.id} className="marca-product-row">
                        <span className="marca-product-icon">{p.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}</div>
                          <div style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>{p.category}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, color: 'var(--red)' }}>{fmt(p.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: '1.2rem' }}
                  onClick={() => navigate(`/client?search=${encodeURIComponent(brand.name)}`)}
                >
                  <i className="fa-solid fa-magnifying-glass" /> Ver todos os produtos {brand.name}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}