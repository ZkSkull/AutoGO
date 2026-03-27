// ─── PRODUCTS ───────────────────────────────────────────────────────────────
export const PRODUCTS = [
  { id: 1,  name: 'Filtro de Óleo Bosch',       brand: 'Bosch',   category: 'Filtros',      price: 34.90,  stock: 45, rating: 4.9, code: 'F026407006', condition: 'new',  icon: '🔩', compat: 'Gol G5, Polo, Fox 2004-2016',    storeId: 1, badge: 'Top'   },
  { id: 2,  name: 'Pastilha de Freio Dianteira', brand: 'TRW',     category: 'Freios',       price: 89.90,  stock: 30, rating: 4.8, code: 'GDB3256',    condition: 'new',  icon: '⚙️', compat: 'Honda Civic, City 2014-2022',     storeId: 1, badge: ''      },
  { id: 3,  name: 'Amortecedor Dianteiro',       brand: 'Monroe',  category: 'Suspensão',    price: 189.00, stock: 18, rating: 4.7, code: 'MR63524',    condition: 'new',  icon: '🔧', compat: 'Corolla 2008-2019',               storeId: 2, badge: 'Oferta'},
  { id: 4,  name: 'Bateria 60Ah Heliar',         brand: 'Heliar',  category: 'Elétrica',     price: 379.00, stock: 10, rating: 4.9, code: 'HTF60LD',    condition: 'new',  icon: '🔋', compat: 'Universal',                       storeId: 2, badge: ''      },
  { id: 5,  name: 'Correia Dentada Kit',         brand: 'Gates',   category: 'Motor',        price: 149.00, stock: 25, rating: 4.6, code: 'K015573XS',  condition: 'new',  icon: '🔩', compat: 'Palio, Siena, Idea 1.6',          storeId: 1, badge: ''      },
  { id: 6,  name: 'Vela de Ignição NGK',         brand: 'NGK',     category: 'Motor',        price: 28.90,  stock: 60, rating: 4.8, code: 'BKR5E-11',   condition: 'new',  icon: '⚡', compat: 'Multiuso — verificar código',     storeId: 3, badge: ''      },
  { id: 7,  name: 'Filtro de Ar Mahle',          brand: 'Mahle',   category: 'Filtros',      price: 45.00,  stock: 40, rating: 4.7, code: 'LX2921',     condition: 'new',  icon: '🌀', compat: 'Onix, Cobalt, Prisma 2012+',      storeId: 3, badge: ''      },
  { id: 8,  name: 'Disco de Freio Dianteiro',    brand: 'Brembo',  category: 'Freios',       price: 219.00, stock: 12, rating: 4.9, code: '09.8918.11', condition: 'new',  icon: '⭕', compat: 'Fiat Toro, Jeep Renegade',        storeId: 2, badge: 'Novo'  },
  { id: 9,  name: 'Coxim Amortecedor',           brand: 'Cofap',   category: 'Suspensão',    price: 62.00,  stock: 20, rating: 4.5, code: 'CX0293',     condition: 'new',  icon: '🛞', compat: 'Strada 2004-2012, Doblò',         storeId: 1, badge: ''      },
  { id: 10, name: 'Radiador Completo',            brand: 'Modine',  category: 'Arrefecimento',price: 420.00, stock: 7,  rating: 4.6, code: 'R8480',      condition: 'new',  icon: '❄️', compat: 'HB20 2012-2020',                  storeId: 3, badge: ''      },
  { id: 11, name: 'Cabos de Vela Premium',        brand: 'Magneti', category: 'Motor',        price: 98.00,  stock: 22, rating: 4.7, code: 'MSK342A',    condition: 'new',  icon: '🔌', compat: 'Uno, Palio, Siena Fire',          storeId: 2, badge: ''      },
  { id: 12, name: 'Sensor de Temperatura',        brand: 'Bosch',   category: 'Elétrica',     price: 55.00,  stock: 15, rating: 4.5, code: '0280130039', condition: 'new',  icon: '🌡️', compat: 'VW em geral 2000-2015',           storeId: 3, badge: ''      },
];

