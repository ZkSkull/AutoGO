import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fmt } from '../data/index.js';

export default function ProductCard({ product, theme = 'light', onOpen }) {
  const { addToCart, toggleFav, favorites, showToast } = useApp();
  const isFav = favorites.includes(product.id);

  const handleAddCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  };

  const handleFav = (e) => {
    e.stopPropagation();
    toggleFav(product.id);
    showToast(isFav ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'info');
  };

  return (
    <div className={`product-card ${theme}`} onClick={() => onOpen && onOpen(product)}>
      <div className="product-img">
        <span>{product.icon}</span>
        {product.badge && <span className="product-badge-tag">{product.badge}</span>}
      </div>
      <div className="product-body">
        <div className="product-brand">{product.brand} · {'★'.repeat(Math.floor(product.rating || 5))}</div>
        <div className="product-name">{product.name}</div>
        {product.store?.name && (
          <div style={{ fontSize: '.76rem', color: 'var(--gray-400)', marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <i className="fa-solid fa-store" style={{ color: 'var(--red)', fontSize: '.7rem' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.store.name}</span>
          </div>
        )}
        <div className="product-price">{fmt(product.price)}</div>
        <div className="product-actions">
          <button className="btn btn-primary btn-sm" onClick={handleAddCart}>
            <i className="fa-solid fa-cart-plus" />
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleFav}>
            <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart`} />
          </button>
        </div>
      </div>
    </div>
  );
}