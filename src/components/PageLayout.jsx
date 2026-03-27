import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './PageLayout.css';

export default function PageLayout({ children, hero, transparent = false }) {
  const navigate = useNavigate();
  return (
    <div className="public-layout">
      <Navbar transparent={transparent} />
      {hero && <div className="page-hero">{hero}</div>}
      <main className="public-main">{children}</main>
      <footer className="public-footer">
        <div className="container public-footer-inner">
          <div>
            <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
              <span className="logo-icon"><i className="fa-solid fa-gear" /></span>
              <span>Peça<span className="logo-red">Rápida</span></span>
            </a>
            <p style={{ color: 'rgba(255,255,255,.4)', marginTop: '.8rem', fontSize: '.88rem', maxWidth: 280 }}>
              O marketplace de autopeças mais rápido do Brasil.
            </p>
          </div>
          {[
            { title: 'Páginas', links: [['Início','/'],['Categorias','/categorias'],['Lojas','/lojas'],['Marcas','/marcas'],['Como funciona','/como-funciona']] },
            { title: 'Produto', links: [['Seja parceiro','/auth?mode=register&type=merchant'],['Seja entregador','/auth?mode=register&type=driver'],['Blog','#']] },
            { title: 'Suporte', links: [['Central de ajuda','#'],['Fale conosco','#'],['Termos de uso','#'],['Privacidade','#']] },
          ].map(col => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} onClick={e => { e.preventDefault(); navigate(href); }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">© 2025 PeçaRápida. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}