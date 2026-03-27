import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase.js';
import { fmt } from '../../data';
import './Driver.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const NAV = [
  { page:'home',       label:'Início',    icon:'fa-solid fa-house'             },
  { page:'deliveries', label:'Entregas',  icon:'fa-solid fa-route'             },
  { page:'history',    label:'Histórico', icon:'fa-solid fa-clock-rotate-left' },
  { page:'earnings',   label:'Ganhos',    icon:'fa-solid fa-wallet'            },
  { page:'profile',    label:'Perfil',    icon:'fa-solid fa-circle-user'       },
];

const STATUS_LABEL = { pending:'Aguardando', preparing:'Em preparo', shipped:'Enviado', delivering:'Em rota', delivered:'Entregue', cancelled:'Cancelado' };
const sl = s => STATUS_LABEL[s] || s;

export default function Driver() {
  const { user, profile, showToast } = useApp();

  const [page,           setPage]          = useState('home');
  const [sidebarOpen,    setSidebarOpen]   = useState(false);
  const [isOnline,       setIsOnline]      = useState(false);

  // Driver data
  const [driverData,     setDriverData]    = useState(null);
  const [driverLoading,  setDriverLoading] = useState(true);

  // Available deliveries queue
  const [queue,          setQueue]         = useState([]);
  const [queueLoading,   setQueueLoading]  = useState(false);

  // My deliveries
  const [myDeliveries,   setMyDeliveries]  = useState([]);
  const [myLoading,      setMyLoading]     = useState(false);
  const [activeDelivery, setActiveDelivery]= useState(null);

  // Modals
  const [acceptModal,    setAcceptModal]   = useState(null);
  const [detailModal,    setDetailModal]   = useState(null);
  const [withdrawModal,  setWithdrawModal] = useState(false);
  const [timerPct,       setTimerPct]      = useState(100);
  const [accepting,      setAccepting]     = useState(false);
  const [profileForm,    setProfileForm]   = useState({});
  const [profSaving,     setProfSaving]    = useState(false);

  const timerRef    = useRef(null);
  const realtimeCh  = useRef(null);

  // ── Load driver data ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadDriverData();
    loadMyDeliveries();
    setProfileForm({ name: profile?.name||'', phone: profile?.phone||'', cpf: profile?.cpf||'' });
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    if (isOnline) {
      loadQueue();
      subscribeQueue();
    } else {
      setQueue([]);
      if (realtimeCh.current) supabase.removeChannel(realtimeCh.current);
    }
    updateOnlineStatus(isOnline);
    return () => { if (realtimeCh.current) supabase.removeChannel(realtimeCh.current); };
  }, [isOnline, user]);

  const loadDriverData = async () => {
    setDriverLoading(true);
    try {
      const { data } = await supabase.from('drivers').select('*').eq('id', user.id).single();
      setDriverData(data);
      if (data) setIsOnline(data.is_online);
    } catch (err) { console.error(err); }
    finally { setDriverLoading(false); }
  };

  const loadQueue = async () => {
    setQueueLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, store:stores(name, address), address:addresses(street, number, city), client:profiles(name, phone), items:order_items(product_name, quantity)`)
        .eq('status', 'preparing')
        .is('driver_id', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setQueue(data || []);
    } catch (err) { console.error(err); }
    finally { setQueueLoading(false); }
  };

  const loadMyDeliveries = async () => {
    setMyLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, store:stores(name, address), address:addresses(street, number, city), client:profiles(name, phone), items:order_items(product_name, quantity)`)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMyDeliveries(data || []);
      const active = data?.find(d => d.status === 'shipped' || d.status === 'delivering');
      setActiveDelivery(active || null);
    } catch (err) { console.error(err); }
    finally { setMyLoading(false); }
  };

  const updateOnlineStatus = async (online) => {
    if (!user) return;
    try {
      await supabase.from('drivers').upsert({ id: user.id, is_online: online });
    } catch (err) { console.error(err); }
  };

  // ── Realtime — available deliveries ──────────────────────
  const subscribeQueue = () => {
    realtimeCh.current = supabase
      .channel(`driver_queue_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        if (payload.new.status === 'preparing' && !payload.new.driver_id) {
          setQueue(prev => [...prev, payload.new]);
          showToast('🔔 Nova entrega disponível!', 'success');
          setAcceptModal(payload.new);
          startTimer();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `driver_id=eq.${user.id}` }, payload => {
        setMyDeliveries(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d));
      })
      .subscribe();
  };

  // ── Accept timer ──────────────────────────────────────────
  const startTimer = () => {
    setTimerPct(100);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerPct(p => {
        if (p <= 0) { clearInterval(timerRef.current); setAcceptModal(null); return 100; }
        return p - (100/30);
      });
    }, 1000);
  };

  useEffect(() => {
    if (acceptModal) startTimer();
    return () => clearInterval(timerRef.current);
  }, [acceptModal?.id]);

  // ── Accept delivery ───────────────────────────────────────
  const acceptDelivery = async (order) => {
    setAccepting(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ driver_id: user.id, status: 'shipped' })
        .eq('id', order.id)
        .is('driver_id', null)
        .select()
        .single();

      if (error || !data) throw new Error('Entrega já aceita por outro entregador.');

      const newDelivery = { ...order, ...data, status: 'shipped' };
      setActiveDelivery(newDelivery);
      setMyDeliveries(prev => [newDelivery, ...prev]);
      setQueue(prev => prev.filter(q => q.id !== order.id));
      setAcceptModal(null);
      clearInterval(timerRef.current);
      showToast('Entrega aceita! Vá buscar o pedido.', 'success');

      // Update driver stats
      await supabase.from('drivers').update({ total_deliveries: (driverData?.total_deliveries||0) + 1 }).eq('id', user.id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAccepting(false);
    }
  };

  // ── Update delivery status ────────────────────────────────
  const updateDeliveryStatus = async (orderId, status) => {
    try {
      const updates = { status };
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();

      await supabase.from('orders').update(updates).eq('id', orderId);
      setMyDeliveries(prev => prev.map(d => d.id === orderId ? { ...d, status } : d));
      if (activeDelivery?.id === orderId) {
        if (status === 'delivered') setActiveDelivery(null);
        else setActiveDelivery(prev => ({ ...prev, status }));
      }
      showToast(`Status atualizado: ${sl(status)}`, 'success');

      if (status === 'delivered') {
        // Adicionar ganho ao entregador
        const earnings = (activeDelivery?.freight || 8.90) * 0.7;
        await supabase.from('drivers').update({ balance: (driverData?.balance||0) + earnings }).eq('id', user.id);
        loadDriverData();
      }
    } catch (err) {
      showToast('Erro ao atualizar: ' + err.message, 'error');
    }
  };

  // ── Save profile ──────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfSaving(true);
    try {
      await supabase.from('profiles').update(profileForm).eq('id', user.id);
      showToast('Perfil atualizado!', 'success');
    } catch (err) { showToast('Erro: ' + err.message, 'error'); }
    finally { setProfSaving(false); }
  };

  const driverName   = profile?.name || user?.email?.split('@')[0] || 'Entregador';
  const initials     = driverName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const totalEarned  = myDeliveries.filter(d=>d.status==='delivered').reduce((s,d)=>(s+(d.freight||8.90)*0.7),0);
  const todayDeliveries = myDeliveries.filter(d=>d.status==='delivered'&&d.delivered_at?.startsWith(new Date().toISOString().slice(0,10)));
  const navItems     = NAV.map(n=>n.page==='deliveries'&&queue.length>0?{...n,badge:queue.length}:n);

  if (driverLoading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'var(--gray-100)'}}>
      <i className="fa-solid fa-gear fa-spin" style={{fontSize:'2rem',color:'var(--red)'}} />
    </div>
  );

  return (
    <div className="dash-bg dash-layout">
      <Sidebar items={navItems} active={page} onNav={setPage} storeName={driverName} role="driver" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="dash-main">
        <header className="topbar">
          <button className="topbar-burger" onClick={()=>setSidebarOpen(v=>!v)}><i className="fa-solid fa-bars" /></button>
          <div className="topbar-title">{NAV.find(n=>n.page===page)?.label}</div>
          <div className="topbar-actions">
            {/* Online toggle */}
            <div className="online-toggle" onClick={()=>setIsOnline(v=>!v)} style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.4rem .9rem',borderRadius:100,border:`2px solid ${isOnline?'var(--green)':'var(--gray-300)'}`,cursor:'pointer',fontSize:'.85rem',fontWeight:600,color:isOnline?'var(--green)':'var(--gray-400)',transition:'all .3s'}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:isOnline?'var(--green)':'var(--gray-300)',transition:'background .3s'}} />
              {isOnline?'Online':'Offline'}
            </div>
            <div className="topbar-avatar" onClick={()=>setPage('profile')}>{initials}</div>
          </div>
        </header>

        <div className="page-content fade-in">

          {/* ══ HOME ═════════════════════════════════════════ */}
          {page==='home'&&(
            <div>
              <div className="merchant-welcome">
                <div><h2>Olá, {driverName}! 👋</h2><p>{isOnline?'Você está online e recebendo pedidos.':'Fique online para receber pedidos.'}</p></div>
              </div>

              <div className="kpi-grid">
                {[
                  { icon:'fa-truck-fast',   val:todayDeliveries.length,    lbl:'Entregas hoje',  cls:'red'  },
                  { icon:'fa-wallet',       val:fmt(todayDeliveries.reduce((s,d)=>(s+(d.freight||8.90)*.7),0)), lbl:'Ganhos hoje', cls:'dark' },
                  { icon:'fa-star',         val:(driverData?.rating||5.0).toFixed(1), lbl:'Avaliação',  cls:'red'  },
                  { icon:'fa-route',        val:driverData?.total_deliveries||0, lbl:'Total entregas',cls:'gray' },
                ].map(k=>(
                  <div key={k.lbl} className="kpi-card">
                    <div className={`kpi-icon ${k.cls}`}><i className={`fa-solid ${k.icon}`} /></div>
                    <div className="kpi-info"><span className="kpi-value">{k.val}</span><span className="kpi-label">{k.lbl}</span></div>
                  </div>
                ))}
              </div>

              {/* Entrega ativa */}
              {activeDelivery&&(
                <div className="dash-card" style={{marginBottom:'1rem',border:'2px solid var(--red)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                    <div>
                      <h3 style={{fontFamily:'var(--font-head)',fontWeight:700}}>Entrega Ativa</h3>
                      <span style={{fontSize:'.83rem',color:'var(--gray-400)'}}>{activeDelivery.order_number}</span>
                    </div>
                    <span className={`status-badge status-${activeDelivery.status}`}>{sl(activeDelivery.status)}</span>
                  </div>
                  <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',fontSize:'.88rem',color:'var(--gray-600)',marginBottom:'1rem'}}>
                    <span><i className="fa-solid fa-store" style={{color:'var(--red)'}} /> {activeDelivery.store?.name||'—'}</span>
                    <span><i className="fa-solid fa-location-dot" style={{color:'var(--red)'}} /> {activeDelivery.address?.street||'—'}{activeDelivery.address?.number?`, ${activeDelivery.address.number}`:''}</span>
                    <span><i className="fa-solid fa-user" style={{color:'var(--red)'}} /> {activeDelivery.client?.name||'—'}</span>
                    <span><i className="fa-solid fa-phone" style={{color:'var(--red)'}} /> {activeDelivery.client?.phone||'—'}</span>
                  </div>
                  <div style={{display:'flex',gap:'.7rem',flexWrap:'wrap'}}>
                    {activeDelivery.status==='shipped'&&(
                      <button className="btn btn-primary" onClick={()=>updateDeliveryStatus(activeDelivery.id,'delivering')}>
                        <i className="fa-solid fa-box-open" /> Confirmar coleta
                      </button>
                    )}
                    {activeDelivery.status==='delivering'&&(
                      <button className="btn btn-primary" onClick={()=>updateDeliveryStatus(activeDelivery.id,'delivered')}>
                        <i className="fa-solid fa-circle-check" /> Confirmar entrega
                      </button>
                    )}
                    <button className="btn btn-outline" onClick={()=>setDetailModal(activeDelivery)}>
                      <i className="fa-solid fa-info-circle" /> Detalhes
                    </button>
                  </div>
                </div>
              )}

              {/* Fila de entregas disponíveis */}
              <div className="dash-card">
                <div className="card-header">
                  <h3>Disponíveis agora {queue.length>0&&<span style={{background:'var(--red)',color:'#fff',borderRadius:100,padding:'2px 8px',fontSize:'.75rem',marginLeft:'.4rem'}}>{queue.length}</span>}</h3>
                  <button className="btn btn-outline btn-sm" onClick={loadQueue}><i className="fa-solid fa-rotate" /></button>
                </div>
                {!isOnline?(
                  <div className="empty-state" style={{padding:'1.5rem 0'}}>
                    <i className="fa-solid fa-moon" />
                    <p>Fique online para ver as entregas disponíveis.</p>
                  </div>
                ):queueLoading?(
                  <div style={{textAlign:'center',padding:'2rem'}}><i className="fa-solid fa-spinner fa-spin" style={{color:'var(--red)',fontSize:'1.5rem'}} /></div>
                ):queue.length===0?(
                  <div className="empty-state" style={{padding:'1.5rem 0'}}>
                    <i className="fa-solid fa-hourglass-half" />
                    <p>Nenhuma entrega disponível agora. Aguarde...</p>
                  </div>
                ):queue.map(q=>(
                  <div key={q.id} className="queue-item">
                    <div className="queue-item-info">
                      <div style={{fontWeight:600,fontSize:'.92rem'}}>{q.order_number}</div>
                      <div style={{fontSize:'.82rem',color:'var(--gray-400)'}}><i className="fa-solid fa-store" /> {q.store?.name||'—'} → <i className="fa-solid fa-location-dot" /> {q.address?.city||'—'}</div>
                      <div style={{fontSize:'.82rem',color:'var(--gray-400)'}}>{q.items?.map(i=>`${i.product_name} x${i.quantity}`).join(', ')}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontFamily:'var(--font-head)',fontWeight:900,color:'var(--green)',fontSize:'1.1rem'}}>{fmt((q.freight||8.90)*.7)}</div>
                      <div style={{fontSize:'.75rem',color:'var(--gray-400)',marginBottom:'.4rem'}}>~{q.freight||8.9} km</div>
                      <button className="btn btn-primary btn-sm" onClick={()=>{setAcceptModal(q);startTimer();}}>Aceitar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ DELIVERIES ══════════════════════════════════ */}
          {page==='deliveries'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
                <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900}}>Minhas Entregas</h2>
                <button className="btn btn-outline btn-sm" onClick={loadMyDeliveries}><i className="fa-solid fa-rotate" /> Atualizar</button>
              </div>
              {myLoading?(
                <div style={{textAlign:'center',padding:'3rem'}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--red)'}} /></div>
              ):myDeliveries.length===0?(
                <div className="empty-state"><i className="fa-solid fa-route" /><p>Nenhuma entrega ainda.</p></div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {myDeliveries.map(d=>(
                    <div key={d.id} className="dash-card" style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.4rem'}}>
                          <strong>{d.order_number}</strong>
                          <span className={`status-badge status-${d.status}`}>{sl(d.status)}</span>
                        </div>
                        <div style={{fontSize:'.83rem',color:'var(--gray-400)'}}>
                          <i className="fa-solid fa-store" /> {d.store?.name||'—'} · <i className="fa-solid fa-user" /> {d.client?.name||'—'}
                        </div>
                        <div style={{fontSize:'.83rem',color:'var(--gray-400)',marginTop:'.2rem'}}>
                          {d.items?.map(i=>`${i.product_name} x${i.quantity}`).join(', ')}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontFamily:'var(--font-head)',fontWeight:900,color:'var(--green)'}}>{fmt((d.freight||8.90)*.7)}</div>
                        <div style={{fontSize:'.75rem',color:'var(--gray-400)'}}>{new Date(d.created_at).toLocaleDateString('pt-BR')}</div>
                        <button className="btn btn-outline btn-sm" style={{marginTop:'.4rem'}} onClick={()=>setDetailModal(d)}>Detalhes</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ HISTORY ═════════════════════════════════════ */}
          {page==='history'&&(
            <div>
              <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Histórico</h2>
              <div className="dash-card" style={{marginBottom:'1rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',textAlign:'center'}}>
                  {[
                    ['Hoje', todayDeliveries.length],
                    ['Este mês', myDeliveries.filter(d=>d.status==='delivered').length],
                    ['Total', driverData?.total_deliveries||0],
                  ].map(([label,val])=>(
                    <div key={label}>
                      <div style={{fontFamily:'var(--font-head)',fontSize:'2rem',fontWeight:900,color:'var(--red)'}}>{val}</div>
                      <div style={{fontSize:'.83rem',color:'var(--gray-400)'}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dash-card" style={{marginBottom:'1rem'}}>
                <h3 style={{fontFamily:'var(--font-head)',fontWeight:700,marginBottom:'1rem'}}>Entregas concluídas</h3>
                <Bar
                  data={{ labels:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], datasets:[{ data:[3,5,4,7,6,8,todayDeliveries.length||4], backgroundColor:'rgba(225,26,44,.8)', borderRadius:6 }] }}
                  options={{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{ticks:{stepSize:1}}, x:{grid:{display:false}} } }}
                />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'.7rem'}}>
                {myDeliveries.filter(d=>d.status==='delivered').map(d=>(
                  <div key={d.id} style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:'1rem',border:'1px solid var(--gray-200)',display:'flex',alignItems:'center',gap:'1rem'}}>
                    <div style={{width:40,height:40,background:'rgba(34,197,94,.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--green)',flexShrink:0}}>
                      <i className="fa-solid fa-check" />
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:'.9rem'}}>{d.order_number}</div>
                      <div style={{fontSize:'.8rem',color:'var(--gray-400)'}}>{d.store?.name} · {d.address?.city}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'var(--font-head)',fontWeight:700,color:'var(--green)'}}>{fmt((d.freight||8.90)*.7)}</div>
                      <div style={{fontSize:'.75rem',color:'var(--gray-400)'}}>{d.delivered_at?new Date(d.delivered_at).toLocaleDateString('pt-BR'):'—'}</div>
                    </div>
                  </div>
                ))}
                {myDeliveries.filter(d=>d.status==='delivered').length===0&&(
                  <div className="empty-state"><i className="fa-solid fa-clock-rotate-left" /><p>Nenhuma entrega concluída ainda.</p></div>
                )}
              </div>
            </div>
          )}

          {/* ══ EARNINGS ════════════════════════════════════ */}
          {page==='earnings'&&(
            <div>
              <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Ganhos</h2>
              <div className="driver-balance-card">
                <div><p style={{color:'rgba(255,255,255,.6)',fontSize:'.9rem'}}>Saldo disponível</p><h2 style={{fontFamily:'var(--font-head)',fontSize:'2.8rem',fontWeight:900}}>{fmt(driverData?.balance||0)}</h2></div>
                <button className="btn" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'2px solid rgba(255,255,255,.3)'}} onClick={()=>setWithdrawModal(true)}>
                  <i className="fa-solid fa-money-bill-transfer" /> Sacar
                </button>
              </div>
              <div className="kpi-grid" style={{marginBottom:'1rem'}}>
                {[
                  { icon:'fa-wallet',    val:fmt(totalEarned),                           lbl:'Total acumulado' },
                  { icon:'fa-truck',     val:myDeliveries.filter(d=>d.status==='delivered').length, lbl:'Entregas pagas' },
                  { icon:'fa-star',      val:(driverData?.rating||5.0).toFixed(1)+' ★', lbl:'Avaliação'       },
                ].map(k=>(
                  <div key={k.lbl} className="kpi-card">
                    <div className="kpi-icon red"><i className={`fa-solid ${k.icon}`} /></div>
                    <div className="kpi-info"><span className="kpi-value" style={{fontSize:'1.2rem'}}>{k.val}</span><span className="kpi-label">{k.lbl}</span></div>
                  </div>
                ))}
              </div>
              <div className="dash-card">
                <h3 style={{fontFamily:'var(--font-head)',fontWeight:700,marginBottom:'1rem'}}>Extrato</h3>
                {myDeliveries.filter(d=>d.status==='delivered').length===0?(
                  <div className="empty-state" style={{padding:'1rem 0'}}><i className="fa-solid fa-receipt" /><p>Nenhum lançamento ainda.</p></div>
                ):myDeliveries.filter(d=>d.status==='delivered').map(d=>(
                  <div key={d.id} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'.7rem 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(34,197,94,.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--green)',flexShrink:0}}>
                      <i className="fa-solid fa-arrow-down" style={{fontSize:'.75rem'}} />
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'.88rem',fontWeight:600}}>Entrega {d.order_number}</div>
                      <div style={{fontSize:'.78rem',color:'var(--gray-400)'}}>{d.delivered_at?new Date(d.delivered_at).toLocaleDateString('pt-BR'):'—'}</div>
                    </div>
                    <div style={{fontFamily:'var(--font-head)',fontWeight:700,color:'var(--green)'}}>+{fmt((d.freight||8.90)*.7)}</div>
                  </div>
                ))}
              </div>
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
                <div className="dash-card">
                  <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>Estatísticas</h3>
                  {[
                    ['Total de entregas',  driverData?.total_deliveries||0],
                    ['Avaliação média',    (driverData?.rating||5.0).toFixed(1)+' ⭐'],
                    ['Saldo disponível',   fmt(driverData?.balance||0)],
                    ['Total acumulado',    fmt(totalEarned)],
                    ['Status',            driverData?.is_online?'🟢 Online':'🔴 Offline'],
                  ].map(([label,val])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'.6rem 0',borderBottom:'1px solid var(--gray-100)',fontSize:'.9rem'}}>
                      <span style={{color:'var(--gray-500)'}}>{label}</span>
                      <strong>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ACCEPT MODAL */}
      {acceptModal&&(
        <Modal open title="Nova Entrega!" onClose={()=>{setAcceptModal(null);clearInterval(timerRef.current);}}>
          <div style={{marginBottom:'1rem'}}>
            <div className="timer-bar"><div className="timer-fill" style={{width:timerPct+'%'}} /></div>
            <p style={{fontSize:'.78rem',color:'var(--gray-400)',textAlign:'center',marginTop:'.3rem'}}>Aceite antes do tempo acabar</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'.7rem',marginBottom:'1.2rem'}}>
            {[
              ['Loja',    acceptModal.store?.name||'—'],
              ['Entrega', `${acceptModal.address?.street||'—'}, ${acceptModal.address?.city||'—'}`],
              ['Cliente', acceptModal.client?.name||'—'],
              ['Ganho',   fmt((acceptModal.freight||8.90)*.7)],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'.5rem 0',borderBottom:'1px solid var(--gray-100)',fontSize:'.9rem'}}>
                <span style={{color:'var(--gray-500)'}}>{k}</span>
                <strong style={{color:k==='Ganho'?'var(--green)':'inherit'}}>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'.7rem'}}>
            <button className="btn btn-primary btn-full" onClick={()=>acceptDelivery(acceptModal)} disabled={accepting}>
              {accepting?<><i className="fa-solid fa-spinner fa-spin" /> Aceitando…</>:<><i className="fa-solid fa-check" /> Aceitar entrega</>}
            </button>
            <button className="btn btn-ghost" onClick={()=>{setAcceptModal(null);clearInterval(timerRef.current);}}>Recusar</button>
          </div>
        </Modal>
      )}

      {/* DETAIL MODAL */}
      {detailModal&&(
        <Modal open title={`Detalhes — ${detailModal.order_number}`} onClose={()=>setDetailModal(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
            {[
              ['Status',  sl(detailModal.status)],
              ['Loja',    detailModal.store?.name||'—'],
              ['Endereço',`${detailModal.address?.street||'—'}${detailModal.address?.number?', '+detailModal.address.number:''} — ${detailModal.address?.city||'—'}`],
              ['Cliente', detailModal.client?.name||'—'],
              ['Telefone',detailModal.client?.phone||'—'],
              ['Total pedido', fmt(detailModal.total)],
              ['Seu ganho',    fmt((detailModal.freight||8.90)*.7)],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'.5rem 0',borderBottom:'1px solid var(--gray-100)',fontSize:'.9rem'}}>
                <span style={{color:'var(--gray-500)'}}>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
            <div style={{marginTop:'.5rem'}}>
              <strong style={{fontSize:'.9rem'}}>Itens:</strong>
              {detailModal.items?.map((it,i)=><div key={i} style={{fontSize:'.85rem',color:'var(--gray-600)',marginTop:'.3rem'}}>• {it.product_name} x{it.quantity}</div>)}
            </div>
          </div>
        </Modal>
      )}

      {/* WITHDRAW MODAL */}
      {withdrawModal&&(
        <Modal open title="Solicitar Saque" onClose={()=>setWithdrawModal(false)}>
          <p style={{color:'var(--gray-500)',marginBottom:'1rem',fontSize:'.9rem'}}>Saldo disponível: <strong style={{color:'var(--green)'}}>{fmt(driverData?.balance||0)}</strong></p>
          <div className="form-group"><label>Valor a sacar</label><input type="number" step="0.01" defaultValue={(driverData?.balance||0).toFixed(2)} /></div>
          <div className="form-group"><label>Chave Pix</label><input placeholder="CPF, e-mail ou telefone" /></div>
          <button className="btn btn-primary btn-full" onClick={async()=>{
            try {
              await supabase.from('drivers').update({ balance: 0 }).eq('id', user.id);
              setDriverData(prev=>({...prev,balance:0}));
              setWithdrawModal(false);
              showToast('Saque solicitado! Chegará em até 2 dias úteis.','success');
            } catch(err){ showToast('Erro: '+err.message,'error'); }
          }}>
            <i className="fa-solid fa-money-bill-transfer" /> Confirmar saque
          </button>
        </Modal>
      )}
    </div>
  );
}