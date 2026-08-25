import { fmt } from '../../data';

export default function ClientCart({
  cartItems, subtotal, freight, discount, total,
  changeQty, removeFromCart, setPage,
  delivery, setDelivery, coupon, setCoupon, applyCoupon,
  setCheckoutStep, showToast,
}) {
  return (
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
  );
}