// ─── STORES ─────────────────────────────────────────────────────────────────
export const STORES = [
  { id: 1, name: 'Auto Peças Silva',     rating: 4.8, reviews: 127, distance: '2.3 km', open: true,  category: 'Geral',              products: 240 },
  { id: 2, name: 'Peças & Cia',          rating: 4.7, reviews: 89,  distance: '3.8 km', open: true,  category: 'Elétrica & Motor',   products: 180 },
  { id: 3, name: 'MegaAuto Peças',       rating: 4.9, reviews: 203, distance: '1.1 km', open: false, category: 'Importados',         products: 320 },
  { id: 4, name: 'Distribuidora Freios', rating: 4.6, reviews: 61,  distance: '5.2 km', open: true,  category: 'Freios & Suspensão', products: 110 },
];

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export const ORDERS_DATA = [
  { id: '#20451', client: 'Carlos Mendes',   products: ['Filtro de Óleo Bosch', 'Vela NGK x4'],       total: 150.50, status: 'pending',   date: '20/03/2025 09:12', phone: '(11) 98765-1234', address: 'Rua das Flores, 123 — SP' },
  { id: '#20450', client: 'Ana Paula Lima',  products: ['Pastilha Freio TRW'],                         total: 89.90,  status: 'preparing', date: '20/03/2025 08:44', phone: '(11) 91234-5678', address: 'Av. Paulista, 456 — SP'   },
  { id: '#20449', client: 'Roberto Costa',   products: ['Correia Dentada Gates'],                       total: 149.00, status: 'shipped',   date: '20/03/2025 08:01', phone: '(11) 99876-5432', address: 'Rua Nova, 789 — SP'        },
  { id: '#20448', client: 'Fernanda Souza',  products: ['Bateria Heliar 60Ah'],                         total: 379.00, status: 'delivered', date: '19/03/2025 17:30', phone: '(11) 97654-3210', address: 'Rua das Acácias, 55 — SP'  },
  { id: '#20447', client: 'Marcos Alves',    products: ['Amortecedor Monroe', 'Coxim Cofap'],           total: 251.00, status: 'delivered', date: '19/03/2025 14:20', phone: '(11) 96543-2109', address: 'Av. Brasil, 1000 — SP'     },
  { id: '#20446', client: 'Juliana Torres',  products: ['Disco de Freio Brembo x2'],                    total: 438.00, status: 'cancelled', date: '19/03/2025 11:00', phone: '(11) 95432-1098', address: 'Rua A, 22 — SP'            },
  { id: '#20445', client: 'Pedro Rodrigues', products: ['Filtro de Ar Mahle', 'Sensor Bosch'],          total: 100.00, status: 'delivered', date: '18/03/2025 16:55', phone: '(11) 94321-0987', address: 'Rua B, 33 — SP'            },
];

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export const REVIEWS_DATA = [
  { user: 'Carlos M.',  initials: 'CM', stars: 5, date: '18/03/2025', text: 'Excelente atendimento! Peça chegou no prazo, embalagem perfeita e original. Recomendo muito!' },
  { user: 'Ana Paula',  initials: 'AP', stars: 5, date: '15/03/2025', text: 'Pastilhas de freio de ótima qualidade. Entrega expressa em menos de 1 hora. Surpreendente!'  },
  { user: 'Roberto C.', initials: 'RC', stars: 4, date: '12/03/2025', text: 'Boa loja, peça correta e bem embalada. Só demorou um pouco mais que o previsto.'              },
  { user: 'Fernanda S.',initials: 'FS', stars: 5, date: '10/03/2025', text: 'Bateria original Heliar. Instalei e funcionou perfeitamente. Voltarei a comprar!'              },
];

// ─── CLIENT ORDERS ───────────────────────────────────────────────────────────
export const CLIENT_ORDERS = [
  { id: '#10234', store: 'Auto Peças Silva', products: ['Filtro de Óleo Bosch', 'Vela NGK x4'], total: 150.50, status: 'delivered', date: '18/03/2025', steps: 4 },
  { id: '#10233', store: 'Peças & Cia',      products: ['Bateria Heliar 60Ah'],                  total: 379.00, status: 'shipped',   date: '20/03/2025', steps: 3 },
  { id: '#10232', store: 'MegaAuto Peças',   products: ['Amortecedor Monroe'],                   total: 189.00, status: 'preparing', date: '20/03/2025', steps: 2 },
];

// ─── DELIVERY QUEUE ──────────────────────────────────────────────────────────
export const DELIVERY_QUEUE_INITIAL = [
  {
    id: '#20452', store: 'Auto Peças Silva',   storeAddr: 'Rua das Peças, 100 — Centro',
    clientName: 'Carlos Mendes', clientAddr: 'Rua das Flores, 123 — Moema',
    clientPhone: '(11) 98765-1234', products: ['Filtro de Óleo Bosch', 'Vela NGK x4'],
    total: 150.50, earn: 12.80, pickupDist: '1,2 km', deliveryDist: '2,8 km',
    totalDist: '4,0 km', eta: '~22 min', storeRating: 4.8, weight: '0,8 kg', status: 'available', time: '09:12',
  },
  {
    id: '#20453', store: 'Peças & Cia', storeAddr: 'Av. das Indústrias, 450 — Lapa',
    clientName: 'Ana Paula Lima', clientAddr: 'Av. Paulista, 1000 — Bela Vista',
    clientPhone: '(11) 91234-5678', products: ['Pastilha de Freio TRW'],
    total: 89.90, earn: 9.50, pickupDist: '2,1 km', deliveryDist: '3,5 km',
    totalDist: '5,6 km', eta: '~30 min', storeRating: 4.7, weight: '1,2 kg', status: 'available', time: '09:25',
  },
];

