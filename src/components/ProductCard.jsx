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
        <div className="product-brand">{product.brand} · {'★'.repeat(Math.floor(product.rating))}</div>
        <div className="product-name">{product.name}</div>
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