import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { productsApi } from '../lib/api';
import { fmt } from '../data';
import './PriceComparison.css';

const HIGHLIGHT_LABELS = {
  'menor-preco':    { label: 'Menor preço',     icon: 'fa-tag',         color: '#16A34A' },
  'mais-rapido':    { label: 'Mais rápido',      icon: 'fa-bolt',        color: '#2563EB' },
  'melhor-avaliado':{ label: 'Melhor avaliado',  icon: 'fa-star',        color: '#D97706' },
};

export default function PriceComparison({ product, onClose }) {
  const { addToCart, showToast } = useApp();
  const [sortBy, setSortBy] = useState('price'); // 'price' | 'rating'
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    productsApi.comparePrices(product.code)
      .then(data => { if (active) setEntries(data || []); })
      .catch(() => { if (active) setError('Não foi possível comparar preços.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [product.code]);

  // Normalizar para o formato exibido (usa a loja embutida na query)
  const normalized = useMemo(() => entries.map(e => ({
    storeId: e.store_id,
    store: e.store || {},
    price: e.price ?? 0,
    stock: e.stock ?? 0,
    rating: e.rating ?? 0,
    condition: e.condition,
    highlight: e.badge || '',
  })), [entries]);

  const sorted = useMemo(() => {
    const list = [...normalized];
    if (sortBy === 'price') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [normalized, sortBy]);

  if (loading) {
    return (
      <div className="price-comp-empty">
        <i className="fa-solid fa-spinner fa-spin" />
        <p>Comparando preços entre lojas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-comp-empty">
        <i className="fa-solid fa-triangle-exclamation" />
        <p>{error}</p>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="price-comp-empty">
        <i className="fa-solid fa-store-slash" />
        <p>Produto disponível em apenas uma loja no momento.</p>
      </div>
    );
  }

  const prices = normalized.map(e => e.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const savings = maxPrice - minPrice;

  return (
    <div className="price-comp-wrap">
      {/* Header */}
      <div className="price-comp-header">
        <div className="price-comp-product-info">
          <span className="price-comp-icon">{product.icon || '🔩'}</span>
          <div>
            <div className="price-comp-product-name">{product.name}</div>
            <div className="price-comp-product-meta">{product.brand} · {product.code}</div>
          </div>
        </div>
        {savings > 0 && (
          <div className="price-comp-savings-badge">
            <i className="fa-solid fa-piggy-bank" />
            Economize até {fmt(savings)} comparando lojas
          </div>
        )}
      </div>

      {/* Sort tabs */}
      <div className="price-comp-sort-tabs">
        <span style={{ fontSize: '.82rem', color: 'var(--gray-400)', marginRight: '.5rem' }}>Ordenar por:</span>
        {[
          { val: 'price',    label: 'Menor preço',  icon: 'fa-tag'           },
          { val: 'rating',   label: 'Avaliação',    icon: 'fa-star'          },
        ].map(t => (
          <button
            key={t.val}
            className={`price-comp-tab${sortBy === t.val ? ' active' : ''}`}
            onClick={() => setSortBy(t.val)}
          >
            <i className={`fa-solid ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* Price bar (visual comparison) */}
      {maxPrice > minPrice && (
        <div className="price-comp-bar-section">
          <div className="price-comp-bar-labels">
            <span>{fmt(minPrice)}</span>
            <span style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>faixa de preço agora</span>
            <span>{fmt(maxPrice)}</span>
          </div>
          <div className="price-comp-bar-track">
            {sorted.map((e, i) => {
              const pct = normalized.length > 1
                ? ((e.price - minPrice) / (maxPrice - minPrice || 1)) * 80 + 10
                : 50;
              return (
                <div
                  key={i}
                  className="price-comp-bar-dot"
                  style={{ left: `${pct}%`, background: e.price === minPrice ? 'var(--green)' : 'var(--red)' }}
                  title={`${e.store?.name}: ${fmt(e.price)}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Store rows */}
      <div className="price-comp-list">
        {sorted.map((entry, idx) => {
          const store = entry.store;
          const isLowest = entry.price === minPrice;
          const hl = HIGHLIGHT_LABELS[entry.highlight.toLowerCase()];

          return (
            <div
              key={entry.storeId}
              className={`price-comp-row${isLowest && sortBy === 'price' && idx === 0 ? ' best' : ''}`}
            >
              {/* Rank */}
              <div className="price-comp-rank">
                {idx === 0 && <i className="fa-solid fa-trophy" style={{ color: '#D97706' }} />}
                {idx > 0 && <span style={{ color: 'var(--gray-400)', fontSize: '.85rem' }}>{idx + 1}º</span>}
              </div>

              {/* Store info */}
              <div className="price-comp-store-info">
                <div className="price-comp-store-avatar">
                  <i className="fa-solid fa-store" />
                </div>
                <div>
                  <div className="price-comp-store-name">
                    {store?.name || 'Loja'}
                    {hl && (
                      <span className="price-comp-highlight-tag" style={{ color: hl.color, background: hl.color + '18', borderColor: hl.color + '40' }}>
                        <i className={`fa-solid ${hl.icon}`} /> {hl.label}
                      </span>
                    )}
                  </div>
                  <div className="price-comp-store-meta">
                    <span>
                      <i className="fa-solid fa-star" style={{ color: '#F5A623' }} /> {entry.rating || '—'}
                    </span>
                    {store?.address && (
                      <span>
                        <i className="fa-solid fa-location-dot" /> {store.address.split(',')[0]}
                      </span>
                    )}
                    <span style={{ color: store?.is_open ? 'var(--green)' : 'var(--red)' }}>
                      <i className="fa-solid fa-circle" style={{ fontSize: '.45rem' }} /> {store?.is_open ? 'Aberta' : 'Fechada'}
                    </span>
                    <span>
                      <i className="fa-solid fa-box" /> {entry.stock} un.
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="price-comp-price-block">
                <div className="price-comp-price" style={{ color: isLowest ? 'var(--green)' : 'var(--gray-900)' }}>
                  {fmt(entry.price)}
                  {isLowest && <i className="fa-solid fa-arrow-down" style={{ fontSize: '.7rem', marginLeft: '.3rem' }} />}
                </div>
                {entry.price > minPrice && (
                  <div className="price-comp-diff">
                    +{fmt(entry.price - minPrice)} vs menor
                  </div>
                )}
                <div className="price-comp-installment">
                  12x {fmt(entry.price / 12)}
                </div>
              </div>

              {/* Action */}
              <button
                className={`btn price-comp-buy-btn${isLowest ? ' btn-primary' : ' btn-outline'}`}
                disabled={entry.stock === 0 || !store?.is_open}
                onClick={() => {
                  addToCart({ ...product, price: entry.price, storeId: entry.storeId });
                  showToast(`Adicionado de ${store?.name} por ${fmt(entry.price)}!`, 'success');
                  onClose?.();
                }}
              >
                {entry.stock === 0 || !store?.is_open
                  ? <><i className="fa-solid fa-ban" /> Indisponível</>
                  : <><i className="fa-solid fa-cart-plus" /> Comprar</>
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="price-comp-footer">
        <i className="fa-solid fa-circle-info" />
        Preços e disponibilidade atualizados em tempo real. Frete não incluso.
      </div>
    </div>
  );
}