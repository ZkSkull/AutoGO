import React, { useMemo, useState } from 'react';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';

const CATS       = ['Tudo','Motor','Freios','Suspensão','Elétrica','Filtros','Transmissão','Arrefecimento','Acessórios'];
const ALL_BRANDS = ['Bosch','TRW','Monroe','Heliar','Gates','NGK','Mahle','Brembo','Cofap','Modine','Magneti','Wega','Nakata','Dayco','Valeo'];
const CONDITIONS = [{ val:'all',label:'Todos' },{ val:'new',label:'Novo' },{ val:'reman',label:'Remanufaturado' },{ val:'used',label:'Usado' }];
const RATINGS    = [{ val:0,label:'Todas' },{ val:4.5,label:'4.5+ ★' },{ val:4,label:'4.0+ ★' },{ val:3,label:'3.0+ ★' }];
const PRICE_RANGES = [
  { val:'all',    label:'Todos os preços'  },
  { val:'0-50',   label:'Até R$ 50'        },
  { val:'50-150', label:'R$ 50 – R$ 150'   },
  { val:'150-300',label:'R$ 150 – R$ 300'  },
  { val:'300+',   label:'Acima de R$ 300'  },
];

function priceInRange(price, range) {
  if (range === 'all')    return true;
  if (range === '0-50')   return price <= 50;
  if (range === '50-150') return price > 50  && price <= 150;
  if (range === '150-300')return price > 150 && price <= 300;
  if (range === '300+')   return price > 300;
  return true;
}

function FilterPanel({ filters, onChange, onClear, productCount }) {
  const [open, setOpen] = React.useState({ price:true, brands:true, condition:true, rating:true, stock:true });
  const tog = k => setOpen(s => ({ ...s, [k]: !s[k] }));
  const activeCount = [filters.priceRange!=='all'||filters.customMin||filters.customMax, filters.brands.length>0, filters.condition!=='all', filters.minRating>0, filters.onlyInStock].filter(Boolean).length;

  return (
    <aside className="filter-panel">
      <div className="filter-panel-header">
        <span className="filter-panel-title"><i className="fa-solid fa-sliders" /> Filtros {activeCount>0&&<span className="filter-active-count">{activeCount}</span>}</span>
        {activeCount>0&&<button className="filter-clear-btn" onClick={onClear}>Limpar tudo</button>}
      </div>
      <p className="filter-result-count">{productCount} produto{productCount!==1?'s':''}</p>
      {[
        { key:'price', icon:'fa-tag', label:'Faixa de preço', content: (
          <div className="filter-options">
            {PRICE_RANGES.map(r=><label key={r.val} className={`filter-radio${filters.priceRange===r.val?' active':''}`}><input type="radio" name="price" checked={filters.priceRange===r.val} onChange={()=>onChange('priceRange',r.val)} />{r.label}</label>)}
            <div className="filter-price-custom"><span>Personalizado:</span><div className="price-inputs"><input type="number" placeholder="Min" value={filters.customMin} onChange={e=>onChange('customMin',e.target.value)} /><span>—</span><input type="number" placeholder="Max" value={filters.customMax} onChange={e=>onChange('customMax',e.target.value)} /></div></div>
          </div>
        )},
        { key:'brands', icon:'fa-certificate', label:'Marcas', content: (
          <div className="filter-options">
            {ALL_BRANDS.map(b=><label key={b} className={`filter-check${filters.brands.includes(b)?' active':''}`}><input type="checkbox" checked={filters.brands.includes(b)} onChange={()=>onChange('brands',filters.brands.includes(b)?filters.brands.filter(x=>x!==b):[...filters.brands,b])} /><span>{b}</span></label>)}
          </div>
        )},
        { key:'condition', icon:'fa-box-open', label:'Condição', content: (
          <div className="filter-options">
            {CONDITIONS.map(c=><label key={c.val} className={`filter-radio${filters.condition===c.val?' active':''}`}><input type="radio" name="condition" checked={filters.condition===c.val} onChange={()=>onChange('condition',c.val)} />{c.label}</label>)}
          </div>
        )},
        { key:'rating', icon:'fa-star', label:'Avaliação', content: (
          <div className="filter-options">
            {RATINGS.map(r=><label key={r.val} className={`filter-radio${filters.minRating===r.val?' active':''}`}><input type="radio" name="rating" checked={filters.minRating===r.val} onChange={()=>onChange('minRating',r.val)} /><span style={{color:r.val>0?'#F5A623':'inherit'}}>{r.val>0?'★'.repeat(Math.floor(r.val)):''} {r.label}</span></label>)}
          </div>
        )},
        { key:'stock', icon:'fa-warehouse', label:'Estoque', content: (
          <div className="filter-options">
            <label className={`filter-toggle${filters.onlyInStock?' active':''}`}><div className="toggle-switch" onClick={()=>onChange('onlyInStock',!filters.onlyInStock)}><div className={`toggle-knob${filters.onlyInStock?' on':''}`} /></div><span>Somente em estoque</span></label>
          </div>
        )},
      ].map(({ key, icon, label, content }) => (
        <div key={key} className="filter-section">
          <button className="filter-section-header" onClick={()=>tog(key)}>
            <span><i className={`fa-solid ${icon}`} /> {label}</span>
            <i className={`fa-solid fa-chevron-${open[key]?'up':'down'}`} />
          </button>
          {open[key] && content}
        </div>
      ))}
    </aside>
  );
}

