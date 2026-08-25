import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import PriceComparison from '../../components/PriceComparison';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { profilesApi, addressesApi, vehiclesApi, ordersApi, reviewsApi } from '../../lib/api';
import { fmt, statusLabel } from '../../data';
import useSupabaseQuery from '../../lib/useSupabaseQuery';
import ClientShop from './ClientShop';
import ClientCart from './ClientCart';
import ClientOrders from './ClientOrders';
import ClientFavorites from './ClientFavorites';
import ClientProfile from './ClientProfile';
import './Client.css';

const NAV = [
  { page: 'shop',      label: 'Loja',        icon: 'fa-solid fa-shop'          },
  { page: 'cart',      label: 'Carrinho',     icon: 'fa-solid fa-cart-shopping' },
  { page: 'orders',    label: 'Meus Pedidos', icon: 'fa-solid fa-box'           },
  { page: 'favorites', label: 'Favoritos',    icon: 'fa-solid fa-heart'         },
  { page: 'profile',   label: 'Meu Perfil',   icon: 'fa-solid fa-circle-user'   },
];

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

  const [orders,          setOrders]          = useState([]);
  const [ordLoading,      setOrdLoading]      = useState(false);
  const [addresses,       setAddresses]       = useState([]);
  const [addrLoading,     setAddrLoading]     = useState(false);
  const [vehicles,        setVehicles]        = useState([]);
  const [profileForm,     setProfileForm]     = useState({});
  const [profSaving,      setProfSaving]      = useState(false);
  const [newOrderId,      setNewOrderId]      = useState(null);
  const [reviewModal,     setReviewModal]     = useState(null);
  const [reviewForm,      setReviewForm]      = useState({ rating:5, comment:'' });
  const [reviewSaving,    setReviewSaving]    = useState(false);

  const realtimeChannel = useRef(null);

  const { data: products, loading: prodLoading } = useSupabaseQuery(
    () => supabase
      .from('products')
      .select('*, store:stores(id, name, rating, is_open)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(p => ({
          ...p, icon: p.icon_emoji || '🔩',
          compat: p.compatibility || '', code: p.code || '',
          badge: p.badge || '', storeId: p.store_id,
        }));
      }),
    []
  );

  useEffect(() => {
    if (params.get('cat'))    setCat(params.get('cat'));
    if (params.get('page') === 'cart') setPage('cart');
    if (params.get('search')) setSearch(params.get('search'));
  }, [params]);

  useEffect(() => {
    if (!user) return;
    loadUserData();
    subscribeOrderUpdates();
    return () => { if (realtimeChannel.current) supabase.removeChannel(realtimeChannel.current); };
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({ name: profile.name||'', phone: profile.phone||'', cpf: profile.cpf||'' });
  }, [profile]);

  const loadUserData = async () => {
    loadOrders(); loadAddresses(); loadVehicles();
  };

  const loadOrders = async () => {
    setOrdLoading(true);
    try {
      const data = await ordersApi.getClientOrders(user.id);
      setOrders(data || []);
    } catch (err) { console.error(err); }
    finally { setOrdLoading(false); }
  };

  const loadAddresses = async () => {
    setAddrLoading(true);
    try {
      const data = await addressesApi.list(user.id);
      setAddresses(data);
    } catch (err) { console.error(err); }
    finally { setAddrLoading(false); }
  };

  const loadVehicles = async () => {
    try {
      const data = await vehiclesApi.list(user.id);
      setVehicles(data);
    } catch (err) { console.error(err); }
  };

  const subscribeOrderUpdates = () => {
    realtimeChannel.current = supabase
      .channel(`client_orders_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `client_id=eq.${user.id}` },
        payload => { setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)); showToast(`Pedido atualizado: ${statusLabel(payload.new.status)}`, 'info'); })
      .subscribe();
  };

  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const clearFilters = () => setFilters({ priceRange:'all', customMin:'', customMax:'', brands:[], condition:'all', minRating:0, onlyInStock:false });

  const cartItems = useMemo(() => cart.map(i => ({ ...i, product: products?.find(p => p.id===i.id) })).filter(i => i.product), [cart, products]);
  const subtotal  = useMemo(() => cartItems.reduce((s,i) => s+i.product.price*i.qty, 0), [cartItems]);
  const freight   = delivery==='pickup'?0:delivery==='standard'&&subtotal>=100?0:delivery==='express'?8.90:5.90;
  const total     = subtotal+freight-discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase()==='PECAS10') { setDiscount(subtotal*.1); showToast('Cupom aplicado! 10% de desconto.','success'); }
    else showToast('Cupom inválido.','error');
  };

  const confirmOrder = async () => {
    if (!user) { showToast('Faça login para finalizar.','error'); return; }
    if (cartItems.length === 0) { showToast('Seu carrinho está vazio.','error'); return; }

    const storeIds = [...new Set(cartItems.map(i => i.product.storeId))];
    if (storeIds.length > 1) {
      showToast('Seu carrinho contém produtos de lojas diferentes. Faça um pedido por loja.','error');
      return;
    }
    const storeId = storeIds[0] || null;

    try {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      const items = cartItems.map(i => ({
        product_id: i.product.id, product_name: i.product.name,
        product_price: i.product.price, quantity: i.qty, subtotal: i.product.price * i.qty,
      }));
      const order = await ordersApi.create({
        clientId: user.id, storeId, addressId: defaultAddr?.id||null,
        subtotal, freight, discount, total, deliveryType: delivery, paymentMethod: payMethod, items,
      });
      setNewOrderId(order.order_number);
      clearCart(); setDiscount(0); setCoupon(''); setCheckoutStep(3);
      loadOrders();
    } catch (err) { showToast('Erro ao criar pedido: ' + err.message, 'error'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    setReviewSaving(true);
    try {
      await reviewsApi.create({ orderId: reviewModal.id, storeId: reviewModal.store_id, userId: user.id, rating: reviewForm.rating, comment: reviewForm.comment });
      await supabase.from('orders').update({ reviewed: true }).eq('id', reviewModal.id);
      setOrders(prev => prev.map(o => o.id === reviewModal.id ? { ...o, reviewed: true } : o));
      setReviewModal(null); setReviewForm({ rating:5, comment:'' });
      showToast('Avaliação enviada! Obrigado.', 'success');
    } catch { showToast('Erro ao enviar avaliação.', 'error'); }
    finally { setReviewSaving(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setProfSaving(true);
    try {
      await profilesApi.update(user.id, profileForm);
      showToast('Perfil atualizado!', 'success');
    } catch (err) { showToast('Erro ao salvar: '+err.message, 'error'); }
    finally { setProfSaving(false); }
  };

  const removeAddress = async (id) => {
    try { await addressesApi.remove(id); setAddresses(prev => prev.filter(a => a.id !== id)); showToast('Endereço removido.', 'info'); }
    catch (err) { showToast('Erro: '+err.message, 'error'); }
  };

  const clientName = profile?.name || user?.email?.split('@')[0] || 'Você';
  const navItems   = NAV.map(n => n.page==='cart' ? { ...n, badge: cartTotal } : n);

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
            <button className="topbar-btn" onClick={()=>setPage('cart')}><i className="fa-solid fa-cart-shopping" />{cartTotal>0&&<span className="notif-dot" />}</button>
            <div className="topbar-avatar" onClick={()=>setPage('profile')}>{clientName.slice(0,2).toUpperCase()}</div>
          </div>
        </header>
        <div className="page-content fade-in">
          {page==='shop' && (
            <ClientShop
              products={products||[]} prodLoading={prodLoading}
              filters={filters} onFilterChange={handleFilterChange} onClearFilters={clearFilters}
              sort={sort} onSortChange={setSort}
              viewMode={viewMode} onViewModeChange={setViewMode}
              cat={cat} onCatChange={setCat}
              search={search} onSearchChange={setSearch}
              onOpenProduct={setProductModal} onCompare={setCompareProduct}
              filterPanelOpen={filterPanelOpen} onToggleFilterPanel={() => setFilterPanelOpen(v => !v)}
              onAdd={addToCart} onFav={toggleFav} favorites={favorites} showToast={showToast}
            />
          )}
          {page==='cart' && (
            <ClientCart
              cartItems={cartItems} subtotal={subtotal} freight={freight} discount={discount} total={total}
              changeQty={changeQty} removeFromCart={removeFromCart} setPage={setPage}
              delivery={delivery} setDelivery={setDelivery}
              coupon={coupon} setCoupon={setCoupon} applyCoupon={applyCoupon}
              setCheckoutStep={setCheckoutStep} showToast={showToast}
            />
          )}
          {page==='orders' && (
            <ClientOrders
              orders={orders} ordLoading={ordLoading} loadOrders={loadOrders} setPage={setPage}
              setReviewModal={setReviewModal} setReviewForm={setReviewForm}
            />
          )}
          {page==='favorites' && (
            <ClientFavorites
              favorites={favorites} products={products||[]} setPage={setPage} setProductModal={setProductModal}
            />
          )}
          {page==='profile' && (
            <ClientProfile
              user={user} profile={profile} profileForm={profileForm} setProfileForm={setProfileForm}
              profSaving={profSaving} saveProfile={saveProfile}
              addresses={addresses} addrLoading={addrLoading} loadAddresses={loadAddresses} removeAddress={removeAddress}
              vehicles={vehicles} showToast={showToast}
            />
          )}
        </div>
      </main>

      {productModal && (
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

      {compareProduct && (
        <Modal open title={`Comparar — ${compareProduct.name}`} onClose={()=>setCompareProduct(null)} size="compare">
          <PriceComparison product={compareProduct} onClose={()=>setCompareProduct(null)} />
        </Modal>
      )}

      {checkoutStep>0 && (
        <Modal open title="Finalizar Pedido" onClose={()=>setCheckoutStep(0)}>
          {checkoutStep===1 && (
            <div>
              <h4 style={{fontFamily:'var(--font-head)',fontWeight:700,marginBottom:'1rem'}}>Endereço de entrega</h4>
              {addresses.length===0?(
                <p style={{color:'var(--gray-400)',marginBottom:'1rem',fontSize:'.9rem'}}>Nenhum endereço cadastrado.</p>
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
          {checkoutStep===2 && (
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
          {checkoutStep===3 && (
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

      {reviewModal && (
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
                    style={{fontSize:'1.8rem',background:'none',border:'none',cursor:'pointer',color:s<=reviewForm.rating?'#F5A623':'var(--gray-300)',transition:'color .15s'}}>★</button>
                ))}
                <span style={{fontSize:'.9rem',color:'var(--gray-400)',alignSelf:'center',marginLeft:'.3rem'}}>{reviewForm.rating}/5</span>
              </div>
            </div>
            <div className="form-group">
              <label>Comentário (opcional)</label>
              <textarea rows={3} placeholder="Como foi sua experiência?" value={reviewForm.comment}
                onChange={e=>setReviewForm(f=>({...f,comment:e.target.value}))}
                style={{width:'100%',padding:'.7rem',border:'2px solid var(--gray-200)',borderRadius:'var(--radius)',fontSize:'.9rem',resize:'vertical'}} />
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