import ProductCard from '../../components/ProductCard';

export default function ClientFavorites({
  favorites, products, setPage, setProductModal,
}) {
  return (
    <div>
      <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Favoritos</h2>
      {favorites.length>0
        ?<div className="products-grid">{products.filter(p=>favorites.includes(p.id)).map(p=><ProductCard key={p.id} product={p} theme="light" onOpen={setProductModal} />)}</div>
        :<div className="empty-state"><i className="fa-solid fa-heart" /><p>Nenhum produto favoritado.</p><button className="btn btn-outline" onClick={()=>setPage('shop')} style={{marginTop:'.5rem'}}>Explorar produtos</button></div>}
    </div>
  );
}