function ListProductCard({ product:p, onOpen, onAdd, onFav, isFav, showToast }) {
  return (
    <div className="list-product-card" onClick={()=>onOpen(p)}>
      <div className="list-product-img">{p.icon}</div>
      <div className="list-product-info">
        <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.3rem'}}>
          <span style={{fontSize:'.78rem',color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'.04em'}}>{p.brand}</span>
          {p.badge&&<span className="product-badge-tag">{p.badge}</span>}
        </div>
        <div className="list-product-name">{p.name}</div>
        {p.store?.name && (
          <div style={{fontSize:'.8rem',color:'var(--gray-500)',margin:'.2rem 0'}}>
            <i className="fa-solid fa-store" style={{color:'var(--red)',marginRight:'.3rem'}} />{p.store.name}
          </div>
        )}
        <div style={{fontSize:'.83rem',color:'var(--gray-400)',margin:'.3rem 0'}}><i className="fa-solid fa-car" style={{color:'var(--red)',marginRight:'.3rem'}} />{p.compat}</div>
        <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
          <span style={{color:'#F5A623',fontSize:'.85rem'}}>{'★'.repeat(Math.floor(p.rating))}</span>
          <span style={{fontSize:'.82rem',color:'var(--gray-400)'}}>{p.rating}</span>
          <span style={{fontSize:'.78rem',color:p.stock>0?'var(--green)':'var(--red)',marginLeft:'.3rem'}}>
            <i className={`fa-solid fa-${p.stock>0?'circle-check':'circle-xmark'}`} /> {p.stock>0?`${p.stock} em estoque`:'Sem estoque'}
          </span>
        </div>
      </div>
      <div className="list-product-right">
        <div className="list-product-price">{fmt(p.price)}</div>
        <div style={{fontSize:'.78rem',color:'var(--gray-400)',marginBottom:'.7rem'}}>12x {fmt(p.price/12)}</div>
        <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();onAdd(p);showToast(`${p.name} adicionado!`,'success');}}>
          <i className="fa-solid fa-cart-plus" /> Comprar
        </button>
        <button className="btn-fav-list" onClick={e=>{e.stopPropagation();onFav(p.id);}}>
          <i className={`fa-${isFav?'solid':'regular'} fa-heart`} />
        </button>
      </div>
    </div>
  );
}

import { fmt } from '../../data';

