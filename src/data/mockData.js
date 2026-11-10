// ─── DADOS MOCKADOS PARA APRESENTAÇÃO E DEMONSTRAÇÃO ──────────────────────────
// Permite apresentar o AutoGO de forma 100% funcional offline ou sem dependência do backend.

const STORAGE_KEY = 'autogo_mock_db_v2';

// ── Usuários Demo ─────────────────────────────────────────────────────────────
export const MOCK_USERS = {
  client: {
    id: 'usr-client-demo',
    email: 'cliente@autogo.com',
    role: 'client',
    profile: {
      id: 'usr-client-demo',
      name: 'João Silva',
      email: 'cliente@autogo.com',
      role: 'client',
      phone: '(11) 98765-4321',
      cpf: '123.456.789-00',
      avatar_url: null,
    },
  },
  merchant: {
    id: 'usr-merchant-demo',
    email: 'loja@autogo.com',
    role: 'merchant',
    profile: {
      id: 'usr-merchant-demo',
      name: 'Auto Peças Bandeirantes',
      email: 'loja@autogo.com',
      role: 'merchant',
      phone: '(11) 3322-4455',
      cnpj: '12.345.678/0001-90',
      avatar_url: null,
    },
  },
  driver: {
    id: 'usr-driver-demo',
    email: 'entregador@autogo.com',
    role: 'driver',
    profile: {
      id: 'usr-driver-demo',
      name: 'Lucas Motta',
      email: 'entregador@autogo.com',
      role: 'driver',
      phone: '(11) 91234-5678',
      cpf: '987.654.321-11',
      avatar_url: null,
    },
  },
};

// ── Lojas Mockadas ────────────────────────────────────────────────────────────
export const INITIAL_STORES = [
  {
    id: 'store-bandeirantes-01',
    owner_id: 'usr-merchant-demo',
    name: 'Auto Peças Bandeirantes',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 3322-4455',
    email: 'loja@autogo.com',
    address: 'Av. dos Bandeirantes, 2400 — São Paulo, SP',
    city: 'São Paulo',
    description: 'Referência em autopeças de reposição original e alta performance para freios, suspensão e motor.',
    rating: 4.9,
    review_count: 142,
    is_open: true,
    delivery_radius_km: 25,
    lat: -23.6012,
    lng: -46.6782,
    distance: '1.8 km',
  },
  {
    id: 'store-hiper-02',
    owner_id: 'usr-store-02',
    name: 'Hiper Peças Centro',
    cnpj: '23.456.789/0001-01',
    phone: '(11) 3105-8890',
    email: 'contato@hiperpecas.com.br',
    address: 'Rua Barão de Campinas, 320 — Campos Elíseos, São Paulo, SP',
    city: 'São Paulo',
    description: 'Mais de 20 anos de tradição em filtros, óleos automotivos e elétrica pesada.',
    rating: 4.8,
    review_count: 98,
    is_open: true,
    delivery_radius_km: 20,
    lat: -23.5350,
    lng: -46.6462,
    distance: '3.2 km',
  },
  {
    id: 'store-velox-03',
    owner_id: 'usr-store-03',
    name: 'Velox Distribuidora',
    cnpj: '34.567.890/0001-12',
    phone: '(11) 2291-7700',
    email: 'vendas@veloxpecas.com.br',
    address: 'Rua Bresser, 1150 — Mooca, São Paulo, SP',
    city: 'São Paulo',
    description: 'Especialista em componentes de suspensão, amortecedores e embreagens com garantia de fábrica.',
    rating: 4.7,
    review_count: 76,
    is_open: true,
    delivery_radius_km: 30,
    lat: -23.5492,
    lng: -46.6041,
    distance: '4.5 km',
  },
  {
    id: 'store-japao-04',
    owner_id: 'usr-store-04',
    name: 'Japão Motors Peças Originais',
    cnpj: '45.678.901/0001-23',
    phone: '(11) 5084-1234',
    email: 'atendimento@japaomotors.com',
    address: 'Av. Jabaquara, 1850 — Saúde, São Paulo, SP',
    city: 'São Paulo',
    description: 'Especialista em veículos japoneses e importados: Honda, Toyota, Nissan, Hyundai.',
    rating: 5.0,
    review_count: 64,
    is_open: true,
    delivery_radius_km: 20,
    lat: -23.6120,
    lng: -46.6380,
    distance: '5.1 km',
  },
];

