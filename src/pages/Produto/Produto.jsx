import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useApp } from '../../context/AppContext';
import { PRODUCTS, STORES, REVIEWS_DATA, fmt } from '../../data';
import './Produto.css';

const CONDITION_LABEL = { new: 'Novo', reman: 'Remanufaturado', used: 'Usado' };

export default function Produto() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { addToCart, toggleFav, favorites, showToast } = useApp();

  const product = PRODUCTS.find(p => p.id === Number(id));
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('descricao');

  if (!product) {
    return (
      <PageLayout>
        <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: 'var(--red)', display: 'block', marginBottom: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Produto não encontrado</h2>
          <button className="btn btn-primary" onClick={() => navigate('/client')}>Voltar à loja</button>
        </div>
      </PageLayout>
    );
  }

  const store   = STORES.find(s => s.id === product.storeId);
  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const isFav   = favorites.includes(product.id);

  const handleAddCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  };

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="produto-breadcrumb">
        <div className="container produto-bc-inner">
          <span onClick={() => navigate('/')} className="bc-link">Início</span>
          <i className="fa-solid fa-chevron-right" />
          <span onClick={() => navigate('/categorias')} className="bc-link">Categorias</span>
          <i className="fa-solid fa-chevron-right" />
          <span onClick={() => navigate('/categorias')} className="bc-link">{product.category}</span>
          <i className="fa-solid fa-chevron-right" />
          <span className="bc-current">{product.name}</span>
        </div>
      </div>

      {/* Main */}
      <section className="section produto-section">
        <div className="container">
          <div className="produto-layout">

            {/* LEFT — imagem */}
            <div className="produto-image-col">
              <div className="produto-img-main">
                <span className="produto-img-emoji">{product.icon}</span>
                {product.badge && <span className="product-badge-tag">{product.badge}</span>}
              </div>
              <div className="produto-img-thumbs">
                {[product.icon, product.icon, product.icon].map((ic, i) => (
                  <div key={i} className={`produto-thumb${i === 0 ? ' active' : ''}`}>{ic}</div>
                ))}
              </div>
            </div>

            {/* RIGHT — info */}
            <div className="produto-info-col">
              <div className="produto-meta-top">
                <span className="produto-category-tag">{product.category}</span>
                <span className="produto-condition-tag">{CONDITION_LABEL[product.condition] || 'Novo'}</span>
              </div>

              <h1 className="produto-title">{product.name}</h1>

              <div className="produto-rating-row">
                <div className="produto-stars">
                  {[1,2,3,4,5].map(s => (
                    <i key={s} className={`fa-${s <= Math.round(product.rating) ? 'solid' : 'regular'} fa-star`} />
                  ))}
                </div>
                <span className="produto-rating-val">{product.rating}</span>
                <span className="produto-rating-count">(127 avaliações)</span>
              </div>

              <div className="produto-price-block">
                <div className="produto-price">{fmt(product.price)}</div>
                <div className="produto-price-installment">
                  ou 12x de {fmt(product.price / 12)} sem juros
                </div>
                <div className="produto-pix-price">
                  <i className="fa-brands fa-pix" /> {fmt(product.price * 0.95)} no Pix (5% off)
                </div>
              </div>

              <div className="produto-stock">
                <i
                  className={`fa-solid fa-${product.stock > 0 ? 'circle-check' : 'circle-xmark'}`}
                  style={{ color: product.stock > 0 ? 'var(--green)' : 'var(--red)' }}
                />
                <span>{product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}</span>
              </div>

              <div className="produto-code-row">
                <span>Código: <strong>{product.code}</strong></span>
                <span>Marca: <strong>{product.brand}</strong></span>
              </div>

              <div className="produto-actions-block">
                <div className="produto-qty-row">
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
                    <i className="fa-solid fa-minus" style={{ fontSize: '.75rem' }} />
                  </button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>
                    <i className="fa-solid fa-plus" style={{ fontSize: '.75rem' }} />
                  </button>
                </div>
                <button className="btn btn-primary produto-buy-btn" onClick={handleAddCart} disabled={product.stock === 0}>
                  <i className="fa-solid fa-cart-plus" /> Adicionar ao carrinho
                </button>
                <button
                  className="btn-fav"
                  onClick={() => {
                    toggleFav(product.id);
                    showToast(isFav ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'info');
                  }}
                >
                  <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart`} />
                </button>
              </div>

              <button
                className="btn btn-dark btn-full"
                style={{ marginTop: '.5rem' }}
                onClick={() => { handleAddCart(); navigate('/client'); }}
              >
                <i className="fa-solid fa-bolt" /> Comprar agora
              </button>

              <div className="produto-delivery-card">
                <div className="delivery-option">
                  <i className="fa-solid fa-bolt" style={{ color: 'var(--red)' }} />
                  <div>
                    <strong>Entrega Expressa</strong>
                    <span>Receba em até 45 minutos · R$ 8,90</span>
                  </div>
                </div>
                <div className="delivery-option">
                  <i className="fa-solid fa-truck" style={{ color: 'var(--gray-500)' }} />
                  <div>
                    <strong>Entrega Padrão</strong>
                    <span>Receba em 2–4h · Grátis acima de R$ 100</span>
                  </div>
                </div>
                <div className="delivery-option">
                  <i className="fa-solid fa-store" style={{ color: 'var(--gray-500)' }} />
                  <div>
                    <strong>Retirar na Loja</strong>
                    <span>Pronto em 30 min · Grátis</span>
                  </div>
                </div>
              </div>

              {store && (
                <div className="produto-store-badge" onClick={() => navigate('/lojas')}>
                  <div className="store-badge-avatar"><i className="fa-solid fa-store" /></div>
                  <div className="store-badge-info">
                    <strong>{store.name}</strong>
                    <span>
                      <i className="fa-solid fa-star" style={{ color: '#F5A623' }} /> {store.rating} · {store.distance} · {store.open ? '🟢 Aberta' : '🔴 Fechada'}
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: 'var(--gray-400)', marginLeft: 'auto' }} />
                </div>
              )}
            </div>
          </div>

          {/* TABS */}
          <div className="produto-tabs">
            {[
              ['descricao', 'Descrição'],
              ['compat',    'Compatibilidade'],
              ['avaliacoes','Avaliações'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`produto-tab${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="produto-tab-content">
            {activeTab === 'descricao' && (
              <div className="tab-descricao">
                <h3>Sobre o produto</h3>
                <p>
                  O {product.name} da marca {product.brand} é uma peça de alta qualidade,
                  desenvolvida para oferecer máxima durabilidade e desempenho. Fabricado com
                  materiais premium e certificado pelo fabricante, garante encaixe e
                  funcionamento perfeitos no seu veículo.
                </p>
                <div className="tab-specs-grid">
                  {[
                    ['Marca',     product.brand],
                    ['Código',    product.code],
                    ['Categoria', product.category],
                    ['Condição',  CONDITION_LABEL[product.condition]],
                    ['Estoque',   `${product.stock} unidades`],
                    ['Avaliação', `${product.rating} / 5`],
                  ].map(([k, v]) => (
                    <div key={k} className="spec-row">
                      <span className="spec-key">{k}</span>
                      <span className="spec-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'compat' && (
              <div className="tab-compat">
                <h3>Veículos compatíveis</h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>
                  Confirme sempre o código da peça antes da compra.
                </p>
                <div className="compat-list">
                  {product.compat.split(',').map(c => (
                    <div key={c} className="compat-item">
                      <i className="fa-solid fa-car" style={{ color: 'var(--red)' }} />
                      <span>{c.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'avaliacoes' && (
              <div className="tab-reviews">
                <div className="reviews-summary-row">
                  <div className="big-rating-block">
                    <span className="big-rating-val">{product.rating}</span>
                    <div className="big-rating-stars">{'★'.repeat(Math.round(product.rating))}</div>
                    <span style={{ fontSize: '.85rem', color: 'var(--gray-400)' }}>127 avaliações</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {[[5,72],[4,18],[3,6],[2,3],[1,1]].map(([s, pct]) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', fontSize: '.84rem', color: 'var(--gray-500)' }}>
                        <span>{s} ★</span>
                        <div style={{ flex: 1, height: 8, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: pct + '%', height: '100%', background: '#F5A623', borderRadius: 4 }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem', marginTop: '1.5rem' }}>
                  {REVIEWS_DATA.map(r => (
                    <div key={r.user} style={{ background: 'var(--gray-100)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.7rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gray-800)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.82rem', fontWeight: 700 }}>
                          {r.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{r.user}</div>
                          <div style={{ color: '#F5A623', fontSize: '.82rem' }}>{'★'.repeat(r.stars)}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--gray-400)' }}>{r.date}</div>
                      </div>
                      <p style={{ fontSize: '.88rem', color: 'var(--gray-600)' }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Produtos relacionados */}
          {related.length > 0 && (
            <div className="produto-related">
              <h2 className="related-title">Produtos Relacionados</h2>
              <div className="products-grid">
                {related.map(p => (
                  <div
                    key={p.id}
                    className="product-card light"
                    onClick={() => { navigate(`/produto/${p.id}`); window.scrollTo(0, 0); }}
                  >
                    <div className="product-img">
                      <span>{p.icon}</span>
                      {p.badge && <span className="product-badge-tag">{p.badge}</span>}
                    </div>
                    <div className="product-body">
                      <div className="product-brand">{p.brand}</div>
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">{fmt(p.price)}</div>
                      <button
                        className="btn btn-primary btn-full"
                        style={{ marginTop: '.7rem', fontSize: '.86rem', padding: '.48rem' }}
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(p);
                          showToast(`${p.name} adicionado!`, 'success');
                        }}
                      >
                        <i className="fa-solid fa-cart-plus" /> Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}