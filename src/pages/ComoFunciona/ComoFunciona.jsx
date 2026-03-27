import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import './ComoFunciona.css';

const STEPS_CLIENT = [
  { num: '01', icon: 'fa-magnifying-glass', title: 'Busque a peça',   color: '#E11A2C', desc: 'Pesquise pelo nome da peça, código do fabricante ou modelo do seu veículo. Nossa busca inteligente encontra o que você precisa em segundos.' },
  { num: '02', icon: 'fa-store',            title: 'Escolha a loja',  color: '#3B82F6', desc: 'Compare preços, avaliações e distância das lojas parceiras. Veja os horários de funcionamento e escolha a que mais te convém.' },
  { num: '03', icon: 'fa-cart-shopping',    title: 'Faça o pedido',   color: '#22C55E', desc: 'Adicione ao carrinho, escolha a forma de entrega e pague com segurança. Pix, cartão de crédito ou boleto — você decide.' },
  { num: '04', icon: 'fa-truck-fast',       title: 'Receba em casa',  color: '#F59E0B', desc: 'Entrega expressa em até 45 minutos, entrega padrão ou retire na loja. Acompanhe seu pedido em tempo real pelo app.' },
];

const STEPS_MERCHANT = [
  { num: '01', icon: 'fa-id-card',         title: 'Cadastre sua loja',   color: '#E11A2C', desc: 'Crie sua conta de comerciante gratuitamente. Envie os documentos e seja verificado em até 24h.' },
  { num: '02', icon: 'fa-tags',            title: 'Cadastre seus produtos', color: '#8B5CF6', desc: 'Adicione seu catálogo com fotos, preços e compatibilidade. Nossa plataforma é simples e intuitiva.' },
  { num: '03', icon: 'fa-bell',            title: 'Receba pedidos',      color: '#3B82F6', desc: 'Clientes encontram sua loja e fazem pedidos. Você recebe notificação em tempo real e prepara o envio.' },
  { num: '04', icon: 'fa-dollar-sign',     title: 'Receba o pagamento',  color: '#22C55E', desc: 'O pagamento é processado com segurança e repassado para você. Sem mensalidade, apenas comissão por venda.' },
];

const STEPS_DRIVER = [
  { num: '01', icon: 'fa-motorcycle',      title: 'Cadastre-se',         color: '#E11A2C', desc: 'Crie seu perfil de entregador, envie seus documentos e aguarde a validação em até 2h.' },
  { num: '02', icon: 'fa-toggle-on',       title: 'Fique online',        color: '#22C55E', desc: 'Abra o app e ligue para receber pedidos na sua região. Você controla sua disponibilidade.' },
  { num: '03', icon: 'fa-route',           title: 'Aceite e entregue',   color: '#3B82F6', desc: 'Receba pedidos, colete na loja e entregue ao cliente. O app guia você em cada etapa.' },
  { num: '04', icon: 'fa-wallet',          title: 'Receba seus ganhos',  color: '#F59E0B', desc: 'Seus ganhos ficam disponíveis no app e você saca quando quiser, sem burocracia.' },
];

const FAQS = [
  { q: 'Como funciona a entrega expressa?',             a: 'Após confirmar o pedido, a loja parceira mais próxima prepara a peça e um entregador parceiro leva até você em até 45 minutos, dependendo da distância.' },
  { q: 'As peças são originais?',                       a: 'Sim! Trabalhamos apenas com lojas parceiras verificadas que garantem peças originais ou remanufaturadas de marcas certificadas.' },
  { q: 'Posso rastrear meu pedido?',                    a: 'Sim. Após confirmar, você recebe atualizações em tempo real sobre o status do seu pedido — da loja até a sua porta.' },
  { q: 'Qual é a área de cobertura?',                   a: 'Atualmente cobrimos as principais capitais e regiões metropolitanas do Brasil. Consulte disponibilidade na sua cidade.' },
  { q: 'Como faço para devolver uma peça errada?',      a: 'Você tem 7 dias para solicitar a troca ou devolução pelo app. O processo é simples e sem custo para o comprador.' },
  { q: 'Posso retirar a peça na loja?',                 a: 'Sim! Na hora de fechar o pedido escolha "Retirar na loja" e a peça ficará pronta em até 30 minutos.' },
];

