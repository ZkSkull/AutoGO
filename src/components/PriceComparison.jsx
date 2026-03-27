import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STORES, STORE_PRICES, fmt } from '../data';
import './PriceComparison.css';

const HIGHLIGHT_LABELS = {
  'menor-preco':    { label: 'Menor preço',     icon: 'fa-tag',         color: '#16A34A' },
  'mais-rapido':    { label: 'Mais rápido',      icon: 'fa-bolt',        color: '#2563EB' },
  'melhor-avaliado':{ label: 'Melhor avaliado',  icon: 'fa-star',        color: '#D97706' },
};

export default function PriceComparison({ product, onClose }) {
  const { addToCart, showToast } = useApp();
  const [sortBy, setSortBy] = useState('price'); // 'price' | 'rating' | 'delivery'

  const entries = STORE_PRICES[product.code] || [];

  // Sort entries
  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'price')    return a.price - b.price;
    if (sortBy === 'rating')   return b.rating - a.rating;
    if (sortBy === 'delivery') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
    return 0;
  });

  const minPrice = Math.min(...entries.map(e => e.price));
  const maxPrice = Math.max(...entries.map(e => e.price));
  const savings  = maxPrice - minPrice;

  if (entries.length === 0) {
    return (
      <div className="price-comp-empty">
        <i className="fa-solid fa-store-slash" />
        <p>Produto disponível em apenas uma loja no momento.</p>
      </div>
    );
  }

  return (
    <div className="price-comp-wrap">
      {/* Header */}
      <div className="price-comp-header">
        <div className="price-comp-product-info">
          <span className="price-comp-icon">{product.icon}</span>
          <div>
            <div className="price-comp-product-name">{product.name}</div>
            <div className="price-comp-product-meta">{product.brand} · {product.code}</div>
          </div>
        </div>
        {savings > 0 && (
          <div className="price-comp-savings-badge">
            <i className="fa-solid fa-piggy-bank" />
            Economize até {fmt(savings) } comparando lojas
          </div>
        )}
      </div>

      {/* Sort tabs */}
      <div className="price-comp-sort-tabs">
        <span style={{ fontSize: '.82rem', color: 'var(--gray-400)', marginRight: '.5rem' }}>Ordenar por:</span>
        {[
          { val: 'price',    label: 'Menor preço',  icon: 'fa-tag'           },
          { val: 'rating',   label: 'Avaliação',    icon: 'fa-star'          },
          { val: 'delivery', label: 'Mais rápido',  icon: 'fa-truck-fast'    },
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
      <div className="price-comp-bar-section">
        <div className="price-comp-bar-labels">
          <span>{fmt(minPrice)}</span>
          <span style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>faixa de preço nesta semana</span>
          <span>{fmt(maxPrice)}</span>
        </div>
        <div className="price-comp-bar-track">
          {sorted.map(e => {
            const pct = entries.length > 1
              ? ((e.price - minPrice) / (maxPrice - minPrice || 1)) * 80 + 10
              : 50;
            return (
              <div
                key={e.storeId}
                className="price-comp-bar-dot"
                style={{ left: `${pct}%`, background: e.price === minPrice ? 'var(--green)' : 'var(--red)' }}
                title={`${STORES.find(s => s.id === e.storeId)?.name}: ${fmt(e.price)}`}
              />
            );
          })}
        </div>
      </div>

      {/* Store rows */}
      <div className="price-comp-list">
        {sorted.map((entry, idx) => {
          const store     = STORES.find(s => s.id === entry.storeId);
          if (!store) return null;
          const isLowest  = entry.price === minPrice;
          const isBest    = entry.rating === Math.max(...entries.map(e => e.rating));
          const isFastest = entry.deliveryTime === entries.reduce((a,b) => parseInt(a.deliveryTime) < parseInt(b.deliveryTime) ? a : b).deliveryTime;
          const hl        = HIGHLIGHT_LABELS[entry.highlight];

          return (
            <div
              key={entry.storeId}
              className={`price-comp-row${isLowest && sortBy === 'price' && idx === 0 ? ' best' : ''}`}
            >
              {/* Rank */}
              <div className="price-comp-rank">
                {idx === 0 && <i className="fa-solid fa-trophy" style={{ color: idx === 0 ? '#D97706' : 'var(--gray-300)' }} />}
                {idx > 0 && <span style={{ color: 'var(--gray-400)', fontSize: '.85rem' }}>{idx + 1}º</span>}
              </div>

              {/* Store info */}
              <div className="price-comp-store-info">
                <div className="price-comp-store-avatar">
                  <i className="fa-solid fa-store" />
                </div>
                <div>
                  <div className="price-comp-store-name">
                    {store.name}
                    {hl && (
                      <span className="price-comp-highlight-tag" style={{ color: hl.color, background: hl.color + '18', borderColor: hl.color + '40' }}>
                        <i className={`fa-solid ${hl.icon}`} /> {hl.label}
                      </span>
                    )}
                  </div>
                  <div className="price-comp-store-meta">
                    <span>
                      <i className="fa-solid fa-star" style={{ color: '#F5A623' }} /> {entry.rating}
                    </span>
                    <span>
                      <i className="fa-solid fa-location-dot" /> {store.distance}
                    </span>
                    <span style={{ color: store.open ? 'var(--green)' : 'var(--red)' }}>
                      <i className="fa-solid fa-circle" style={{ fontSize: '.45rem' }} /> {store.open ? 'Aberta' : 'Fechada'}
                    </span>
                    <span>
                      <i className="fa-solid fa-box" /> {entry.stock} un.
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="price-comp-delivery">
                <i className="fa-solid fa-truck-fast" style={{ color: 'var(--red)' }} />
                <span>{entry.deliveryTime}</span>
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
                disabled={entry.stock === 0 || !store.open}
                onClick={() => {
                  // Add to cart the specific store's version of this product
                  addToCart({ ...product, price: entry.price, storeId: entry.storeId });
                  showToast(`Adicionado de ${store.name} por ${fmt(entry.price)}!`, 'success');
                  onClose?.();
                }}
              >
                {entry.stock === 0 || !store.open
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