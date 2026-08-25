import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase.js';
import { fmt } from '../../data';
import './Produto.css';

const CONDITION_LABEL = { new: 'Novo', reman: 'Remanufaturado', used: 'Usado' };

export default function Produto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleFav, favorites, showToast } = useApp();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('descricao');

  useEffect(() => {
    loadProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      // Buscar produto pelo ID
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(id, name, rating, total_reviews, is_open, address, phone)')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) { setNotFound(true); return; }

      // Normalizar campos
      const normalized = {
        ...data,
        icon: data.icon_emoji || '🔩',
        compat: data.compatibility || '',
        badge: data.badge || '',
        storeId: data.store_id,
      };
      setProduct(normalized);

      // Buscar produtos relacionados (mesma categoria)
      const { data: rel } = await supabase
        .from('products')
        .select('*')
        .eq('category', data.category)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);

      setRelated((rel || []).map(p => ({ ...p, icon: p.icon_emoji || '🔩', compat: p.compatibility || '' })));

      // Buscar avaliações da loja
      if (data.store_id) {
        const { data: revs } = await supabase
          .from('reviews')
          .select('*, user:profiles(name)')
          .eq('store_id', data.store_id)
          .order('created_at', { ascending: false })
          .limit(5);
        setReviews(revs || []);
      }
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  };

  const isFav = product ? favorites.includes(product.id) : false;

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <i className="fa-solid fa-gear fa-spin" style={{ fontSize: '2.5rem', color: 'var(--red)' }} />
        <p style={{ color: 'var(--gray-400)' }}>Carregando produto...</p>
      </div>
    </PageLayout>
  );

  // ── Not found ─────────────────────────────────────────────
  if (notFound || !product) return (
    <PageLayout>
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: 'var(--red)', display: 'block', marginBottom: '1rem' }} />
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Produto não encontrado</h2>
        <button className="btn btn-primary" onClick={() => navigate('/client')}>Voltar à loja</button>
      </div>
    </PageLayout>
  );

  const store = product.store;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : (product.rating || 5).toFixed(1);

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="produto-breadcrumb">
        <div className="container produto-bc-inner">
          <span onClick={() => navigate('/')} className="bc-link">Início</span>
          <i className="fa-solid fa-chevron-right" />
          <span onClick={() => navigate('/categorias')} className="bc-link">Categorias</span>
          <i className="fa-solid fa-chevron-right" />
          <span className="bc-link">{product.category}</span>
          <i className="fa-solid fa-chevron-right" />
          <span className="bc-current">{product.name}</span>
        </div>
      </div>

      <section className="section produto-section">
        <div className="container">
          <div className="produto-layout">

            {/* LEFT — imagem */}
            <div className="produto-image-col">
              <div className="produto-img-main">
                {product.images?.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span className="produto-img-emoji">{product.icon}</span>
                )}
                {product.badge && <span className="product-badge-tag">{product.badge}</span>}
              </div>
              {/* Thumbnails */}
              {product.images?.length > 1 ? (
                <div className="produto-img-thumbs">
                  {product.images.slice(0, 3).map((img, i) => (
                    <div key={i} className={`produto-thumb${i === 0 ? ' active' : ''}`}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="produto-img-thumbs">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`produto-thumb${i === 0 ? ' active' : ''}`}>{product.icon}</div>
                  ))}
                </div>
              )}
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
                  {[1, 2, 3, 4, 5].map(s => (
                    <i key={s} className={`fa-${s <= Math.round(Number(avgRating)) ? 'solid' : 'regular'} fa-star`} />
                  ))}
                </div>
                <span className="produto-rating-val">{avgRating}</span>
                <span className="produto-rating-count">({reviews.length || product.total_reviews || 0} avaliações)</span>
              </div>

              <div className="produto-price-block">
                <div className="produto-price">{fmt(product.price)}</div>
                <div className="produto-price-installment">ou 12x de {fmt(product.price / 12)} sem juros</div>
                <div className="produto-pix-price">
                  <i className="fa-brands fa-pix" /> {fmt(product.price * 0.95)} no Pix (5% off)
                </div>
              </div>

              <div className="produto-stock">
                <i className={`fa-solid fa-${product.stock > 0 ? 'circle-check' : 'circle-xmark'}`}
                  style={{ color: product.stock > 0 ? 'var(--green)' : 'var(--red)' }} />
                <span>{product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}</span>
              </div>

              <div className="produto-code-row">
                {product.code && <span>Código: <strong>{product.code}</strong></span>}
                <span>Marca: <strong>{product.brand}</strong></span>
              </div>

              {/* Qty + Actions */}
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
                <button className="btn-fav" onClick={() => { toggleFav(product.id); showToast(isFav ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'info'); }}>
                  <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart`} />
                </button>
              </div>

              <button className="btn btn-primary btn-full" style={{ marginTop: '.5rem' }}
                onClick={() => { handleAddCart(); navigate('/client?page=cart'); }}>
                <i className="fa-solid fa-bolt" /> Comprar agora
              </button>

              {/* Delivery */}
              <div className="produto-delivery-card">
                {[
                  ['fa-bolt', 'var(--red)', 'Entrega Expressa', 'Receba em até 45 minutos · R$ 8,90'],
                  ['fa-truck', 'var(--gray-500)', 'Entrega Padrão', 'Receba em 2–4h · Grátis acima de R$ 100'],
                  ['fa-store', 'var(--gray-500)', 'Retirar na Loja', 'Pronto em 30 min · Grátis'],
                ].map(([icon, color, title, sub]) => (
                  <div key={title} className="delivery-option">
                    <i className={`fa-solid ${icon}`} style={{ color }} />
                    <div><strong>{title}</strong><span>{sub}</span></div>
                  </div>
                ))}
              </div>

              {/* Store badge */}
              {store && (
                <div className="produto-store-badge" onClick={() => navigate('/lojas')}>
                  <div className="store-badge-avatar"><i className="fa-solid fa-store" /></div>
                  <div className="store-badge-info">
                    <strong>{store.name}</strong>
                    <span>
                      <i className="fa-solid fa-star" style={{ color: '#F5A623' }} /> {store.rating || 5}
                      {store.address && ` · ${store.address}`}
                      {' · '}
                      <span style={{ color: store.is_open ? 'var(--green)' : 'var(--red)' }}>
                        {store.is_open ? '🟢 Aberta' : '🔴 Fechada'}
                      </span>
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: 'var(--gray-400)', marginLeft: 'auto' }} />
                </div>
              )}
            </div>
          </div>

          {/* TABS */}
          <div className="produto-tabs">
            {[['descricao', 'Descrição'], ['compat', 'Compatibilidade'], ['avaliacoes', 'Avaliações']].map(([key, label]) => (
              <button key={key} className={`produto-tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="produto-tab-content">
            {/* Descrição */}
            {activeTab === 'descricao' && (
              <div className="tab-descricao">
                <h3>Sobre o produto</h3>
                <p>{product.description || `O ${product.name} da marca ${product.brand} é uma peça de alta qualidade, desenvolvida para oferecer máxima durabilidade e desempenho.`}</p>
                <div className="tab-specs-grid">
                  {[
                    ['Marca', product.brand],
                    product.code && ['Código', product.code],
                    ['Categoria', product.category],
                    ['Condição', CONDITION_LABEL[product.condition] || 'Novo'],
                    ['Estoque', `${product.stock} unidades`],
                    ['Avaliação', `${avgRating} / 5`],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} className="spec-row">
                      <span className="spec-key">{k}</span>
                      <span className="spec-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibilidade */}
            {activeTab === 'compat' && (
              <div className="tab-compat">
                <h3>Veículos compatíveis</h3>
                {product.compat ? (
                  <div className="compat-list">
                    {product.compat.split(',').map(c => (
                      <div key={c} className="compat-item">
                        <i className="fa-solid fa-car" style={{ color: 'var(--red)' }} />
                        <span>{c.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--gray-400)' }}>Consulte a compatibilidade com o vendedor.</p>
                )}
              </div>
            )}

            {/* Avaliações */}
            {activeTab === 'avaliacoes' && (
              <div className="tab-reviews">
                <div className="reviews-summary-row">
                  <div className="big-rating-block">
                    <span className="big-rating-val">{avgRating}</span>
                    <div className="big-rating-stars" style={{ color: '#F5A623' }}>{'★'.repeat(Math.round(Number(avgRating)))}</div>
                    <span style={{ fontSize: '.85rem', color: 'var(--gray-400)' }}>{reviews.length} avaliações</span>
                  </div>
                  <div className="review-bars" style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', fontSize: '.84rem', color: 'var(--gray-500)' }}>
                          <span>{star} ★</span>
                          <div style={{ flex: 1, height: 8, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: pct + '%', height: '100%', background: '#F5A623', borderRadius: 4 }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {reviews.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                    <i className="fa-solid fa-star" />
                    <p>Nenhuma avaliação ainda.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem', marginTop: '1.5rem' }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ background: 'var(--gray-100)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.7rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gray-800)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.82rem', fontWeight: 700 }}>
                            {r.user?.name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{r.user?.name || 'Anônimo'}</div>
                            <div style={{ color: '#F5A623', fontSize: '.82rem' }}>{'★'.repeat(r.rating)}</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--gray-400)' }}>
                            {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {r.comment && <p style={{ fontSize: '.88rem', color: 'var(--gray-600)' }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Produtos relacionados */}
          {related.length > 0 && (
            <div className="produto-related">
              <h2 className="related-title">Produtos Relacionados</h2>
              <div className="products-grid">
                {related.map(p => (
                  <div key={p.id} className="product-card light" onClick={() => navigate(`/produto/${p.id}`)}>
                    <div className="product-img"><span>{p.icon}</span>{p.badge && <span className="product-badge-tag">{p.badge}</span>}</div>
                    <div className="product-body">
                      <div className="product-brand">{p.brand}</div>
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">{fmt(p.price)}</div>
                      <button className="btn btn-primary btn-full" style={{ marginTop: '.7rem', fontSize: '.86rem', padding: '.48rem' }}
                        onClick={e => { e.stopPropagation(); addToCart(p); showToast(`${p.name} adicionado!`, 'success'); }}>
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