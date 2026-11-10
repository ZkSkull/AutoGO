import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase.js';
import { storesApi, ordersApi, reviewsApi, productsApi, geoApi } from '../../lib/api';
import { fmt, statusLabel } from '../../data';
import ImageUpload from '../../components/ImageUpload';
import './Merchant.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const NAV = [
  { page: 'overview',  label: 'Visão Geral',  icon: 'fa-solid fa-chart-line' },
  { page: 'orders',    label: 'Pedidos',       icon: 'fa-solid fa-box'        },
  { page: 'products',  label: 'Produtos',      icon: 'fa-solid fa-tags'       },
  { page: 'reviews',   label: 'Avaliações',    icon: 'fa-solid fa-star'       },
  { page: 'settings',  label: 'Configurações', icon: 'fa-solid fa-gear'       },
];

const CATS = ['Motor','Freios','Suspensão','Elétrica','Filtros','Transmissão','Arrefecimento','Acessórios'];
const EMPTY_FORM = { name:'', brand:'', category:'Motor', code:'', price:'', stock:'', condition:'new', description:'', compat:'', icon_emoji:'🔩' };

export default function Merchant() {
  const { user, profile, showToast } = useApp();

  const [page,        setPage]        = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Store
  const [store,       setStore]       = useState(null);
  const [storeLoading,setStoreLoading]= useState(true);

  // Products
  const [products,    setProducts]    = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [searchProd,  setSearchProd]  = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Orders
  const [orders,      setOrders]      = useState([]);
  const [orderLoading,setOrderLoading]= useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [searchOrder, setSearchOrder] = useState('');
  const [orderModal,  setOrderModal]  = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Reviews
  const [reviews,     setReviews]     = useState([]);

  // Receita dos últimos 7 dias
  const [weekRevenue, setWeekRevenue] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weekLabels,  setWeekLabels]  = useState(['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']);

  // Settings form
  const [storeForm,   setStoreForm]   = useState({});

  const realtimeRef = useRef(null);

  // ── Carregar loja do usuário ──────────────────────────────────────────────
  const loadStore = useCallback(async () => {
    if (!user) return;
    setStoreLoading(true);
    try {
      const data = await storesApi.getMyStore(user.id);
      setStore(data);
      if (data) {
        setStoreForm({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          cnpj: data.cnpj || '',
          description: data.description || '',
          delivery_radius_km: data.delivery_radius_km || 15,
          is_open: data.is_open ?? true,
        });
        loadProducts(data.id);
        loadOrders(data.id);
        loadReviews(data.id);
        loadWeekRevenue(data.id);
        subscribeOrders(data.id);
      }
    } catch (err) {
      showToast('Erro ao carregar loja.', 'error');
      console.error(err);
    } finally {
      setStoreLoading(false);
    }
  }, [user]);

  useEffect(() => { loadStore(); return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); }; }, [loadStore]);

  // ── Tempo real — novos pedidos ────────────────────────────────────────────
  const subscribeOrders = (storeId) => {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    const channel = supabase
      .channel(`store_orders_${storeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          setOrders(prev => [payload.new, ...prev]);
          setNewOrderCount(n => n + 1);
          showToast('🔔 Novo pedido recebido!', 'success');
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => { setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)); }
      )
      .subscribe();
    realtimeRef.current = channel;
  };

  // ── Produtos ──────────────────────────────────────────────────────────────
  const loadProducts = async (storeId) => {
    setProdLoading(true);
    try {
      const { data } = await productsApi.list({ storeId, limit: 200 });
      setProducts(data || []);
    } catch { showToast('Erro ao carregar produtos.', 'error'); }
    finally { setProdLoading(false); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!store) return;
    if (!form.name?.trim() || !form.brand?.trim()) {
      showToast('Preencha o nome e a marca do produto.', 'error');
      return;
    }
    const priceNum = parseFloat(form.price);
    const stockNum = parseInt(form.stock, 10);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      showToast('Informe um preço válido maior que zero.', 'error');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      showToast('Informe uma quantidade em estoque válida.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        store_id:      store.id,
        name:          form.name.trim(),
        brand:         form.brand.trim(),
        category:      form.category || 'Motor',
        category_id:   null,
        code:          form.code?.trim() || '',
        price:         priceNum,
        stock:         stockNum,
        condition:     form.condition || 'new',
        description:   form.description || '',
        compatibility: form.compat || '',
        icon_emoji:    form.icon_emoji || '🔩',
        is_active:     true,
      };

      if (editId) {
        await productsApi.update(editId, payload);
        setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...payload } : p));
        showToast('Produto atualizado!', 'success');
      } else {
        const created = await productsApi.create(store.id, payload);
        setProducts(prev => [created, ...prev]);
        showToast('Produto adicionado!', 'success');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM);
    } catch (err) {
      showToast('Erro ao salvar produto: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await productsApi.remove(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setConfirmDelete(null);
      showToast('Produto removido.', 'info');
    } catch { showToast('Erro ao remover.', 'error'); }
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({ name: p.name, brand: p.brand, category: p.category || 'Motor', code: p.code || '', price: p.price, stock: p.stock, condition: p.condition || 'new', description: p.description || '', compat: p.compatibility || '', icon_emoji: p.icon_emoji || '🔩' });
    setShowForm(true);
    setPage('products');
  };

  // ── Pedidos ───────────────────────────────────────────────────────────────
  const loadOrders = async (storeId) => {
    setOrderLoading(true);
    try {
      const data = await ordersApi.getStoreOrders(storeId);
      setOrders(data || []);
    } catch { showToast('Erro ao carregar pedidos.', 'error'); }
    finally { setOrderLoading(false); }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setOrderModal(null);
      showToast('Status atualizado!', 'success');
    } catch { showToast('Erro ao atualizar status.', 'error'); }
  };

  const loadReviews = async (storeId) => {
    try {
      const data = await reviewsApi.getStoreReviews(storeId);
      setReviews(data || []);
    } catch { console.error('Erro ao carregar avaliações.'); }
  };

  // ── Receita dos últimos 7 dias (dados reais) ──────────────────────────────
  const loadWeekRevenue = async (storeId) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .eq('store_id', storeId)
        .eq('status', 'delivered')
        .gte('created_at', sevenDaysAgo.toISOString());
      if (error) throw error;

      // Buckets dos últimos 7 dias (hoje incluído), rotulados por dia da semana
      const days = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
        labels.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''));
      }

      const totals = days.map(day =>
        (data || [])
          .filter(o => o.created_at?.slice(0, 10) === day)
          .reduce((s, o) => s + (o.total || 0), 0)
      );

      setWeekLabels(labels.map((l, i) => i === 6 ? l : l[0].toUpperCase() + l.slice(1)));
      setWeekRevenue(totals);
    } catch (err) {
      console.error('Erro ao carregar receita semanal:', err);
      setWeekRevenue([0, 0, 0, 0, 0, 0, 0]);
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!store) return;
    if (!storeForm.name || !storeForm.name.trim()) {
      showToast('O nome da loja é obrigatório.', 'error');
      return;
    }
    try {
      // Geocoding best-effort quando só o endereço mudou
      const addressChanged = storeForm.address !== store.address;
      const updates = { ...storeForm };
      if (addressChanged) {
        const geo = await geoApi.geocode(storeForm.address);
        if (geo) { updates.lat = geo.lat; updates.lng = geo.lng; }
      }
      await storesApi.update(store.id, updates);
      setStore(prev => ({ ...prev, ...updates }));
      showToast('Configurações salvas!', 'success');
    } catch (err) { showToast('Erro ao salvar: ' + err.message, 'error'); }
  };

  // ── KPIs calculados ───────────────────────────────────────────────────────
  const todayStr    = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.created_at?.slice(0, 10) === todayStr);
  const todayRevenue= todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const preparing   = orders.filter(o => o.status === 'preparing').length;
  const avgRating   = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const filteredOrders = orders
    .filter(o => orderFilter === 'all' || o.status === orderFilter)
    .filter(o => {
      if (!searchOrder.trim()) return true;
      const q = searchOrder.toLowerCase();
      return (
        (o.order_number || o.id || '').toLowerCase().includes(q) ||
        (o.client?.name || '').toLowerCase().includes(q) ||
        (o.items || []).some(it => (it.product_name || '').toLowerCase().includes(q))
      );
    });
  const filteredProducts = products.filter(p => !searchProd || p.name.toLowerCase().includes(searchProd.toLowerCase()) || (p.brand || '').toLowerCase().includes(searchProd.toLowerCase()) || (p.code || '').toLowerCase().includes(searchProd.toLowerCase()));

  const storeName = store?.name || profile?.name || 'Minha Loja';

  // ── Loading state ─────────────────────────────────────────────────────────
  if (storeLoading) return (
    <div className="dash-bg dash-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <i className="fa-solid fa-gear fa-spin" style={{ fontSize: '2.5rem', color: 'var(--red)', display: 'block', marginBottom: '1rem' }} />
        <p>Carregando sua loja...</p>
      </div>
    </div>
  );

  // ── Sem loja cadastrada ───────────────────────────────────────────────────
  if (!store) return (
    <div className="dash-bg dash-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="dash-card" style={{ maxWidth: 480, textAlign: 'center', padding: '3rem' }}>
        <i className="fa-solid fa-store" style={{ fontSize: '3rem', color: 'var(--red)', display: 'block', marginBottom: '1rem' }} />
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.8rem', fontWeight: 900, marginBottom: '.8rem' }}>Configure sua loja</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>Sua conta foi criada, mas ainda não tem uma loja. Preencha os dados para começar a vender.</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          try {
            const data = await storesApi.create({
              owner_id: user.id,
              name: fd.get('name'),
              phone: fd.get('phone'),
              email: user.email,
              address: fd.get('address'),
              cnpj: fd.get('cnpj'),
            });
            setStore(data);
            showToast('Loja criada com sucesso!', 'success');
          } catch (err) { showToast('Erro: ' + err.message, 'error'); }
        }}>
          {[['name','Nome da loja','Auto Peças Silva'],['cnpj','CNPJ','00.000.000/0001-00'],['phone','Telefone','(11) 3333-3333'],['address','Endereço','Rua das Peças, 100 — São Paulo, SP']].map(([n,l,ph]) => (
            <div key={n} className="form-group" style={{ textAlign: 'left' }}><label>{l}</label><input name={n} placeholder={ph} required /></div>
          ))}
          <button type="submit" className="btn btn-primary btn-full"><i className="fa-solid fa-store" /> Criar loja</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="dash-bg dash-layout">
      <Sidebar items={NAV.map(n => n.page === 'orders' && newOrderCount > 0 ? { ...n, badge: newOrderCount } : n)} active={page} onNav={(p) => { setPage(p); if (p === 'orders') setNewOrderCount(0); }} storeName={storeName} role="merchant" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="dash-main">
        <header className="topbar">
          <button className="topbar-burger" onClick={() => setSidebarOpen(v => !v)}><i className="fa-solid fa-bars" /></button>
          <div className="topbar-title">{NAV.find(n => n.page === page)?.label}</div>
          <div className="topbar-actions">
            {newOrderCount > 0 && (
              <button className="topbar-btn" onClick={() => { setPage('orders'); setNewOrderCount(0); }}>
                <i className="fa-solid fa-bell" style={{ color: 'var(--red)' }} />
                <span className="notif-dot" />
              </button>
            )}
            <div className="merchant-status-toggle" onClick={async () => {
              const newStatus = !store.is_open;
              await supabase.from('stores').update({ is_open: newStatus }).eq('id', store.id);
              setStore(prev => ({ ...prev, is_open: newStatus }));
              showToast(newStatus ? 'Loja aberta!' : 'Loja fechada.', newStatus ? 'success' : 'info');
            }}>
              <span className={`status-dot ${store.is_open ? 'open' : 'closed'}`} />
              {store.is_open ? 'Aberta' : 'Fechada'}
            </div>
            <div className="topbar-avatar" onClick={() => setPage('settings')}>{storeName.slice(0,2).toUpperCase()}</div>
          </div>
        </header>

        <div className="page-content fade-in">

          {/* ════════════════════════════════
              VISÃO GERAL
          ════════════════════════════════ */}
          {page === 'overview' && (
            <div>
              <div className="merchant-welcome">
                <div>
                  <h2>Olá, {profile?.name || storeName}! 👋</h2>
                  <p>Aqui está o resumo da sua loja hoje.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setPage('products'); setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
                  <i className="fa-solid fa-plus" /> Novo Produto
                </button>
              </div>

              <div className="kpi-grid">
                {[
                  { icon:'fa-bag-shopping', val: todayOrders.length,     lbl:'Pedidos hoje',    cls:'red'  },
                  { icon:'fa-dollar-sign',  val: fmt(todayRevenue),       lbl:'Receita hoje',    cls:'dark' },
                  { icon:'fa-clock',        val: preparing,               lbl:'Em preparo',      cls:'gray' },
                  { icon:'fa-star',         val: avgRating,               lbl:'Avaliação média', cls:'red'  },
                  { icon:'fa-tags',         val: products.length,         lbl:'Produtos ativos', cls:'dark' },
                  { icon:'fa-check-circle', val: orders.filter(o=>o.status==='delivered').length, lbl:'Entregues total', cls:'gray' },
                ].map(k => (
                  <div key={k.lbl} className="kpi-card">
                    <div className={`kpi-icon ${k.cls}`}><i className={`fa-solid ${k.icon}`} /></div>
                    <div className="kpi-info">
                      <span className="kpi-value">{k.val}</span>
                      <span className="kpi-label">{k.lbl}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="two-col">
                <div className="dash-card">
                  <div className="card-header">
                    <h3>Pedidos Recentes</h3>
                    <button className="link-btn" onClick={() => setPage('orders')}>Ver todos</button>
                  </div>
                  {orders.length === 0
                    ? <div className="empty-state" style={{ padding: '1.5rem 0' }}><i className="fa-solid fa-box-open" /><p>Nenhum pedido ainda.</p></div>
                    : orders.slice(0, 5).map(o => (
                      <div key={o.id} className="mini-order-row" onClick={() => setOrderModal(o)} style={{ cursor: 'pointer' }}>
                        <span className="order-id">{o.order_number}</span>
                        <span className="order-client">{o.client?.name || '—'}</span>
                        <span className={`status-badge status-${o.status}`}>{statusLabel(o.status)}</span>
                        <span className="order-total">{fmt(o.total)}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="dash-card">
                  <div className="card-header">
                    <h3>Top Produtos</h3>
                    <button className="link-btn" onClick={() => setPage('products')}>Gerenciar</button>
                  </div>
                  {products.length === 0
                    ? <div className="empty-state" style={{ padding: '1.5rem 0' }}><i className="fa-solid fa-tags" /><p>Nenhum produto cadastrado.</p></div>
                    : products.slice(0, 5).map(p => (
                      <div key={p.id} className="top-product-row" onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                        <div className="tp-icon">{p.icon_emoji || '🔩'}</div>
                        <span className="tp-name">{p.name}</span>
                        <span className="tp-sales">{p.stock} un.</span>
                        <span className="tp-price">{fmt(p.price)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="dash-card" style={{ marginTop: '1rem' }}>
                <div className="card-header"><h3>Receita — últimos 7 dias</h3></div>
                <Bar
                  data={{
                    labels: weekLabels,
                    datasets: [{ data: weekRevenue, backgroundColor: 'rgba(225,26,44,.8)', borderRadius: 6, hoverBackgroundColor: '#E11A2C' }]
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => 'R$'+v } }, x: { grid: { display: false } } } }}
                />
              </div>
            </div>
          )}

          {/* ════════════════════════════════
              PEDIDOS
          ════════════════════════════════ */}
          {page === 'orders' && (
            <div>
              <div className="page-header-row">
                <h2>Pedidos {newOrderCount > 0 && <span className="new-badge">{newOrderCount} novo{newOrderCount > 1 ? 's' : ''}</span>}</h2>
                <div style={{ display: 'flex', gap: '.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="search-bar-std" style={{ maxWidth: 300 }}>
                    <i className="fa-solid fa-magnifying-glass" />
                    <input
                      type="text"
                      placeholder="Buscar por #pedido, cliente ou item…"
                      value={searchOrder}
                      onChange={e => setSearchOrder(e.target.value)}
                    />
                    {searchOrder && (
                      <button type="button" onClick={() => setSearchOrder('')} aria-label="Limpar busca">
                        <i className="fa-solid fa-xmark" />
                      </button>
                    )}
                  </div>
                  <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)} className="filter-select">
                    <option value="all">Todos</option>
                    <option value="pending">Aguardando</option>
                    <option value="preparing">Em preparo</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {orderLoading
                ? <div className="loading-state"><i className="fa-solid fa-spinner fa-spin" /> Carregando pedidos...</div>
                : filteredOrders.length === 0
                  ? <div className="empty-state"><i className="fa-solid fa-box-open" /><p>Nenhum pedido encontrado.</p></div>
                  : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="orders-table">
                        <thead><tr><th>#Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th>Data</th><th>Ação</th></tr></thead>
                        <tbody>
                          {filteredOrders.map(o => (
                            <tr key={o.id}>
                              <td><strong>{o.order_number}</strong></td>
                              <td>{o.client?.name || '—'}</td>
                              <td style={{ fontSize: '.84rem' }}>{o.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ') || '—'}</td>
                              <td><strong>{fmt(o.total)}</strong></td>
                              <td><span className={`status-badge status-${o.status}`}>{statusLabel(o.status)}</span></td>
                              <td style={{ fontSize: '.82rem', color: 'var(--gray-400)' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                              <td><button className="btn btn-outline btn-sm" onClick={() => setOrderModal(o)}>Ver</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              }
            </div>
          )}

          {/* ════════════════════════════════
              PRODUTOS
          ════════════════════════════════ */}
          {page === 'products' && (
            <div>
              <div className="page-header-row">
                <h2>Produtos</h2>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
                  <i className="fa-solid fa-plus" /> Novo Produto
                </button>
              </div>

              {/* FORM */}
              {showForm && (
                <div className="dash-card product-form-card">
                  <div className="card-header">
                    <h3>{editId ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
                      <i className="fa-solid fa-xmark" /> Cancelar
                    </button>
                  </div>
                  <form onSubmit={handleSaveProduct} className="product-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nome do produto *</label>
                        <input placeholder="Filtro de Óleo Bosch" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label>Marca *</label>
                        <input placeholder="Bosch" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Categoria *</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                          {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Código / Part Number</label>
                        <input placeholder="F026407006" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Preço (R$) *</label>
                        <input type="number" step="0.01" min="0" placeholder="34.90" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label>Estoque *</label>
                        <input type="number" min="0" placeholder="10" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label>Condição</label>
                        <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                          <option value="new">Novo</option>
                          <option value="reman">Remanufaturado</option>
                          <option value="used">Usado</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Emoji / Ícone</label>
                        <input placeholder="🔩" value={form.icon_emoji} onChange={e => setForm(f => ({ ...f, icon_emoji: e.target.value }))} style={{ fontSize: '1.3rem', width: 80 }} />
                      </div>
                      <div className="form-group" style={{ flex: 3 }}>
                        <label>Compatibilidade</label>
                        <input placeholder="Gol G5, Polo, Fox 2004-2016" value={form.compat} onChange={e => setForm(f => ({ ...f, compat: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Descrição</label>
                      <textarea rows={3} placeholder="Descreva o produto..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Salvando…</> : <><i className="fa-solid fa-check" /> {editId ? 'Atualizar' : 'Adicionar'}</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SEARCH */}
              <div className="products-search-bar">
                <i className="fa-solid fa-magnifying-glass" />
                <input placeholder="Buscar produto..." value={searchProd} onChange={e => setSearchProd(e.target.value)} />
                {searchProd && <button onClick={() => setSearchProd('')}><i className="fa-solid fa-xmark" /></button>}
              </div>

              {/* LIST */}
              {prodLoading
                ? <div className="loading-state"><i className="fa-solid fa-spinner fa-spin" /> Carregando produtos...</div>
                : filteredProducts.length === 0
                  ? <div className="empty-state"><i className="fa-solid fa-tags" /><p>{searchProd ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</p></div>
                  : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="orders-table">
                        <thead><tr><th>Produto</th><th>Marca</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Condição</th><th>Ações</th></tr></thead>
                        <tbody>
                          {filteredProducts.map(p => (
                            <tr key={p.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                                  <span style={{ fontSize: '1.3rem' }}>{p.icon_emoji || '🔩'}</span>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}</div>
                                    {p.code && <div style={{ fontSize: '.75rem', color: 'var(--gray-400)' }}>#{p.code}</div>}
                                  </div>
                                </div>
                              </td>
                              <td>{p.brand}</td>
                              <td>{p.category}</td>
                              <td><strong>{fmt(p.price)}</strong></td>
                              <td>
                                <span style={{ color: p.stock > 5 ? 'var(--green)' : p.stock > 0 ? '#F97316' : 'var(--red)', fontWeight: 600 }}>
                                  {p.stock} un.
                                </span>
                              </td>
                              <td><span className="condition-tag">{p.condition === 'new' ? 'Novo' : p.condition === 'reman' ? 'Remanuf.' : 'Usado'}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '.4rem' }}>
                                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>
                                  <button className="btn btn-sm" style={{ background: 'rgba(225,26,44,.08)', color: 'var(--red)', border: '2px solid rgba(225,26,44,.2)' }} onClick={() => setConfirmDelete(p)}><i className="fa-solid fa-trash" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              }
            </div>
          )}

          {/* ════════════════════════════════
              AVALIAÇÕES
          ════════════════════════════════ */}
          {page === 'reviews' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem' }}>Avaliações</h2>
              <div className="reviews-summary">
                <div className="review-score">
                  <span className="big-score">{store.rating || '—'}</span>
                  <div className="stars-row" style={{ color: '#F5A623' }}>{'★'.repeat(Math.round(store.rating || 0))}</div>
                  <span style={{ fontSize: '.85rem', color: 'var(--gray-400)' }}>{store.total_reviews || 0} avaliações</span>
                </div>
                <div className="review-bars">
                  {[5,4,3,2,1].map(s => {
                    const count = reviews.filter(r => r.rating === s).length;
                    const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={s} className="rbar-row">
                        <span>{s} ★</span>
                        <div className="rbar-track"><div className="rbar-fill" style={{ width: pct + '%' }} /></div>
                        <span>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {reviews.length === 0
                ? <div className="empty-state"><i className="fa-solid fa-star" /><p>Nenhuma avaliação ainda.</p></div>
                : reviews.map(r => (
                  <div key={r.id} className="dash-card" style={{ marginBottom: '.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.8rem' }}>
                      <div className="reviewer-avatar">{(r.user?.name || '?').slice(0,2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.user?.name || 'Anônimo'}</div>
                        <div style={{ color: '#F5A623', fontSize: '.85rem' }}>{'★'.repeat(r.rating)}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--gray-400)' }}>
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: '.9rem', color: 'var(--gray-600)' }}>{r.comment}</p>}
                  </div>
                ))
              }
            </div>
          )}

          {/* ════════════════════════════════
              CONFIGURAÇÕES
          ════════════════════════════════ */}
          {page === 'settings' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem' }}>Configurações da Loja</h2>
              <div className="settings-grid">
                <div className="dash-card">
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem' }}>Informações</h3>
                  <form onSubmit={handleSaveStore}>
                    {[
                      ['name',     'Nome da loja',       'text'],
                      ['phone',    'Telefone',           'text'],
                      ['email',    'E-mail',             'email'],
                      ['cnpj',     'CNPJ',               'text'],
                      ['address',  'Endereço',           'text'],
                      ['delivery_radius_km', 'Raio de entrega (km)', 'number'],
                    ].map(([field, label, type]) => (
                      <div key={field} className="form-group">
                        <label>{label}</label>
                        <input type={type} value={storeForm[field] || ''} onChange={e => setStoreForm(f => ({ ...f, [field]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Descrição</label>
                      <textarea rows={3} value={storeForm.description || ''} onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))} placeholder="Conte um pouco sobre sua loja..." />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Abre às</label>
                        <input type="time" value={storeForm.open_time || ''} onChange={e => setStoreForm(f => ({ ...f, open_time: e.target.value || null }))} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Fecha às</label>
                        <input type="time" value={storeForm.close_time || ''} onChange={e => setStoreForm(f => ({ ...f, close_time: e.target.value || null }))} />
                      </div>
                    </div>
                    <p style={{ fontSize: '.78rem', color: 'var(--gray-400)', margin: '-.5rem 0 1rem' }}>
                      Preenchendo os horários, o status "Aberta/Fechada" passa a ser automático.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 600, fontSize: '.9rem' }}>Status da loja:</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={storeForm.is_open ?? true} disabled={!!(storeForm.open_time && storeForm.close_time)} onChange={e => setStoreForm(f => ({ ...f, is_open: e.target.checked }))} />
                        {storeForm.is_open ? '🟢 Aberta' : '🔴 Fechada'}
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary">Salvar alterações</button>
                  </form>
                </div>
                <div className="dash-card">
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem' }}>Estatísticas da loja</h3>
                  {[
                    ['Produtos ativos',   products.length],
                    ['Total de pedidos',  orders.length],
                    ['Pedidos entregues', orders.filter(o=>o.status==='delivered').length],
                    ['Avaliação média',   store.rating || '—'],
                    ['Total avaliações',  store.total_reviews || 0],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '.9rem' }}>
                      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                      <strong>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ORDER MODAL */}
      {orderModal && (
        <Modal open title={`Pedido ${orderModal.order_number}`} onClose={() => setOrderModal(null)}
          footer={
            <div style={{ display: 'flex', gap: '.6rem', width: '100%', alignItems: 'center' }}>
              <select
                defaultValue={orderModal.status}
                onChange={e => setOrderModal(prev => ({ ...prev, _newStatus: e.target.value }))}
                className="filter-select" style={{ flex: 1 }}
              >
                {['pending','preparing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => handleUpdateOrderStatus(orderModal.id, orderModal._newStatus || orderModal.status)}>
                Atualizar
              </button>
              <button className="btn btn-ghost" onClick={() => setOrderModal(null)}>Fechar</button>
            </div>
          }
        >
          <div className="order-modal-info">
            <div className="info-row"><span className="label">Cliente</span><span className="value">{orderModal.client?.name || '—'}</span></div>
            <div className="info-row"><span className="label">Telefone</span><span className="value">{orderModal.client?.phone || '—'}</span></div>
            <div className="info-row"><span className="label">Endereço</span><span className="value">{orderModal.address ? `${orderModal.address.street}, ${orderModal.address.number} — ${orderModal.address.city}` : '—'}</span></div>
            <div className="info-row"><span className="label">Data</span><span className="value">{new Date(orderModal.created_at).toLocaleDateString('pt-BR')}</span></div>
            <div style={{ marginTop: '1rem' }}>
              <strong style={{ fontSize: '.9rem' }}>Itens:</strong>
              {orderModal.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem', color: 'var(--gray-600)', marginTop: '.4rem', padding: '.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span>{item.product_name} x{item.quantity}</span>
                  <span>{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="info-row" style={{ marginTop: '.8rem' }}>
              <span className="label" style={{ fontWeight: 700 }}>Total</span>
              <span style={{ color: 'var(--red)', fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 900 }}>{fmt(orderModal.total)}</span>
            </div>
          </div>
        </Modal>
      )}
      {/* DELETE PRODUCT MODAL */}
      {confirmDelete && (
        <Modal open title="Remover produto" onClose={() => setConfirmDelete(null)}
          footer={
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteProduct(confirmDelete.id)}>
                <i className="fa-solid fa-trash" /> Remover
              </button>
            </div>
          }
        >
          <p style={{ color: 'var(--gray-500)', fontSize: '.9rem' }}>
            Tem certeza que deseja remover <strong>{confirmDelete.name}</strong>?
            O produto deixará de aparecer na loja, mas o histórico de pedidos será mantido.
          </p>
        </Modal>
      )}
    </div>
  );
}