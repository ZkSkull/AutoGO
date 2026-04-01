import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import ProductCard from '../../components/ProductCard';
import PriceComparison from '../../components/PriceComparison';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase.js';
import { fmt, statusLabel } from '../../data';
import './Client.css';

const NAV = [
  { page: 'shop',      label: 'Loja',        icon: 'fa-solid fa-shop'          },
  { page: 'cart',      label: 'Carrinho',     icon: 'fa-solid fa-cart-shopping' },
  { page: 'orders',    label: 'Meus Pedidos', icon: 'fa-solid fa-box'           },
  { page: 'favorites', label: 'Favoritos',    icon: 'fa-solid fa-heart'         },
  { page: 'profile',   label: 'Meu Perfil',   icon: 'fa-solid fa-circle-user'   },
];

const CATS       = ['Tudo','Motor','Freios','Suspensão','Elétrica','Filtros','Transmissão','Arrefecimento'];
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

// ── FILTER PANEL ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onClear, productCount }) {
  const [open, setOpen] = useState({ price:true, brands:true, condition:true, rating:true, stock:true });
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
            {ALL_BRANDS.map(b=><label key={b} className={`filter-check${filters.brands.includes(b)?' active':''}`}><input type="checkbox" checked={filters.brands.includes(b)} onChange={()=>onChange('brands',filters.brands.includes(b)?filters.brands.filter(x=>x!==b):[...filters.brands,b])} /><span>{b}</span><span className="filter-check-count">{PRODUCTS.filter(p=>p.brand===b).length}</span></label>)}
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