// ── Produtos Mockados ─────────────────────────────────────────────────────────
export const INITIAL_PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Pastilha de Freio Dianteira Cerâmica Bosch',
    code: 'BOS-0986',
    brand: 'Bosch',
    price: 189.90,
    stock: 24,
    condition: 'new',
    rating: 4.9,
    reviews_count: 48,
    compatibility: 'Honda Civic 2016-2022, Toyota Corolla 2015-2023, VW Golf TSI',
    description: 'Pastilha cerâmica de alta eficiência, frenagem silenciosa, baixo desprendimento de pó e durabilidade estendida.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Freios',
    icon_emoji: '🛑',
    badge: 'Mais Vendido',
  },
  {
    id: 'prod-02',
    name: 'Disco de Freio Dianteiro Ventilado Fremax',
    code: 'FRX-BD4520',
    brand: 'Fremax',
    price: 245.00,
    stock: 18,
    condition: 'new',
    rating: 4.8,
    reviews_count: 32,
    compatibility: 'VW Golf, Jetta, Passat, Audi A3 1.4/2.0 TSI',
    description: 'Disco com tecnologia Carbon Plus para dissipação térmica ultra-rápida e máxima segurança nas frenagens bruscas.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Freios',
    icon_emoji: '💿',
    badge: 'Original',
  },
  {
    id: 'prod-03',
    name: 'Fluido de Freio DOT 4 Bosch 500ml',
    code: 'BOS-DOT4',
    brand: 'Bosch',
    price: 38.00,
    stock: 50,
    condition: 'new',
    rating: 4.9,
    reviews_count: 61,
    compatibility: 'Universal para todos os sistemas hidráulicos de freio DOT 4',
    description: 'Alto ponto de ebulição úmido e seco, garantindo estabilidade e evitando a perda de pedal sob alta exigência.',
    is_active: true,
    store_id: 'store-hiper-02',
    category: 'Freios',
    icon_emoji: '🧪',
    badge: 'Destaque',
  },
  {
    id: 'prod-04',
    name: 'Óleo Sintético 5W-30 Castrol Magnatec 1L',
    code: 'CAS-5W30',
    brand: 'Castrol',
    price: 48.90,
    stock: 85,
    condition: 'new',
    rating: 5.0,
    reviews_count: 94,
    compatibility: 'Motores flex e gasolina modernos (API SP / ILSAC GF-6)',
    description: 'Moléculas inteligentes que aderem às peças do motor desde o momento da partida, reduzindo o desgaste em até 50%.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Motor',
    icon_emoji: '🛢️',
    badge: 'Top Oferta',
  },
  {
    id: 'prod-05',
    name: 'Kit Correia Dentada + Tensor Gates',
    code: 'GAT-K015575',
    brand: 'Gates',
    price: 178.00,
    stock: 15,
    condition: 'new',
    rating: 4.9,
    reviews_count: 27,
    compatibility: 'Chevrolet Onix, Prisma, Spin 1.0 e 1.4 8V',
    description: 'Kit completo de sincronismo com correia reforçada de alta tração e tensor com rolamento de precisão blindado.',
    is_active: true,
    store_id: 'store-velox-03',
    category: 'Transmissão',
    icon_emoji: '⚙️',
    badge: 'Original',
  },
  {
    id: 'prod-06',
    name: 'Bomba d\'Água Motor Urba',
    code: 'URB-UB0165',
    brand: 'Urba',
    price: 155.00,
    stock: 12,
    condition: 'new',
    rating: 4.7,
    reviews_count: 19,
    compatibility: 'Fiat Fire 1.0, 1.4 Palio, Uno, Siena, Strada',
    description: 'Rotor metálico balanceado dinamicamente para vazão constante do fluido de arrefecimento e durabilidade superior.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Arrefecimento',
    icon_emoji: '💧',
    badge: '',
  },
  {
    id: 'prod-07',
    name: 'Filtro de Óleo Blindado Mann Filter',
    code: 'MAN-W712',
    brand: 'Mann Filter',
    price: 34.50,
    stock: 42,
    condition: 'new',
    rating: 4.9,
    reviews_count: 53,
    compatibility: 'VW Fox, Gol G5/G6, Polo, Voyage 1.0 e 1.6 EA111',
    description: 'Elemento filtrante de microfibras sintéticas com válvula de alívio e retenção para proteção máxima do motor.',
    is_active: true,
    store_id: 'store-hiper-02',
    category: 'Filtros',
    icon_emoji: '🧰',
    badge: 'Mais Vendido',
  },
  {
    id: 'prod-08',
    name: 'Filtro de Ar do Motor Fram',
    code: 'FRA-CA10013',
    brand: 'Fram',
    price: 42.00,
    stock: 30,
    condition: 'new',
    rating: 4.8,
    reviews_count: 36,
    compatibility: 'Honda Civic G9 e G10 2.0 Flex',
    description: 'Vedação em poliuretano injetado e dobras reforçadas para fluxo de ar perfeito e menor consumo de combustível.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Filtros',
    icon_emoji: '💨',
    badge: '',
  },
  {
    id: 'prod-09',
    name: 'Amortecedor Dianteiro Turbogás Cofap',
    code: 'COF-GP32488',
    brand: 'Cofap',
    price: 310.00,
    stock: 16,
    condition: 'new',
    rating: 4.8,
    reviews_count: 41,
    compatibility: 'Hyundai HB20 e HB20S 2012 a 2019',
    description: 'Amortecedor pressurizado com gás nitrogênio, proporcionando estabilidade superior em curvas e conforto na cidade.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Suspensão',
    icon_emoji: '🔩',
    badge: 'Destaque',
  },
  {
    id: 'prod-10',
    name: 'Kit Batente e Coifa do Amortecedor Monroe',
    code: 'MON-AX708',
    brand: 'Monroe',
    price: 79.90,
    stock: 25,
    condition: 'new',
    rating: 4.7,
    reviews_count: 18,
    compatibility: 'Hyundai HB20, Nissan March, Versa',
    description: 'Protege a haste do amortecedor contra impurezas, pedras e água, prolongando a vida útil do conjunto de suspensão.',
    is_active: true,
    store_id: 'store-velox-03',
    category: 'Suspensão',
    icon_emoji: '🛠️',
    badge: '',
  },
  {
    id: 'prod-11',
    name: 'Jogo de Velas de Ignição Iridium NGK',
    code: 'NGK-ILZKR7B',
    brand: 'NGK',
    price: 265.00,
    stock: 20,
    condition: 'new',
    rating: 5.0,
    reviews_count: 57,
    compatibility: 'Honda Civic, Fit, City 1.5 e 2.0 i-VTEC',
    description: 'Ponta de irídio ultrafina de 0.6mm que gera centelha mais potente, melhor queima e autonomia estendida para até 100.000 km.',
    is_active: true,
    store_id: 'store-japao-04',
    category: 'Elétrica',
    icon_emoji: '⚡',
    badge: 'Alta Performance',
  },
  {
    id: 'prod-12',
    name: 'Bateria Automotiva 60Ah Moura Heliar',
    code: 'MOU-M60GD',
    brand: 'Moura',
    price: 459.00,
    stock: 14,
    condition: 'new',
    rating: 4.9,
    reviews_count: 83,
    compatibility: 'Maioria dos sedans e hatches médios (Civic, Corolla, Cruze, Jetta)',
    description: 'A bateria oficial das montadoras. Maior corrente de partida a frio (CCA 460A) e liga de prata para maior durabilidade.',
    is_active: true,
    store_id: 'store-hiper-02',
    category: 'Elétrica',
    icon_emoji: '🔋',
    badge: 'Mais Vendido',
  },
  {
    id: 'prod-13',
    name: 'Lâmpada H4 Super Branca Philips Crystal Vision',
    code: 'PHI-12342',
    brand: 'Philips',
    price: 98.00,
    stock: 22,
    condition: 'new',
    rating: 4.8,
    reviews_count: 29,
    compatibility: 'Veículos com encaixe de farol H4 (12V 60/55W)',
    description: 'Efeito xênon branco brilhante de 4300K, excelente visibilidade noturna e homologada pelo Contran.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Elétrica',
    icon_emoji: '💡',
    badge: '',
  },
  {
    id: 'prod-14',
    name: 'Aditivo de Radiador Concentrado Paraflu Orgânico 1L',
    code: 'PAF-ORG1L',
    brand: 'Paraflu',
    price: 36.90,
    stock: 60,
    condition: 'new',
    rating: 4.9,
    reviews_count: 72,
    compatibility: 'Universal para todos os tipos de radiadores e motores flex/diesel',
    description: 'Fórmula Long Life orgânica com inibidores de corrosão para alumínio, ferro fundido e ligas de cobre.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Arrefecimento',
    icon_emoji: '🌡️',
    badge: 'Essencial',
  },
  {
    id: 'prod-15',
    name: 'Jogo de Palhetas Silicone Bosch Aerotwin',
    code: 'BOS-AERO2416',
    brand: 'Bosch',
    price: 89.90,
    stock: 35,
    condition: 'new',
    rating: 4.8,
    reviews_count: 44,
    compatibility: 'Encaixe universal tipo gancho (24" condutor / 16" passageiro)',
    description: 'Design aerodinâmico sem partes metálicas expostas. Limpeza suave, sem ruídos e durabilidade duas vezes maior.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Acessórios',
    icon_emoji: '🌧️',
    badge: 'Oferta',
  },
  {
    id: 'prod-16',
    name: 'Bieleta da Barra Estabilizadora Nakata',
    code: 'NAK-N99124',
    brand: 'Nakata',
    price: 54.00,
    stock: 28,
    condition: 'new',
    rating: 4.9,
    reviews_count: 23,
    compatibility: 'Toyota Corolla 2009 a 2019',
    description: 'Pino esférico temperado de alta resistência para eliminação de barulhos e folgas na dianteira do veículo.',
    is_active: true,
    store_id: 'store-bandeirantes-01',
    category: 'Suspensão',
    icon_emoji: '🔗',
    badge: '',
  },
];