function StepsSection({ title, subtitle, steps, color }) {
  return (
    <div className="steps-section">
      <div className="steps-section-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="cf-steps">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="cf-step">
              <div className="cf-step-num" style={{ color: s.color }}>{s.num}</div>
              <div className="cf-step-icon" style={{ background: s.color + '18', color: s.color }}>
                <i className={`fa-solid ${s.icon}`} />
              </div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="cf-step-connector">
                <i className="fa-solid fa-arrow-right" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function ComoFunciona() {
  const navigate  = useNavigate();
  const [openFaq, setOpenFaq] = React.useState(null);

  return (
    <PageLayout
      hero={
        <div className="page-hero-inner container">
          <div className="page-hero-eyebrow"><i className="fa-solid fa-circle-question" /> Como Funciona</div>
          <h1 className="page-hero-title">Simples,<br /><span>Rápido e Seguro</span></h1>
          <p className="page-hero-sub">Entenda como a PeçaRápida funciona para clientes, lojistas e entregadores.</p>
          <div className="page-hero-glyph"><i className="fa-solid fa-bolt" /></div>
        </div>
      }
    >
      {/* Tabs selector */}
      <section className="section cf-section">
        <div className="container">

          {/* Numbers bar */}
          <div className="cf-numbers-bar">
            {[
              { val: '+12.000', lbl: 'Peças disponíveis',  icon: 'fa-tags'      },
              { val: '+340',    lbl: 'Lojas parceiras',     icon: 'fa-store'     },
              { val: '45 min',  lbl: 'Entrega expressa',    icon: 'fa-truck-fast'},
              { val: '4.8★',    lbl: 'Avaliação média',     icon: 'fa-star'      },
            ].map(n => (
              <div key={n.lbl} className="cf-number-card">
                <i className={`fa-solid ${n.icon}`} />
                <span className="cf-number-val">{n.val}</span>
                <span className="cf-number-lbl">{n.lbl}</span>
              </div>
            ))}
          </div>

          {/* Client steps */}
          <StepsSection
            title="Para Clientes"
            subtitle="Compre peças originais em minutos."
            steps={STEPS_CLIENT}
          />

          {/* Merchant steps */}
          <StepsSection
            title="Para Comerciantes"
            subtitle="Venda para milhares de clientes na sua região."
            steps={STEPS_MERCHANT}
          />

          {/* Driver steps */}
          <StepsSection
            title="Para Entregadores"
            subtitle="Ganhe dinheiro no seu horário."
            steps={STEPS_DRIVER}
          />

          {/* FAQ */}
          <div className="cf-faq">
            <h2>Dúvidas frequentes</h2>
            <div className="faq-list">
              {FAQS.map((f, i) => (
                <div
                  key={i}
                  className={`faq-item${openFaq === i ? ' open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="faq-question">
                    <span>{f.q}</span>
                    <i className={`fa-solid fa-chevron-${openFaq === i ? 'up' : 'down'}`} />
                  </div>
                  {openFaq === i && <div className="faq-answer">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div className="cf-cta-row">
            <div className="cf-cta-card client">
              <i className="fa-solid fa-user" />
              <h3>Sou cliente</h3>
              <p>Encontre a peça certa no menor tempo.</p>
              <button className="btn btn-primary" onClick={() => navigate('/client')}>Comprar agora</button>
            </div>
            <div className="cf-cta-card merchant">
              <i className="fa-solid fa-store" />
              <h3>Tenho uma loja</h3>
              <p>Venda mais, alcance mais clientes.</p>
              <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register&type=merchant')}>Ser parceiro</button>
            </div>
            <div className="cf-cta-card driver">
              <i className="fa-solid fa-motorcycle" />
              <h3>Quero entregar</h3>
              <p>Ganhe no seu ritmo, sem horário fixo.</p>
              <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register&type=driver')}>Cadastrar agora</button>
            </div>
          </div>

        </div>
      </section>
    </PageLayout>
  );
}