export default function ClientShop({
  products, prodLoading, prodError, onRetryProducts,
  stores = [], selectedStoreId = null, onSelectStore, onViewAllStores,
  filters, onFilterChange, onClearFilters,
  sort, onSortChange, viewMode, onViewModeChange, cat, onCatChange,
  search, onSearchChange, onOpenProduct,
  filterPanelOpen, onToggleFilterPanel, onAdd, onFav, favorites, showToast,
  pageSize = 24,
}) {
  const [page, setPage] = useState(1);

  React.useEffect(() => { setPage(1); }, [cat, search, filters, sort, selectedStoreId]);
  const filtered = useMemo(() => {
    return products
      .filter(p => !selectedStoreId || p.storeId === selectedStoreId || p.store_id === selectedStoreId)
      .filter(p => cat==='Tudo' || p.category===cat)
      .filter(p => { if (!search) return true; const q=search.toLowerCase(); return p.name.toLowerCase().includes(q)||(p.brand||'').toLowerCase().includes(q)||(p.compat||'').toLowerCase().includes(q)||(p.store?.name||'').toLowerCase().includes(q); })
      .filter(p => { if (filters.customMin&&p.price<Number(filters.customMin)) return false; if (filters.customMax&&p.price>Number(filters.customMax)) return false; if (filters.customMin||filters.customMax) return true; return priceInRange(p.price,filters.priceRange); })
      .filter(p => filters.brands.length===0||filters.brands.includes(p.brand))
      .filter(p => filters.condition==='all'||p.condition===filters.condition)
      .filter(p => (p.rating||5)>=filters.minRating)
      .filter(p => !filters.onlyInStock||p.stock>0)
      .sort((a,b) => sort==='price-asc'?a.price-b.price:sort==='price-desc'?b.price-a.price:sort==='rating'?(b.rating||5)-(a.rating||5):sort==='newest'?new Date(b.created_at)-new Date(a.created_at):0);
  }, [products, cat, search, filters, sort, selectedStoreId]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeFilterCount = [filters.priceRange!=='all'||filters.customMin||filters.customMax, filters.brands.length>0, filters.condition!=='all', filters.minRating>0, filters.onlyInStock].filter(Boolean).length;
  const selectedStoreObj = stores.find(s => s.id === selectedStoreId);

  return (
    <div>
      {prodError && (
        <div className="error-banner">
          <span className="error-banner-msg"><i className="fa-solid fa-triangle-exclamation" /> {prodError}</span>
          {onRetryProducts && <button className="btn btn-outline btn-sm" onClick={onRetryProducts}>Tentar novamente</button>}
        </div>
      )}

      {/* Lojas Disponíveis */}
      {stores.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.65rem' }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '.45rem' }}>
              <i className="fa-solid fa-store" style={{ color: 'var(--red)' }} /> Lojas Disponíveis ({stores.length})
            </h3>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              {selectedStoreId && (
                <button className="link-btn" onClick={() => onSelectStore && onSelectStore(null)}>
                  Mostrar todas as lojas
                </button>
              )}
              {onViewAllStores && (
                <button className="btn btn-outline btn-sm" onClick={onViewAllStores}>
                  <i className="fa-solid fa-shop" /> Ver detalhes das lojas
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.75rem' }}>
            {stores.map(st => {
              const isSelected = selectedStoreId === st.id;
              const storeProdCount = products.filter(p => (p.storeId || p.store_id) === st.id).length;
              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStore && onSelectStore(isSelected ? null : st.id)}
                  style={{
                    background: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '.85rem 1rem',
                    border: isSelected ? '2px solid var(--red)' : '1px solid var(--gray-200)',
                    boxShadow: isSelected ? '0 4px 14px rgba(225,26,44,.14)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.3rem' }}>
                    <strong style={{ fontSize: '.9rem', color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {st.name}
                    </strong>
                    <span style={{
                      fontSize: '.7rem',
                      fontWeight: 700,
                      padding: '.15rem .45rem',
                      borderRadius: 100,
                      background: st.is_open ? 'rgba(34,197,94,.12)' : 'var(--gray-100)',
                      color: st.is_open ? 'var(--green)' : 'var(--gray-400)',
                      flexShrink: 0,
                    }}>
                      {st.is_open ? '● Aberta' : '● Fechada'}
                    </span>
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#F5A623', fontWeight: 700 }}>★ {(st.rating || 4.8).toFixed(1)}</span>
                    <span>· {storeProdCount} peça{storeProdCount !== 1 ? 's' : ''}</span>
                    {st.distance && <span>· {st.distance}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedStoreObj && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(225,26,44,.07)', border: '1px solid rgba(225,26,44,.25)', borderRadius: 'var(--radius)', padding: '.6rem 1rem', marginBottom: '.9rem', fontSize: '.88rem' }}>
          <span>
            Exibindo catálogo de <strong>{selectedStoreObj.name}</strong> ({filtered.length} produto{filtered.length !== 1 ? 's' : ''})
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => onSelectStore && onSelectStore(null)}>
            <i className="fa-solid fa-xmark" /> Ver todas
          </button>
        </div>
      )}

      <div className="cat-strip">
        {CATS.map(c=><button key={c} className={`cat-pill${cat===c?' active':''}`} onClick={()=>onCatChange(c)}>{c}</button>)}
      </div>
      <div className="shop-toolbar">
        <div className="shop-toolbar-left">
          <div className="search-bar-std" style={{ maxWidth: 340 }}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Buscar peça, marca ou veículo…"
              value={search || ''}
              onChange={e => onSearchChange && onSearchChange(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => onSearchChange && onSearchChange('')} aria-label="Limpar busca">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
          <button className={`filter-toggle-btn${activeFilterCount>0?' has-filters':''}`} onClick={()=>onToggleFilterPanel()}>
            <i className="fa-solid fa-sliders" /> Filtros
            {activeFilterCount>0&&<span className="toolbar-filter-count">{activeFilterCount}</span>}
          </button>
          <span className="result-count">{filtered.length} produto{filtered.length!==1?'s':''}</span>
          {activeFilterCount>0&&(
            <div className="active-filter-tags">
              {filters.priceRange!=='all'&&<span className="filter-tag">{PRICE_RANGES.find(r=>r.val===filters.priceRange)?.label}<button onClick={()=>onFilterChange('priceRange','all')}><i className="fa-solid fa-xmark" /></button></span>}
              {filters.brands.map(b=><span key={b} className="filter-tag">{b}<button onClick={()=>onFilterChange('brands',filters.brands.filter(x=>x!==b))}><i className="fa-solid fa-xmark" /></button></span>)}
              {filters.condition!=='all'&&<span className="filter-tag">{CONDITIONS.find(c=>c.val===filters.condition)?.label}<button onClick={()=>onFilterChange('condition','all')}><i className="fa-solid fa-xmark" /></button></span>}
              {filters.minRating>0&&<span className="filter-tag">{filters.minRating}+ ★<button onClick={()=>onFilterChange('minRating',0)}><i className="fa-solid fa-xmark" /></button></span>}
              {filters.onlyInStock&&<span className="filter-tag">Em estoque<button onClick={()=>onFilterChange('onlyInStock',false)}><i className="fa-solid fa-xmark" /></button></span>}
              <button className="clear-all-tags" onClick={onClearFilters}>Limpar tudo</button>
            </div>
          )}
        </div>
        <div className="shop-toolbar-right">
          <select value={sort} onChange={e=>onSortChange(e.target.value)} className="sort-select">
            <option value="relevance">Mais relevantes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="rating">Melhor avaliação</option>
            <option value="newest">Mais recentes</option>
          </select>
          <div className="view-toggle">
            <button className={viewMode==='grid'?'active':''} onClick={()=>onViewModeChange('grid')}><i className="fa-solid fa-grip" /></button>
            <button className={viewMode==='list'?'active':''} onClick={()=>onViewModeChange('list')}><i className="fa-solid fa-list" /></button>
          </div>
        </div>
      </div>
      <div className={`shop-layout${filterPanelOpen?' filters-open':''}`}>
        {filterPanelOpen&&<FilterPanel filters={filters} onChange={onFilterChange} onClear={onClearFilters} productCount={filtered.length} />}
        <div className="shop-products">
          {prodLoading?(
            <div style={{textAlign:'center',padding:'3rem',gridColumn:'1/-1'}}>
              <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--red)'}} />
              <p style={{color:'var(--gray-400)',marginTop:'1rem'}}>Carregando produtos...</p>
            </div>
          ):paginated.length>0?(
            <div className={viewMode==='list'?'products-list-view':'products-grid'}>
              {paginated.map(p=>viewMode==='list'
                ?<ListProductCard key={p.id} product={p} onOpen={onOpenProduct} onAdd={onAdd} onFav={onFav} isFav={favorites.includes(p.id)} showToast={showToast} />
                :<ProductCard key={p.id} product={p} theme="light" onOpen={onOpenProduct} />
              )}
            </div>
          ):(
            <div className="empty-state"><i className="fa-solid fa-magnifying-glass" /><p>Nenhum produto encontrado.</p><button className="btn btn-outline" onClick={onClearFilters} style={{marginTop:'.5rem'}}>Limpar filtros</button></div>
          )}
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
    </div>
  );
}