// ── Pedidos Mockados ──────────────────────────────────────────────────────────
export const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    order_number: '#PED-1042',
    client_id: 'usr-client-demo',
    store_id: 'store-bandeirantes-01',
    address_id: 'addr-01',
    driver_id: 'usr-driver-demo',
    subtotal: 679.90,
    freight: 12.00,
    discount: 0,
    total: 691.90,
    delivery_type: 'express',
    payment_method: 'credit',
    status: 'shipped',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    store: { name: 'Auto Peças Bandeirantes', phone: '(11) 3322-4455', address: 'Av. dos Bandeirantes, 2400 — São Paulo, SP', city: 'São Paulo', lat: -23.6128, lng: -46.6682 },
    client: { name: 'João Silva', phone: '(11) 98765-4321' },
    driver: { name: 'Lucas Motta', phone: '(11) 91234-5678', vehicle: 'Honda CG 160 Fan - Placa AUT-7G21' },
    address: { street: 'Av. Paulista', number: '1000', complement: 'Apto 82', city: 'São Paulo', state: 'SP', lat: -23.5615, lng: -46.6560 },
    items: [
      { product_name: 'Pastilha de Freio Dianteira Cerâmica Bosch', quantity: 1, product_price: 189.90, subtotal: 189.90 },
      { product_name: 'Disco de Freio Dianteiro Ventilado Fremax', quantity: 2, product_price: 245.00, subtotal: 490.00 },
    ],
  },
  {
    id: 'ord-102',
    order_number: '#PED-1041',
    client_id: 'usr-client-demo',
    store_id: 'store-hiper-02',
    address_id: 'addr-01',
    driver_id: 'usr-driver-demo',
    subtotal: 230.10,
    freight: 14.00,
    discount: 0,
    total: 244.10,
    delivery_type: 'standard',
    payment_method: 'pix',
    status: 'delivered',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    store: { name: 'Hiper Peças Centro', phone: '(11) 3105-8890', address: 'Rua Barão de Campinas, 320 — São Paulo, SP', city: 'São Paulo', lat: -23.5382, lng: -46.6461 },
    client: { name: 'João Silva', phone: '(11) 98765-4321' },
    driver: { name: 'Lucas Motta', phone: '(11) 91234-5678' },
    address: { street: 'Av. Paulista', number: '1000', city: 'São Paulo', state: 'SP', lat: -23.5615, lng: -46.6560 },
    items: [
      { product_name: 'Óleo Sintético 5W-30 Castrol Magnatec 1L', quantity: 4, product_price: 48.90, subtotal: 195.60 },
      { product_name: 'Filtro de Óleo Blindado Mann Filter', quantity: 1, product_price: 34.50, subtotal: 34.50 },
    ],
  },
  {
    id: 'ord-103',
    order_number: '#PED-1043',
    client_id: 'usr-client-02',
    store_id: 'store-bandeirantes-01',
    address_id: 'addr-ext-01',
    driver_id: null,
    subtotal: 453.60,
    freight: 14.50,
    discount: 0,
    total: 468.10,
    delivery_type: 'express',
    payment_method: 'credit',
    status: 'preparing',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    store: { name: 'Auto Peças Bandeirantes', phone: '(11) 3322-4455', address: 'Av. dos Bandeirantes, 2400 — São Paulo, SP', city: 'São Paulo', lat: -23.6128, lng: -46.6682 },
    client: { name: 'Mariana Souza', phone: '(11) 98822-3344' },
    address: { street: 'Rua Oscar Freire', number: '820', city: 'São Paulo', state: 'SP', lat: -23.5629, lng: -46.6698 },
    items: [
      { product_name: 'Kit Correia Dentada + Tensor Gates', quantity: 1, product_price: 178.00, subtotal: 178.00 },
      { product_name: 'Jogo de Velas de Ignição Iridium NGK', quantity: 1, product_price: 265.00, subtotal: 265.00 },
    ],
  },
  {
    id: 'ord-104',
    order_number: '#PED-1044',
    client_id: 'usr-client-03',
    store_id: 'store-bandeirantes-01',
    address_id: 'addr-ext-02',
    driver_id: null,
    subtotal: 620.00,
    freight: 15.00,
    discount: 0,
    total: 635.00,
    delivery_type: 'express',
    payment_method: 'pix',
    status: 'preparing',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    store: { name: 'Auto Peças Bandeirantes', phone: '(11) 3322-4455', address: 'Av. dos Bandeirantes, 2400 — São Paulo, SP', city: 'São Paulo', lat: -23.6128, lng: -46.6682 },
    client: { name: 'Roberto Fernandes', phone: '(11) 97711-2233' },
    address: { street: 'Rua Domingos de Morais', number: '1420', city: 'São Paulo', state: 'SP', lat: -23.5912, lng: -46.6368 },
    items: [
      { product_name: 'Amortecedor Dianteiro Turbogás Cofap', quantity: 2, product_price: 310.00, subtotal: 620.00 },
    ],
  },
  {
    id: 'ord-105',
    order_number: '#PED-1039',
    client_id: 'usr-client-04',
    store_id: 'store-bandeirantes-01',
    address_id: 'addr-ext-03',
    driver_id: 'usr-driver-demo',
    subtotal: 459.00,
    freight: 16.00,
    discount: 0,
    total: 475.00,
    delivery_type: 'express',
    payment_method: 'credit',
    status: 'delivered',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date().toISOString(),
    store: { name: 'Auto Peças Bandeirantes', phone: '(11) 3322-4455', address: 'Av. dos Bandeirantes, 2400 — São Paulo, SP', city: 'São Paulo', lat: -23.6128, lng: -46.6682 },
    client: { name: 'Beatriz Lima', phone: '(11) 96655-4433' },
    driver: { name: 'Lucas Motta', phone: '(11) 91234-5678' },
    address: { street: 'Av. Brigadeiro Faria Lima', number: '3144', city: 'São Paulo', state: 'SP', lat: -23.5865, lng: -46.6820 },
    items: [
      { product_name: 'Bateria Automotiva 60Ah Moura Heliar', quantity: 1, product_price: 459.00, subtotal: 459.00 },
    ],
  },
  {
    id: 'ord-106',
    order_number: '#PED-1038',
    client_id: 'usr-client-05',
    store_id: 'store-hiper-02',
    address_id: 'addr-ext-04',
    driver_id: 'usr-driver-demo',
    subtotal: 98.00,
    freight: 11.50,
    discount: 0,
    total: 109.50,
    delivery_type: 'express',
    payment_method: 'pix',
    status: 'delivered',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date().toISOString(),
    store: { name: 'Hiper Peças Centro', phone: '(11) 3105-8890', address: 'Rua Barão de Campinas, 320 — São Paulo, SP', city: 'São Paulo', lat: -23.5382, lng: -46.6461 },
    client: { name: 'Carlos Santos', phone: '(11) 95544-3322' },
    driver: { name: 'Lucas Motta', phone: '(11) 91234-5678' },
    address: { street: 'Rua Augusta', number: '1500', city: 'São Paulo', state: 'SP', lat: -23.5568, lng: -46.6612 },
    items: [
      { product_name: 'Lâmpada H4 Super Branca Philips Crystal Vision', quantity: 1, product_price: 98.00, subtotal: 98.00 },
    ],
  },
];