export const ALL_DELIVERIES_INITIAL = [
  {
    id: '#20449', store: 'Auto Peças Silva', storeAddr: 'Rua das Peças, 100',
    clientName: 'Roberto Costa', clientAddr: 'Rua Nova, 789 — SP', clientPhone: '(11) 99876-5432',
    products: ['Correia Dentada Gates'], earn: 11.20, totalDist: '3,8 km', eta: '~20 min',
    status: 'delivering', time: '08:01', total: 149.00, pickupDist: '1,5 km', deliveryDist: '2,3 km',
    weight: '0,6 kg', storeRating: 4.8,
  },
  {
    id: '#20448', store: 'MegaAuto Peças', storeAddr: 'Av. Industrial, 200',
    clientName: 'Fernanda Souza', clientAddr: 'Rua das Acácias, 55 — SP', clientPhone: '(11) 97654-3210',
    products: ['Bateria Heliar 60Ah'], earn: 15.00, totalDist: '5,2 km', status: 'delivered',
    time: '07:30', total: 379.00, pickupDist: '2,0 km', deliveryDist: '3,2 km', weight: '14 kg', storeRating: 4.9,
  },
];

export const HISTORY_TODAY = [
  { id: '#20449', addr: 'Rua Nova, 789',       earn: 11.20, time: '08:01', ok: true  },
  { id: '#20448', addr: 'Rua das Acácias, 55', earn: 15.00, time: '07:30', ok: true  },
  { id: '#20447', addr: 'Av. Brasil, 1000',     earn: 13.40, time: '07:05', ok: true  },
  { id: '#20446', addr: 'Rua A, 22',            earn: 8.90,  time: '06:40', ok: true  },
  { id: '#20445', addr: 'Rua B, 33',            earn: 10.50, time: '06:10', ok: true  },
  { id: '#20444', addr: 'Rua C, 44',            earn: 0,     time: '05:55', ok: false },
  { id: '#20443', addr: 'Rua D, 55',            earn: 12.00, time: '05:30', ok: true  },
];

export const EXTRACT_DATA = [
  { type: 'credit', desc: 'Entrega #20449', val: 11.20, date: 'Hoje 08:01'    },
  { type: 'credit', desc: 'Entrega #20448', val: 15.00, date: 'Hoje 07:30'    },
  { type: 'credit', desc: 'Entrega #20447', val: 13.40, date: 'Hoje 07:05'    },
  { type: 'credit', desc: 'Entrega #20446', val: 8.90,  date: 'Ontem 17:55'   },
  { type: 'debit',  desc: 'Taxa plataforma', val: 2.80,  date: 'Ontem 17:55'   },
  { type: 'credit', desc: 'Entrega #20440', val: 12.00, date: 'Ontem 16:20'   },
  { type: 'credit', desc: 'Entrega #20435', val: 9.60,  date: '19/03 14:00'   },
];

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

export const fmt = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;
export const statusLabel = (s) => ({ pending:'Aguardando', preparing:'Em preparo', shipped:'Enviado', delivered:'Entregue', cancelled:'Cancelado', available:'Disponível', collecting:'Coletando', delivering:'Em rota' }[s] || s);

