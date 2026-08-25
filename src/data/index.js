// ─── DADOS COMPARTILHADOS ──────────────────────────────────────────────────
// Formatação de moeda e rótulos de status (o restante dos dados vem do Supabase)

export const fmt = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'R$ 0,00';
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
};
export const statusLabel = (s) => ({ pending:'Aguardando', preparing:'Em preparo', shipped:'Enviado', delivered:'Entregue', cancelled:'Cancelado', available:'Disponível', collecting:'Coletando', delivering:'Em rota' }[s] || s);

export const CATEGORIES = [
  { label: 'Motor',        icon: 'fa-solid fa-engine'           },
  { label: 'Freios',       icon: 'fa-solid fa-circle-stop'      },
  { label: 'Suspensão',    icon: 'fa-solid fa-car-burst'        },
  { label: 'Elétrica',     icon: 'fa-solid fa-bolt'             },
  { label: 'Filtros',      icon: 'fa-solid fa-filter'           },
  { label: 'Transmissão',  icon: 'fa-solid fa-gears'            },
  { label: 'Arrefecimento',icon: 'fa-solid fa-temperature-half' },
  { label: 'Acessórios',   icon: 'fa-solid fa-wrench'           },
];