// ── LIST CARD ─────────────────────────────────────────────────────────────────
function ListProductCard({ product:p, onOpen, onAdd, onFav, isFav, showToast, onCompare }) {
  const hasCompare = false;
  return (
    <div className="list-product-card" onClick={()=>onOpen(p)}>
      <div className="list-product-img">{p.icon}</div>
      <div className="list-product-info">
        <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.3rem'}}>
          <span style={{fontSize:'.78rem',color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'.04em'}}>{p.brand}</span>
          {p.badge&&<span className="product-badge-tag">{p.badge}</span>}
        </div>
        <div className="list-product-name">{p.name}</div>
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
      {/* REVIEW MODAL */}
      {reviewModal&&(
        <Modal open title="Avaliar pedido" onClose={()=>setReviewModal(null)}>
          <form onSubmit={submitReview}>
            <p style={{color:'var(--gray-500)',marginBottom:'1rem',fontSize:'.9rem'}}>
              Pedido <strong>{reviewModal.order_number}</strong> — {reviewModal.store?.name}
            </p>
            <div className="form-group">
              <label>Sua nota</label>
              <div style={{display:'flex',gap:'.5rem',margin:'.5rem 0'}}>
                {[1,2,3,4,5].map(s=>(
                  <button key={s} type="button"
                    onClick={()=>setReviewForm(f=>({...f,rating:s}))}
                    style={{fontSize:'1.8rem',background:'none',border:'none',cursor:'pointer',color:s<=reviewForm.rating?'#F5A623':'var(--gray-300)',transition:'color .15s'}}>
                    ★
                  </button>
                ))}
                <span style={{fontSize:'.9rem',color:'var(--gray-400)',alignSelf:'center',marginLeft:'.3rem'}}>{reviewForm.rating}/5</span>
              </div>
            </div>
            <div className="form-group">
              <label>Comentário (opcional)</label>
              <textarea
                rows={3}
                placeholder="Como foi sua experiência?"
                value={reviewForm.comment}
                onChange={e=>setReviewForm(f=>({...f,comment:e.target.value}))}
                style={{width:'100%',padding:'.7rem',border:'2px solid var(--gray-200)',borderRadius:'var(--radius)',fontSize:'.9rem',resize:'vertical'}}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={reviewSaving}>
              {reviewSaving?<><i className="fa-solid fa-spinner fa-spin" /> Enviando…</>:<><i className="fa-solid fa-star" /> Enviar avaliação</>}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Client() {
  const { user, profile, cart, cartTotal, addToCart, removeFromCart, changeQty, clearCart, favorites, toggleFav, showToast } = useApp();
  const [params] = useSearchParams();

  const [page,            setPage]           = useState('shop');
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [cat,             setCat]             = useState('Tudo');
  const [search,          setSearch]          = useState(params.get('search')||'');
  const [sort,            setSort]            = useState('relevance');
  const [viewMode,        setViewMode]        = useState('grid');
  const [filters,         setFilters]         = useState({ priceRange:'all', customMin:'', customMax:'', brands:[], condition:'all', minRating:0, onlyInStock:false });
  const [productModal,    setProductModal]    = useState(null);
  const [compareProduct,  setCompareProduct]  = useState(null);
  const [checkoutStep,    setCheckoutStep]    = useState(0);
  const [delivery,        setDelivery]        = useState('express');
  const [coupon,          setCoupon]          = useState('');
  const [discount,        setDiscount]        = useState(0);
  const [payMethod,       setPayMethod]       = useState('credit');

  // Supabase state
  const [orders,          setOrders]          = useState([]);
  const [ordLoading,      setOrdLoading]      = useState(false);
  const [addresses,       setAddresses]       = useState([]);
  const [addrLoading,     setAddrLoading]     = useState(false);
  const [vehicles,        setVehicles]        = useState([]);
  const [profileForm,     setProfileForm]     = useState({});
  const [profSaving,      setProfSaving]      = useState(false);
  const [newOrderId,      setNewOrderId]      = useState(null);
  const [notifications,   setNotifications]   = useState([]);

  // Products from Supabase
  const [products,      setProducts]      = useState([]);
  const [prodLoading,   setProdLoading]   = useState(true);

  const [reviewModal,   setReviewModal]   = useState(null); // order to review
  const [reviewForm,    setReviewForm]    = useState({ rating:5, comment:'' });
  const [reviewSaving,  setReviewSaving]  = useState(false);

  const realtimeChannel = useRef(null);

  useEffect(() => {
    if (params.get('cat'))    setCat(params.get('cat'));
    if (params.get('search')) setSearch(params.get('search'));
  }, [params]);

  // Load products on mount (independent of user)
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadAddresses();
    loadVehicles();
    loadNotifications();
    subscribeOrderUpdates();
    return () => { if (realtimeChannel.current) supabase.removeChannel(realtimeChannel.current); };
  }, [user]);

  // Preenche o formulário quando o profile carrega do banco
  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      name:  profile.name  || '',
      phone: profile.phone || '',
      cpf:   profile.cpf   || '',
    });
  }, [profile]);

  // ── Loaders ─────────────────────────────────────────────
  const loadProducts = async () => {
    setProdLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(id, name, rating, is_open)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Normalize fields to match existing UI expectations
      const normalized = (data || []).map(p => ({
        ...p,
        icon:   p.icon_emoji || '🔩',
        compat: p.compatibility || '',
        code:   p.code || '',
        badge:  p.badge || '',
        storeId: p.store_id,
      }));
      setProducts(normalized);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err.message);
    } finally {
      setProdLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, store:stores(name), items:order_items(product_name, quantity, product_price)`)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) { console.error(err); }
    finally { setOrdLoading(false); }
  };

  const loadAddresses = async () => {
    setAddrLoading(true);
    try {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
      setAddresses(data || []);
    } catch (err) { console.error(err); }
    finally { setAddrLoading(false); }
  };

  const loadVehicles = async () => {
    try {
      const { data } = await supabase.from('vehicles').select('*').eq('user_id', user.id);
      setVehicles(data || []);
    } catch (err) { console.error(err); }
  };

  const loadNotifications = async () => {
    try {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      setNotifications(data || []);
    } catch (err) { console.error(err); }
  };

  // ── Realtime — status dos pedidos ────────────────────────
  const subscribeOrderUpdates = () => {
    realtimeChannel.current = supabase
      .channel(`client_orders_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `client_id=eq.${user.id}`,
      }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        showToast(`Pedido atualizado: ${statusLabel(payload.new.status)}`, 'info');
      })
      .subscribe();
  };

  // ── Filtros ──────────────────────────────────────────────
  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const clearFilters = () => setFilters({ priceRange:'all', customMin:'', customMax:'', brands:[], condition:'all', minRating:0, onlyInStock:false });

  const filtered = products
    .filter(p => cat==='Tudo' || p.category===cat)
    .filter(p => { if (!search) return true; const q=search.toLowerCase(); return p.name.toLowerCase().includes(q)||(p.brand||'').toLowerCase().includes(q)||(p.compat||'').toLowerCase().includes(q); })
    .filter(p => { if (filters.customMin&&p.price<Number(filters.customMin)) return false; if (filters.customMax&&p.price>Number(filters.customMax)) return false; if (filters.customMin||filters.customMax) return true; return priceInRange(p.price,filters.priceRange); })
    .filter(p => filters.brands.length===0||filters.brands.includes(p.brand))
    .filter(p => filters.condition==='all'||p.condition===filters.condition)
    .filter(p => (p.rating||5)>=filters.minRating)
    .filter(p => !filters.onlyInStock||p.stock>0)
    .sort((a,b) => sort==='price-asc'?a.price-b.price:sort==='price-desc'?b.price-a.price:sort==='rating'?(b.rating||5)-(a.rating||5):sort==='newest'?new Date(b.created_at)-new Date(a.created_at):0);

  const activeFilterCount = [filters.priceRange!=='all'||filters.customMin||filters.customMax, filters.brands.length>0, filters.condition!=='all', filters.minRating>0, filters.onlyInStock].filter(Boolean).length;

  // ── Cart ─────────────────────────────────────────────────
  const cartItems = cart.map(i => ({ ...i, product: products.find(p => p.id===i.id) })).filter(i => i.product);
  const subtotal  = cartItems.reduce((s,i) => s+i.product.price*i.qty, 0);
  const freight   = delivery==='pickup'?0:delivery==='standard'&&subtotal>=100?0:delivery==='express'?8.90:5.90;
  const total     = subtotal+freight-discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase()==='PECAS10') { setDiscount(subtotal*.1); showToast('Cupom aplicado! 10% de desconto.','success'); }
    else showToast('Cupom inválido.','error');
  };

  // ── Criar pedido no Supabase ─────────────────────────────
  const confirmOrder = async () => {
    if (!user) { showToast('Faça login para finalizar.','error'); return; }
    try {
      // Pega primeira loja dos itens (simplificado)
      const storeId = cartItems[0]?.product?.storeId;
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          client_id:      user.id,
          store_id:       storeId || null,
          address_id:     defaultAddr?.id || null,
          subtotal,
          freight,
          discount,
          total,
          delivery_type:  delivery,
          payment_method: payMethod,
          status:         'pending',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Inserir itens
      const items = cartItems.map(i => ({
        order_id:      order.id,
        product_id:    i.product.id,
        product_name:  i.product.name,
        product_price: i.product.price,
        quantity:      i.qty,
        subtotal:      i.product.price * i.qty,
      }));
      await supabase.from('order_items').insert(items);

      setNewOrderId(order.order_number);
      clearCart();
      setDiscount(0);
      setCoupon('');
      setCheckoutStep(3);
      loadOrders();
    } catch (err) {
      showToast('Erro ao criar pedido: ' + err.message, 'error');
    }
  };

  // ── Avaliar pedido ──────────────────────────────────────
  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    setReviewSaving(true);
    try {
      await supabase.from('reviews').insert({
        order_id:   reviewModal.id,
        store_id:   reviewModal.store_id,
        user_id:    user.id,
        rating:     reviewForm.rating,
        comment:    reviewForm.comment,
      });
      // Mark order as reviewed
      await supabase.from('orders').update({ reviewed: true }).eq('id', reviewModal.id);
      setOrders(prev => prev.map(o => o.id === reviewModal.id ? { ...o, reviewed: true } : o));
      setReviewModal(null);
      setReviewForm({ rating:5, comment:'' });
      showToast('Avaliação enviada! Obrigado.', 'success');
    } catch (err) {
      showToast('Erro ao enviar avaliação.', 'error');
    } finally {
      setReviewSaving(false);
    }
  };

  // ── Perfil ───────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfSaving(true);
    try {
      const { error } = await supabase.from('profiles').update(profileForm).eq('id', user.id);
      if (error) throw error;
      showToast('Perfil atualizado!', 'success');
    } catch (err) { showToast('Erro ao salvar: '+err.message, 'error'); }
    finally { setProfSaving(false); }
  };

  // ── Endereços ────────────────────────────────────────────
  const addAddress = async () => {
    const street = prompt('Endereço completo:');
    if (!street) return;
    const city   = prompt('Cidade:') || 'São Paulo';
    const state  = prompt('Estado (UF):') || 'SP';
    try {
      const { data, error } = await supabase.from('addresses').insert({ user_id:user.id, street, city, state, is_default: addresses.length===0 }).select().single();
      if (error) throw error;
      setAddresses(prev => [...prev, data]);
      showToast('Endereço adicionado!', 'success');
    } catch (err) { showToast('Erro: '+err.message, 'error'); }
  };

  const removeAddress = async (id) => {
    try {
      await supabase.from('addresses').delete().eq('id', id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast('Endereço removido.', 'info');
    } catch (err) { showToast('Erro: '+err.message, 'error'); }
  };

  // ── Veículos ─────────────────────────────────────────────
  const addVehicle = async () => {
    const brand = prompt('Marca do veículo:');
    if (!brand) return;
    const model = prompt('Modelo:');
    if (!model) return;
    const year  = prompt('Ano:');
    try {
      const { data, error } = await supabase.from('vehicles').insert({ user_id:user.id, brand, model, year:parseInt(year)||null }).select().single();
      if (error) throw error;
      setVehicles(prev => [...prev, data]);
      showToast('Veículo adicionado!', 'success');
    } catch (err) { showToast('Erro: '+err.message, 'error'); }
  };

  const clientName = profile?.name || user?.email?.split('@')[0] || 'Você';
  const navItems   = NAV.map(n => n.page==='cart' ? { ...n, badge: cartTotal } : n);
  const unreadNotif = notifications.filter(n => !n.is_read).length;

  return (
    <div className="dash-bg dash-layout">
      <Sidebar items={navItems} active={page} onNav={setPage} storeName={clientName} role="client" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="dash-main">
        <header className="topbar">
          <button className="topbar-burger" onClick={()=>setSidebarOpen(v=>!v)}><i className="fa-solid fa-bars" /></button>
          <div className="topbar-search">
            <i className="fa-solid fa-magnifying-glass" style={{color:'var(--gray-400)'}} />
            <input placeholder="Buscar peça, marca, veículo…" value={search} onChange={e=>setSearch(e.target.value)} />
            {search&&<button style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)'}} onClick={()=>setSearch('')}><i className="fa-solid fa-xmark" /></button>}
          </div>
          <div className="topbar-actions">
            <button className="topbar-btn" style={{position:'relative'}} onClick={()=>setPage('orders')}>
              <i className="fa-solid fa-bell" />
              {unreadNotif>0&&<span className="notif-dot" />}
            </button>
            <button className="topbar-btn" onClick={()=>setPage('cart')}>
              <i className="fa-solid fa-cart-shopping" />
              {cartTotal>0&&<span className="notif-dot" />}
            </button>
            <div className="topbar-avatar" onClick={()=>setPage('profile')}>{clientName.slice(0,2).toUpperCase()}</div>
          </div>
        </header>

        <div className="page-content fade-in">

          {/* ══ SHOP ═════════════════════════════════════════ */}
          {page==='shop'&&(
            <div>
              <div className="cat-strip">
                {CATS.map(c=><button key={c} className={`cat-pill${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c}</button>)}
              </div>
              <div className="shop-toolbar">
                <div className="shop-toolbar-left">
                  <button className={`filter-toggle-btn${activeFilterCount>0?' has-filters':''}`} onClick={()=>setFilterPanelOpen(v=>!v)}>
                    <i className="fa-solid fa-sliders" /> Filtros
                    {activeFilterCount>0&&<span className="toolbar-filter-count">{activeFilterCount}</span>}
                  </button>
                  <span className="result-count">{filtered.length} produto{filtered.length!==1?'s':''}</span>
                  {activeFilterCount>0&&(
                    <div className="active-filter-tags">
                      {filters.priceRange!=='all'&&<span className="filter-tag">{PRICE_RANGES.find(r=>r.val===filters.priceRange)?.label}<button onClick={()=>handleFilterChange('priceRange','all')}><i className="fa-solid fa-xmark" /></button></span>}
                      {filters.brands.map(b=><span key={b} className="filter-tag">{b}<button onClick={()=>handleFilterChange('brands',filters.brands.filter(x=>x!==b))}><i className="fa-solid fa-xmark" /></button></span>)}
                      {filters.condition!=='all'&&<span className="filter-tag">{CONDITIONS.find(c=>c.val===filters.condition)?.label}<button onClick={()=>handleFilterChange('condition','all')}><i className="fa-solid fa-xmark" /></button></span>}
                      {filters.minRating>0&&<span className="filter-tag">{filters.minRating}+ ★<button onClick={()=>handleFilterChange('minRating',0)}><i className="fa-solid fa-xmark" /></button></span>}
                      {filters.onlyInStock&&<span className="filter-tag">Em estoque<button onClick={()=>handleFilterChange('onlyInStock',false)}><i className="fa-solid fa-xmark" /></button></span>}
                      <button className="clear-all-tags" onClick={clearFilters}>Limpar tudo</button>
                    </div>
                  )}
                </div>
                <div className="shop-toolbar-right">
                  <select value={sort} onChange={e=>setSort(e.target.value)} className="sort-select">
                    <option value="relevance">Mais relevantes</option>
                    <option value="price-asc">Menor preço</option>
                    <option value="price-desc">Maior preço</option>
                    <option value="rating">Melhor avaliação</option>
                    <option value="newest">Mais recentes</option>
                  </select>
                  <div className="view-toggle">
                    <button className={viewMode==='grid'?'active':''} onClick={()=>setViewMode('grid')}><i className="fa-solid fa-grip" /></button>
                    <button className={viewMode==='list'?'active':''} onClick={()=>setViewMode('list')}><i className="fa-solid fa-list" /></button>
                  </div>
                </div>
              </div>
              <div className={`shop-layout${filterPanelOpen?' filters-open':''}`}>
                {filterPanelOpen&&<FilterPanel filters={filters} onChange={handleFilterChange} onClear={clearFilters} productCount={filtered.length} />}
                <div className="shop-products">
                  {prodLoading?(
                    <div style={{textAlign:'center',padding:'3rem',gridColumn:'1/-1'}}>
                      <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--red)'}} />
                      <p style={{color:'var(--gray-400)',marginTop:'1rem'}}>Carregando produtos...</p>
                    </div>
                  ):filtered.length>0?(
                    <div className={viewMode==='list'?'products-list-view':'products-grid'}>
                      {filtered.map(p=>viewMode==='list'
                        ?<ListProductCard key={p.id} product={p} onOpen={setProductModal} onAdd={addToCart} onFav={toggleFav} isFav={favorites.includes(p.id)} showToast={showToast} onCompare={setCompareProduct} />
                        :<ProductCard key={p.id} product={p} theme="light" onOpen={setProductModal} onCompare={setCompareProduct} />
                      )}
                    </div>
                  ):(
                    <div className="empty-state"><i className="fa-solid fa-magnifying-glass" /><p>Nenhum produto encontrado.</p><button className="btn btn-outline" onClick={clearFilters} style={{marginTop:'.5rem'}}>Limpar filtros</button></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ CART ════════════════════════════════════════ */}
          {page==='cart'&&(
            <div>
              <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Carrinho</h2>
              <div className="cart-layout">
                <div className="cart-items-list">
                  {cartItems.length===0
                    ?<div className="empty-state"><i className="fa-solid fa-cart-shopping" /><p>Seu carrinho está vazio.</p><button className="btn btn-primary" onClick={()=>setPage('shop')} style={{marginTop:'.5rem'}}>Ir para a loja</button></div>
                    :cartItems.map(i=>(
                      <div key={i.id} className="cart-item-card">
                        <div className="cart-item-img">{i.product.icon}</div>
                        <div className="cart-item-info">
                          <div className="cart-item-name">{i.product.name}</div>
                          <div style={{fontSize:'.82rem',color:'var(--gray-400)'}}>{i.product.brand} · {i.product.category}</div>
                          <div className="cart-item-price">{fmt(i.product.price*i.qty)}</div>
                          <div style={{fontSize:'.78rem',color:'var(--gray-400)',marginTop:'.2rem'}}>{fmt(i.product.price)} por unidade</div>
                        </div>
                        <div className="qty-row">
                          <button className="qty-btn" onClick={()=>changeQty(i.id,-1)}><i className="fa-solid fa-minus" style={{fontSize:'.7rem'}} /></button>
                          <span className="qty-val">{i.qty}</span>
                          <button className="qty-btn" onClick={()=>changeQty(i.id,1)}><i className="fa-solid fa-plus" style={{fontSize:'.7rem'}} /></button>
                        </div>
                        <button className="cart-remove" onClick={()=>removeFromCart(i.id)}><i className="fa-solid fa-xmark" /></button>
                      </div>
                    ))
                  }
                </div>
                <div className="cart-summary">
                  <div className="dash-card">
                    <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>Resumo</h3>
                    <div className="summary-line"><span>Subtotal ({cartItems.reduce((s,i)=>s+i.qty,0)} itens)</span><span>{fmt(subtotal)}</span></div>
                    <div className="summary-line"><span>Frete</span><span>{freight===0?<span style={{color:'var(--green)'}}>Grátis</span>:fmt(freight)}</span></div>
                    {discount>0&&<div className="summary-line" style={{color:'var(--green)'}}><span>Desconto</span><span>-{fmt(discount)}</span></div>}
                    <div className="summary-line total"><span>Total</span><span>{fmt(total)}</span></div>
                    <div className="delivery-opts" style={{margin:'1rem 0'}}>
                      {[['express','fa-bolt','Expressa','45 min · R$ 8,90'],['standard','fa-truck','Padrão','2–4h · Grátis >R$100'],['pickup','fa-store','Retirar','Pronto em 30 min']].map(([val,icon,label,sub])=>(
                        <label key={val} className={`delivery-opt${delivery===val?' checked':''}`}>
                          <input type="radio" name="delivery" value={val} checked={delivery===val} onChange={()=>setDelivery(val)} />
                          <div className="opt-info"><strong><i className={`fa-solid ${icon}`} /> {label}</strong><span>{sub}</span></div>
                        </label>
                      ))}
                    </div>
                    <div className="coupon-row">
                      <input placeholder="Cupom de desconto" value={coupon} onChange={e=>setCoupon(e.target.value)} />
                      <button className="btn btn-outline btn-sm" onClick={applyCoupon}>Aplicar</button>
                    </div>
                    <button className="btn btn-primary btn-full" style={{marginTop:'1rem'}} onClick={()=>{if(cartItems.length===0){showToast('Adicione produtos.','error');return;}setCheckoutStep(1);}}>
                      <i className="fa-solid fa-lock" /> Finalizar pedido
                    </button>
                    <button className="btn btn-ghost btn-full" style={{marginTop:'.5rem'}} onClick={()=>setPage('shop')}>Continuar comprando</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ORDERS ══════════════════════════════════════ */}
          {page==='orders'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
                <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900}}>Meus Pedidos</h2>
                <button className="btn btn-outline btn-sm" onClick={loadOrders}><i className="fa-solid fa-rotate" /> Atualizar</button>
              </div>
              {ordLoading?(
                <div style={{textAlign:'center',padding:'3rem'}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--red)'}} /></div>
              ):orders.length===0?(
                <div className="empty-state"><i className="fa-solid fa-box-open" /><p>Nenhum pedido ainda.</p><button className="btn btn-primary" onClick={()=>setPage('shop')} style={{marginTop:'.5rem'}}>Fazer primeiro pedido</button></div>
              ):orders.map(o=>{
                const steps=['Confirmado','Em preparo','Enviado','Entregue'];
                const stepIdx=o.status==='pending'?0:o.status==='preparing'?1:o.status==='shipped'?2:o.status==='delivered'?4:0;
                return(
                  <div key={o.id} className="client-order-card dash-card" style={{marginBottom:'1rem'}}>
                    <div className="client-order-header">
                      <div>
                        <strong className="order-id">{o.order_number}</strong>
                        <div style={{fontSize:'.82rem',color:'var(--gray-400)',marginTop:'.15rem'}}>{o.store?.name||'—'} · {new Date(o.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <span className={`status-badge status-${o.status}`}>{statusLabel(o.status)}</span>
                    </div>
                    <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',margin:'.8rem 0'}}>
                      {o.items?.map((it,i)=><span key={i} style={{background:'var(--gray-100)',padding:'.3rem .8rem',borderRadius:6,fontSize:'.82rem'}}>{it.product_name} x{it.quantity}</span>)}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                      <span style={{fontSize:'.9rem',color:'var(--gray-500)'}}>Total: <strong style={{fontFamily:'var(--font-head)',color:'var(--gray-900)'}}>{fmt(o.total)}</strong></span>
                    </div>
                    <div className="track-bar">
                      {steps.map((s,i)=>(
                        <React.Fragment key={s}>
                          <div className="track-step">
                            <div className={`track-dot${i<stepIdx?' done':i===stepIdx-1?' active':''}`}><i className="fa-solid fa-check" style={{fontSize:'.6rem'}} /></div>
                            <span className={`track-label${i<stepIdx?' done':''}`}>{s}</span>
                          </div>
                          {i<steps.length-1&&<div className={`track-line${i<stepIdx-1?' done':''}`} />}
                        </React.Fragment>
                      ))}
                    </div>
                    {o.status==='delivered' && !o.reviewed && (
                      <button className="btn btn-outline btn-sm" style={{marginTop:'1rem'}} onClick={()=>{setReviewModal(o);setReviewForm({rating:5,comment:''});}}>
                        <i className="fa-solid fa-star" /> Avaliar pedido
                      </button>
                    )}
                    {o.status==='delivered' && o.reviewed && (
                      <div style={{marginTop:'1rem',fontSize:'.82rem',color:'var(--green)'}}>
                        <i className="fa-solid fa-circle-check" /> Avaliação enviada
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ FAVORITES ═══════════════════════════════════ */}
          {page==='favorites'&&(
            <div>
              <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Favoritos</h2>
              {favorites.length>0
                ?<div className="products-grid">{products.filter(p=>favorites.includes(p.id)).map(p=><ProductCard key={p.id} product={p} theme="light" onOpen={setProductModal} onCompare={setCompareProduct} />)}</div>
                :<div className="empty-state"><i className="fa-solid fa-heart" /><p>Nenhum produto favoritado.</p><button className="btn btn-outline" onClick={()=>setPage('shop')} style={{marginTop:'.5rem'}}>Explorar produtos</button></div>}
            </div>
          )}

          {/* ══ PROFILE ═════════════════════════════════════ */}
          {page==='profile'&&(
            <div>
              <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Meu Perfil</h2>
              <div className="settings-grid">
                <div className="dash-card">
                  <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1.2rem'}}>Dados pessoais</h3>
                  <form onSubmit={saveProfile}>
                    {[['Nome','name','text'],['Telefone','phone','tel'],['CPF','cpf','text']].map(([label,field,type])=>(
                      <div key={field} className="form-group">
                        <label>{label}</label>
                        <input type={type} value={profileForm[field]||''} onChange={e=>setProfileForm(f=>({...f,[field]:e.target.value}))} />
                      </div>
                    ))}
                    <div className="form-group"><label>E-mail</label><input value={user?.email||''} disabled style={{opacity:.6}} /></div>
                    <button type="submit" className="btn btn-primary" disabled={profSaving}>
                      {profSaving?<><i className="fa-solid fa-spinner fa-spin" /> Salvando…</>:'Salvar'}
                    </button>
                  </form>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  <div className="dash-card">
                    <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>Endereços</h3>
                    {addrLoading?<div className="loading-pulse" style={{height:60}} />:addresses.map(a=>(
                      <div key={a.id} style={{display:'flex',alignItems:'center',gap:'.8rem',background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'.75rem 1rem',marginBottom:'.5rem'}}>
                        <i className="fa-solid fa-location-dot" style={{color:'var(--red)'}} />
                        <span style={{flex:1,fontSize:'.9rem'}}>{a.street}{a.number?`, ${a.number}`:''} — {a.city}, {a.state}</span>
                        {a.is_default&&<span style={{fontSize:'.72rem',background:'var(--red)',color:'#fff',padding:'.15rem .5rem',borderRadius:4}}>Principal</span>}
                        <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)'}} onClick={()=>removeAddress(a.id)}><i className="fa-solid fa-xmark" /></button>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-full" style={{marginTop:'.5rem'}} onClick={addAddress}><i className="fa-solid fa-plus" /> Novo endereço</button>
                  </div>

                  <div className="dash-card">
                    <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>Veículos</h3>
                    <div style={{display:'flex',gap:'.7rem',flexWrap:'wrap'}}>
                      {vehicles.map(v=>(
                        <div key={v.id} style={{display:'flex',alignItems:'center',gap:'.5rem',background:'var(--gray-100)',border:'2px solid var(--gray-200)',borderRadius:'var(--radius)',padding:'.5rem 1rem',fontSize:'.88rem'}}>
                          <i className="fa-solid fa-car" style={{color:'var(--red)'}} />{v.brand} {v.model} {v.year&&`(${v.year})`}
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline" style={{marginTop:'1rem'}} onClick={addVehicle}><i className="fa-solid fa-plus" /> Adicionar veículo</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PRODUCT MODAL */}
      {productModal&&(
        <Modal open title={productModal.name} onClose={()=>setProductModal(null)} size="lg">
          <div className="product-detail-modal">
            <div className="product-detail-img">{productModal.icon}</div>
            <div className="product-detail-info">
              <div style={{fontSize:'.85rem',color:'var(--gray-400)'}}>{productModal.brand} · #{productModal.code}</div>
              <div className="product-detail-price">{fmt(productModal.price)}</div>
              <div style={{fontSize:'.82rem',color:'#F5A623'}}>{'★'.repeat(Math.floor(productModal.rating))} {productModal.rating}</div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',margin:'.5rem 0'}}>
                <span style={{background:'rgba(225,26,44,.1)',color:'var(--red)',padding:'.25rem .65rem',borderRadius:6,fontSize:'.8rem'}}>{productModal.category}</span>
                <span style={{background:'var(--gray-100)',padding:'.25rem .65rem',borderRadius:6,fontSize:'.8rem'}}>{productModal.stock} em estoque</span>
              </div>
              <div style={{fontSize:'.88rem',color:'var(--gray-600)',marginBottom:'1rem'}}><strong>Compatível com:</strong> {productModal.compat}</div>
              <div style={{fontSize:'.88rem',color:'var(--gray-500)',marginBottom:'1rem'}}>ou 12x de {fmt(productModal.price/12)} sem juros</div>
              <div style={{display:'flex',gap:'.5rem'}}>
                <button className="btn btn-primary" onClick={()=>{addToCart(productModal);showToast(`${productModal.name} adicionado!`,'success');setProductModal(null);setPage('cart');}}>
                  <i className="fa-solid fa-cart-plus" /> Adicionar
                </button>
                <button className="btn btn-outline" onClick={()=>{toggleFav(productModal.id);showToast(favorites.includes(productModal.id)?'Removido.':'Favoritado!','info');}}>
                  <i className={`fa-${favorites.includes(productModal.id)?'solid':'regular'} fa-heart`} />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPARE MODAL */}
      {compareProduct&&(
        <Modal open title={`Comparar — ${compareProduct.name}`} onClose={()=>setCompareProduct(null)} size="compare">
          <PriceComparison product={compareProduct} onClose={()=>setCompareProduct(null)} />
        </Modal>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutStep>0&&(
        <Modal open title="Finalizar Pedido" onClose={()=>setCheckoutStep(0)}>
          {checkoutStep===1&&(
            <div>
              <h4 style={{fontFamily:'var(--font-head)',fontWeight:700,marginBottom:'1rem'}}>Endereço de entrega</h4>
              {addresses.length===0?(
                <div style={{marginBottom:'1rem'}}>
                  <p style={{color:'var(--gray-400)',marginBottom:'.8rem',fontSize:'.9rem'}}>Nenhum endereço cadastrado.</p>
                  <button className="btn btn-outline btn-sm" onClick={addAddress}><i className="fa-solid fa-plus" /> Adicionar endereço</button>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'.5rem',marginBottom:'1rem'}}>
                  {addresses.map(a=>(
                    <label key={a.id} className="delivery-opt">
                      <input type="radio" name="addr" defaultChecked={a.is_default} />
                      <div className="opt-info"><strong>{a.street}{a.number?`, ${a.number}`:''}</strong><span>{a.city}, {a.state}</span></div>
                    </label>
                  ))}
                </div>
              )}
              <button className="btn btn-primary btn-full" onClick={()=>setCheckoutStep(2)}>Continuar → Pagamento</button>
            </div>
          )}
          {checkoutStep===2&&(
            <div>
              <h4 style={{fontFamily:'var(--font-head)',fontWeight:700,marginBottom:'1rem'}}>Forma de pagamento</h4>
              <div style={{display:'flex',flexDirection:'column',gap:'.6rem',marginBottom:'1rem'}}>
                {[['credit','fa-credit-card','Cartão de crédito','Até 12x sem juros'],['pix','fa-brands fa-pix','Pix','Desconto de 5%'],['boleto','fa-barcode','Boleto','Vence em 3 dias']].map(([v,ic,lb,sub])=>(
                  <label key={v} className={`delivery-opt${payMethod===v?' checked':''}`}>
                    <input type="radio" name="pay" checked={payMethod===v} onChange={()=>setPayMethod(v)} />
                    <div className="opt-info"><strong><i className={`fa-solid ${ic}`} /> {lb}</strong><span>{sub}</span></div>
                  </label>
                ))}
              </div>
              <div className="summary-line" style={{marginBottom:'.5rem'}}><span>Total</span><span style={{fontFamily:'var(--font-head)',fontSize:'1.2rem',fontWeight:900,color:'var(--red)'}}>{fmt(total)}</span></div>
              <button className="btn btn-primary btn-full" onClick={confirmOrder}><i className="fa-solid fa-lock" /> Confirmar pedido</button>
            </div>
          )}
          {checkoutStep===3&&(
            <div style={{textAlign:'center',padding:'1rem 0'}}>
              <i className="fa-solid fa-circle-check" style={{fontSize:'3.5rem',color:'var(--green)',display:'block',marginBottom:'1rem'}} />
              <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.6rem',fontWeight:900,marginBottom:'.5rem'}}>Pedido confirmado!</h3>
              {newOrderId&&<p style={{color:'var(--gray-400)',fontSize:'.9rem',marginBottom:'.5rem'}}>Número: <strong>{newOrderId}</strong></p>}
              <p style={{color:'var(--gray-500)',marginBottom:'1.5rem'}}>Acompanhe em Meus Pedidos.</p>
              <button className="btn btn-primary" onClick={()=>{setCheckoutStep(0);setPage('orders');}}>Ver meus pedidos</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}