// ─── PRICES PER STORE (mesmo produto, lojas diferentes) ──────────────────────
// Estrutura: { productCode: [{ storeId, price, stock, rating, deliveryTime }] }
export const STORE_PRICES = {
  'F026407006': [ // Filtro de Óleo Bosch
    { storeId: 1, price: 34.90, stock: 45, rating: 4.9, deliveryTime: '35 min', highlight: 'menor-preco' },
    { storeId: 2, price: 38.50, stock: 12, rating: 4.7, deliveryTime: '50 min', highlight: '' },
    { storeId: 3, price: 36.00, stock: 30, rating: 4.9, deliveryTime: '20 min', highlight: 'mais-rapido' },
    { storeId: 4, price: 41.90, stock: 8,  rating: 4.6, deliveryTime: '60 min', highlight: '' },
  ],
  'GDB3256': [ // Pastilha de Freio TRW
    { storeId: 1, price: 89.90, stock: 30, rating: 4.8, deliveryTime: '35 min', highlight: 'menor-preco' },
    { storeId: 2, price: 95.00, stock: 5,  rating: 4.7, deliveryTime: '50 min', highlight: '' },
    { storeId: 4, price: 88.00, stock: 20, rating: 4.9, deliveryTime: '55 min', highlight: 'melhor-avaliado' },
  ],
  'MR63524': [ // Amortecedor Monroe
    { storeId: 2, price: 189.00, stock: 18, rating: 4.7, deliveryTime: '50 min', highlight: '' },
    { storeId: 3, price: 175.00, stock: 7,  rating: 4.9, deliveryTime: '20 min', highlight: 'menor-preco' },
    { storeId: 1, price: 195.00, stock: 10, rating: 4.8, deliveryTime: '35 min', highlight: '' },
  ],
  'HTF60LD': [ // Bateria Heliar
    { storeId: 2, price: 379.00, stock: 10, rating: 4.9, deliveryTime: '50 min', highlight: '' },
    { storeId: 1, price: 359.00, stock: 4,  rating: 4.8, deliveryTime: '35 min', highlight: 'menor-preco' },
    { storeId: 3, price: 369.00, stock: 15, rating: 4.9, deliveryTime: '20 min', highlight: 'mais-rapido' },
  ],
  'K015573XS': [ // Correia Dentada Gates
    { storeId: 1, price: 149.00, stock: 25, rating: 4.6, deliveryTime: '35 min', highlight: '' },
    { storeId: 3, price: 139.00, stock: 9,  rating: 4.9, deliveryTime: '20 min', highlight: 'menor-preco' },
    { storeId: 2, price: 155.00, stock: 6,  rating: 4.7, deliveryTime: '50 min', highlight: '' },
  ],
  'BKR5E-11': [ // Vela NGK
    { storeId: 3, price: 28.90, stock: 60, rating: 4.8, deliveryTime: '20 min', highlight: 'menor-preco' },
    { storeId: 1, price: 31.00, stock: 20, rating: 4.8, deliveryTime: '35 min', highlight: '' },
    { storeId: 2, price: 30.50, stock: 15, rating: 4.7, deliveryTime: '50 min', highlight: '' },
  ],
  'LX2921': [ // Filtro de Ar Mahle
    { storeId: 3, price: 45.00, stock: 40, rating: 4.7, deliveryTime: '20 min', highlight: 'mais-rapido' },
    { storeId: 1, price: 42.00, stock: 18, rating: 4.8, deliveryTime: '35 min', highlight: 'menor-preco' },
    { storeId: 4, price: 48.00, stock: 25, rating: 4.6, deliveryTime: '55 min', highlight: '' },
  ],
  '09.8918.11': [ // Disco de Freio Brembo
    { storeId: 2, price: 219.00, stock: 12, rating: 4.9, deliveryTime: '50 min', highlight: '' },
    { storeId: 4, price: 209.00, stock: 8,  rating: 4.9, deliveryTime: '55 min', highlight: 'menor-preco' },
    { storeId: 1, price: 225.00, stock: 5,  rating: 4.8, deliveryTime: '35 min', highlight: '' },
  ],
  'CX0293': [ // Coxim Cofap
    { storeId: 1, price: 62.00, stock: 20, rating: 4.5, deliveryTime: '35 min', highlight: '' },
    { storeId: 4, price: 58.00, stock: 14, rating: 4.7, deliveryTime: '55 min', highlight: 'menor-preco' },
    { storeId: 2, price: 65.00, stock: 9,  rating: 4.7, deliveryTime: '50 min', highlight: '' },
  ],
  'R8480': [ // Radiador Modine
    { storeId: 3, price: 420.00, stock: 7,  rating: 4.6, deliveryTime: '20 min', highlight: 'mais-rapido' },
    { storeId: 2, price: 399.00, stock: 3,  rating: 4.7, deliveryTime: '50 min', highlight: 'menor-preco' },
  ],
  'MSK342A': [ // Cabos de Vela
    { storeId: 2, price: 98.00,  stock: 22, rating: 4.7, deliveryTime: '50 min', highlight: '' },
    { storeId: 1, price: 92.00,  stock: 8,  rating: 4.8, deliveryTime: '35 min', highlight: 'menor-preco' },
    { storeId: 3, price: 95.00,  stock: 12, rating: 4.9, deliveryTime: '20 min', highlight: 'mais-rapido' },
  ],
  '0280130039': [ // Sensor Temperatura
    { storeId: 3, price: 55.00,  stock: 15, rating: 4.5, deliveryTime: '20 min', highlight: 'mais-rapido' },
    { storeId: 1, price: 51.00,  stock: 6,  rating: 4.8, deliveryTime: '35 min', highlight: 'menor-preco' },
    { storeId: 2, price: 57.00,  stock: 10, rating: 4.7, deliveryTime: '50 min', highlight: '' },
  ],
};