// ── Endereços do Cliente Mockado ──────────────────────────────────────────────
export const INITIAL_ADDRESSES = [
  {
    id: 'addr-01',
    user_id: 'usr-client-demo',
    label: 'Casa',
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Apto 82',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
    is_default: true,
    lat: -23.5615,
    lng: -46.6560,
  },
  {
    id: 'addr-02',
    user_id: 'usr-client-demo',
    label: 'Oficina do Carlão',
    street: 'Rua do Gasômetro',
    number: '340',
    complement: 'Box 4',
    neighborhood: 'Brás',
    city: 'São Paulo',
    state: 'SP',
    cep: '03004-000',
    is_default: false,
    lat: -23.5432,
    lng: -46.6214,
  },
];

// ── Veículos do Cliente Mockado ───────────────────────────────────────────────
export const INITIAL_VEHICLES = [
  {
    id: 'veh-01',
    user_id: 'usr-client-demo',
    brand: 'Honda',
    model: 'Civic EXL 2.0 Flex Aut.',
    year: '2020',
    plate: 'BRA-2E19',
    color: 'Prata',
    is_default: true,
  },
  {
    id: 'veh-02',
    user_id: 'usr-client-demo',
    brand: 'Volkswagen',
    model: 'Gol 1.6 MSI Flex',
    year: '2018',
    plate: 'GOL-4F22',
    color: 'Branco',
    is_default: false,
  },
];

