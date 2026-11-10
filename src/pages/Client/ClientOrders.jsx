import React, { useState } from 'react';
import { fmt, statusLabel } from '../../data';

export default function ClientOrders({
  orders, ordLoading, loadOrders, setPage,
  setReviewModal, setReviewForm,
}) {
  const [search, setSearch] = useState('');

  const filtered = (orders || []).filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (o.order_number || o.id || '').toLowerCase().includes(q) ||
      (o.store?.name || '').toLowerCase().includes(q) ||
      (o.items || []).some(it => (it.product_name || '').toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.2rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900}}>Meus Pedidos</h2>
        <div style={{display:'flex',alignItems:'center',gap:'.7rem',flexWrap:'wrap'}}>
          <div className="search-bar-std" style={{maxWidth:300}}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Buscar pedido, loja ou item…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadOrders}><i className="fa-solid fa-rotate" /> Atualizar</button>
        </div>
      </div>
      {ordLoading?(
        <div style={{textAlign:'center',padding:'3rem'}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--red)'}} /></div>
      ):filtered.length===0?(
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <p>{search ? `Nenhum pedido encontrado para "${search}".` : 'Nenhum pedido ainda.'}</p>
          {search ? (
            <button className="btn btn-outline" onClick={() => setSearch('')} style={{marginTop:'.5rem'}}>Limpar busca</button>
          ) : (
            <button className="btn btn-primary" onClick={()=>setPage('shop')} style={{marginTop:'.5rem'}}>Fazer primeiro pedido</button>
          )}
        </div>
      ):filtered.map(o=>{
        const steps=['Confirmado','Em preparo','Enviado','Entregue'];
        const stepIdx=o.status==='pending'?0:o.status==='preparing'?1:o.status==='shipped'?2:o.status==='delivered'?4:0;
        return(
          <div key={o.id} className="client-order-card dash-card" style={{marginBottom:'1rem'}}>
            <div className="client-order-header">
              <div>
                <strong className="order-id">{o.order_number || o.id}</strong>
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
            {o.status === 'cancelled' ? (
              <div style={{color:'var(--red)',fontSize:'.85rem',fontWeight:600}}><i className="fa-solid fa-circle-xmark" /> Pedido cancelado</div>
            ) : (
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
            )}
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
  );
}