// ── Dados do Entregador Mockado ───────────────────────────────────────────────
export const INITIAL_DRIVER_DATA = {
  id: 'usr-driver-demo',
  user_id: 'usr-driver-demo',
  vehicle_type: 'moto',
  vehicle_model: 'Honda CG 160 Fan 2023',
  vehicle_plate: 'AUT-7G21',
  is_online: true,
  rating: 4.96,
  total_deliveries: 158,
  balance: 384.50,
  wallet_balance: 384.50,
};

// ── Avaliações Mockadas da Loja ───────────────────────────────────────────────
export const INITIAL_REVIEWS = [
  {
    id: 'rev-01',
    store_id: 'store-bandeirantes-01',
    user_id: 'usr-client-01',
    user: { name: 'Carlos Mendes' },
    rating: 5,
    comment: 'Entrega espetacular em 35 minutos! Pastilha 100% original Bosch com nota fiscal.',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-02',
    store_id: 'store-bandeirantes-01',
    user_id: 'usr-client-02',
    user: { name: 'Fernanda Rocha' },
    rating: 5,
    comment: 'Melhor preço de São Paulo para peças de suspensão Cofap. Atendimento muito ágil.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-03',
    store_id: 'store-bandeirantes-01',
    user_id: 'usr-client-03',
    user: { name: 'Ricardo Alves' },
    rating: 4,
    comment: 'Produto bem embalado e entrega rápida. Recomendo com certeza!',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── GERENCIADOR DO BANCO EM MEMÓRIA / LOCALSTORAGE ───────────────────────────
class MockDatabase {
  constructor() {
    this.stores = [...INITIAL_STORES];
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [...INITIAL_ORDERS];
    this.addresses = [...INITIAL_ADDRESSES];
    this.vehicles = [...INITIAL_VEHICLES];
    this.driver = { ...INITIAL_DRIVER_DATA };
    this.reviews = [...INITIAL_REVIEWS];
    this.loadState();
  }

  loadState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.stores)    this.stores    = parsed.stores;
        if (parsed.products)  this.products  = parsed.products;
        if (parsed.orders)    this.orders    = parsed.orders;
        if (parsed.addresses) this.addresses = parsed.addresses;
        if (parsed.vehicles)  this.vehicles  = parsed.vehicles;
        if (parsed.driver)    this.driver    = parsed.driver;
        if (parsed.reviews)   this.reviews   = parsed.reviews;
      }
    } catch (e) {
      console.warn('Erro ao carregar mock data do storage:', e);
    }
  }

  saveState() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stores: this.stores,
        products: this.products,
        orders: this.orders,
        addresses: this.addresses,
        vehicles: this.vehicles,
        driver: this.driver,
        reviews: this.reviews,
      }));
    } catch (e) {
      console.warn('Erro ao salvar mock data no storage:', e);
    }
  }

  reset() {
    this.stores = [...INITIAL_STORES];
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [...INITIAL_ORDERS];
    this.addresses = [...INITIAL_ADDRESSES];
    this.vehicles = [...INITIAL_VEHICLES];
    this.driver = { ...INITIAL_DRIVER_DATA };
    this.reviews = [...INITIAL_REVIEWS];
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }

  // ── Produtos
  getProducts({ category, brand, condition, minPrice, maxPrice, minRating, onlyInStock, search, storeId } = {}) {
    let list = this.products.map(p => {
      const store = this.stores.find(s => s.id === p.store_id) || this.stores[0];
      return {
        ...p,
        store: { id: store.id, name: store.name, rating: store.rating, distance: store.distance, is_open: store.is_open, address: store.address },
        categoryObj: { name: p.category, icon: 'fa-solid fa-wrench' },
        icon: p.icon_emoji || '🔩',
      };
    });

    if (storeId) list = list.filter(p => p.store_id === storeId);
    if (category && category !== 'Tudo') {
      const catLower = category.toLowerCase();
      list = list.filter(p => (p.category || '').toLowerCase() === catLower);
    }
    if (brand) list = list.filter(p => (p.brand || '').toLowerCase() === brand.toLowerCase());
    if (condition && condition !== 'all') list = list.filter(p => p.condition === condition);
    if (minPrice) list = list.filter(p => p.price >= minPrice);
    if (maxPrice) list = list.filter(p => p.price <= maxPrice);
    if (minRating) list = list.filter(p => p.rating >= minRating);
    if (onlyInStock) list = list.filter(p => p.stock > 0);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(s) ||
        (p.brand || '').toLowerCase().includes(s) ||
        (p.code || '').toLowerCase().includes(s) ||
        (p.compatibility || '').toLowerCase().includes(s)
      );
    }

    return list;
  }

  getProductById(id) {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return null;
    const store = this.stores.find(s => s.id === prod.store_id) || this.stores[0];
    return {
      ...prod,
      store,
      category: { name: prod.category, icon: 'fa-solid fa-wrench' },
      icon: prod.icon_emoji || '🔩',
    };
  }

  saveProduct(storeId, prodData) {
    if (prodData.id) {
      this.products = this.products.map(p => p.id === prodData.id ? { ...p, ...prodData } : p);
    } else {
      const newProd = {
        ...prodData,
        id: `prod-${Date.now()}`,
        store_id: storeId,
        is_active: true,
        rating: 5.0,
        reviews_count: 0,
        icon_emoji: prodData.icon_emoji || '🔩',
      };
      this.products.unshift(newProd);
    }
    this.saveState();
  }

  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.saveState();
  }

  // ── Lojas
  getStores(search = '') {
    if (!search) return this.stores;
    const s = search.toLowerCase();
    return this.stores.filter(st => st.name.toLowerCase().includes(s) || st.description.toLowerCase().includes(s));
  }

  getStoreByOwner(ownerId) {
    return this.stores.find(s => s.owner_id === ownerId) || this.stores[0];
  }

  getStoreById(storeId) {
    return this.stores.find(s => s.id === storeId) || this.stores[0];
  }

  updateStore(id, updates) {
    this.stores = this.stores.map(s => s.id === id ? { ...s, ...updates } : s);
    this.saveState();
    return this.getStoreById(id);
  }

  // ── Pedidos
  getClientOrders(clientId) {
    return this.orders.filter(o => o.client_id === clientId || o.client_id === 'usr-client-demo');
  }

  getStoreOrders(storeId) {
    return this.orders.filter(o => o.store_id === storeId);
  }

  getAvailableDeliveries() {
    return this.orders.filter(o => o.status === 'preparing' && !o.driver_id);
  }

  getMyDeliveries(driverId) {
    return this.orders.filter(o => o.driver_id === driverId || o.driver_id === 'usr-driver-demo');
  }

  updateOrderStatus(orderId, status) {
    this.orders = this.orders.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status };
        if (status === 'delivered') updated.delivered_at = new Date().toISOString();
        return updated;
      }
      return o;
    });
    this.saveState();
    return this.orders.find(o => o.id === orderId);
  }

  acceptDelivery(orderId, driverId) {
    this.orders = this.orders.map(o => {
      if (o.id === orderId) {
        return { ...o, driver_id: driverId, status: 'shipped' };
      }
      return o;
    });
    this.saveState();
    return this.orders.find(o => o.id === orderId);
  }

  createOrder({ clientId, storeId, addressId, items, subtotal, freight, discount, total, deliveryType, paymentMethod }) {
    const store = this.getStoreById(storeId);
    const client = MOCK_USERS.client.profile;
    const address = this.addresses.find(a => a.id === addressId) || this.addresses[0];

    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: `#PED-${Math.floor(1045 + Math.random() * 900)}`,
      client_id: clientId,
      store_id: storeId,
      address_id: addressId,
      driver_id: null,
      subtotal: subtotal || total,
      freight: freight || 0,
      discount: discount || 0,
      total: total || subtotal,
      delivery_type: deliveryType || 'express',
      payment_method: paymentMethod || 'credit',
      status: 'pending',
      created_at: new Date().toISOString(),
      store: {
        name: store?.name || 'Auto Peças Bandeirantes',
        phone: store?.phone || '(11) 3322-4455',
        address: store?.address || '',
        city: store?.city || 'São Paulo',
        lat: store?.lat || -23.6128,
        lng: store?.lng || -46.6682,
      },
      client: { name: client.name, phone: client.phone },
      address: {
        street: address?.street || 'Av. Paulista',
        number: address?.number || '1000',
        city: address?.city || 'São Paulo',
        lat: address?.lat || -23.5615,
        lng: address?.lng || -46.6560,
      },
      items: items.map(i => ({
        product_name: i.name || i.product_name,
        quantity: i.qty || i.quantity || 1,
        product_price: i.price || i.product_price || 0,
        subtotal: (i.price || i.product_price || 0) * (i.qty || i.quantity || 1),
      })),
    };

    this.orders.unshift(newOrder);
    this.saveState();
    return newOrder;
  }

  // ── Endereços e Veículos
  getAddresses(userId) {
    return this.addresses.filter(a => a.user_id === userId || a.user_id === 'usr-client-demo');
  }

  saveAddress(userId, addr) {
    const newAddr = { ...addr, id: `addr-${Date.now()}`, user_id: userId };
    this.addresses.push(newAddr);
    this.saveState();
    return newAddr;
  }

  removeAddress(id) {
    this.addresses = this.addresses.filter(a => a.id !== id);
    this.saveState();
  }

  getVehicles(userId) {
    return this.vehicles.filter(v => v.user_id === userId || v.user_id === 'usr-client-demo');
  }

  saveVehicle(userId, veh) {
    const newVeh = { ...veh, id: `veh-${Date.now()}`, user_id: userId };
    this.vehicles.push(newVeh);
    this.saveState();
    return newVeh;
  }

  // ── Driver
  getDriverData(driverId) {
    return { ...this.driver, id: driverId, user_id: driverId };
  }

  setDriverOnline(driverId, isOnline) {
    this.driver.is_online = isOnline;
    this.saveState();
  }

  updateDriverData(driverId, updates) {
    this.driver = { ...this.driver, ...updates };
    if (updates.balance !== undefined) {
      this.driver.wallet_balance = updates.balance;
    }
    this.saveState();
    return this.getDriverData(driverId);
  }

  // ── Avaliações
  getStoreReviews(storeId) {
    return this.reviews.filter(r => r.store_id === storeId || storeId === 'store-bandeirantes-01');
  }

  createReview({ orderId, storeId, userId, rating, comment }) {
    const rev = {
      id: `rev-${Date.now()}`,
      order_id: orderId,
      store_id: storeId,
      user_id: userId,
      rating,
      comment,
      created_at: new Date().toISOString(),
      user: { name: 'Cliente AutoGO' },
    };
    this.reviews.unshift(rev);
    this.saveState();
    return rev;
  }
}

export const mockDb = new MockDatabase();

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getDemoRoleByEmail(email) {
  if (!email) return null;
  const e = email.toLowerCase().trim();
  if (e.includes('cliente') || e === 'client@autogo.com') return 'client';
  if (e.includes('loja') || e.includes('comerciante') || e === 'merchant@autogo.com') return 'merchant';
  if (e.includes('entregador') || e.includes('driver') || e.includes('motorista')) return 'driver';
  return null;
}

export function getMockUser(role = 'client') {
  return MOCK_USERS[role] || MOCK_USERS.client;
}

export function getFallbackMockUser(email = '') {
  const role = getDemoRoleByEmail(email) || 'client';
  const base = MOCK_USERS[role];
  return {
    ...base,
    email: email || base.email,
    profile: {
      ...base.profile,
      email: email || base.profile.email,
    },
  };
}
