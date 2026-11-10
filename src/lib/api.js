import { supabase } from './supabase';
import { mockDb, MOCK_USERS, getDemoRoleByEmail, getFallbackMockUser } from '../data/mockData';

// Escapa caracteres curinga do LIKE (%, _) e a própria barra invertida
const escapeLike = (str) => String(str).replace(/[\\%_]/g, (m) => `\\${m}`);

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  /** Login com email e senha */
  async login(email, password) {
    const demoRole = getDemoRoleByEmail(email);
    if (demoRole) {
      const mockUser = MOCK_USERS[demoRole];
      return { user: mockUser, session: { user: mockUser }, profile: mockUser.profile };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch {
      const fallback = getFallbackMockUser(email);
      return { user: fallback, session: { user: fallback }, profile: fallback.profile };
    }
  },

  /** Logout */
  async logout() {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('autogo_demo_session');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('autogo_demo_session');
    }
  },

  /** Buscar sessão atual */
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  },

  /** Buscar perfil do usuário logado */
  async getProfile(userId) {
    // Verifica primeiro se é um dos perfis demo
    const demo = Object.values(MOCK_USERS).find(u => u.id === userId || u.email === userId);
    if (demo) return demo.profile;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }

    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('autogo_demo_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.profile) return parsed.profile;
        } catch { /* ignore */ }
      }
    }
    return MOCK_USERS.client.profile;
  },

  /** Atualizar perfil */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    const current = await this.getProfile(userId);
    const merged = { ...current, ...updates };
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('autogo_demo_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.profile = merged;
          sessionStorage.setItem('autogo_demo_session', JSON.stringify(parsed));
        } catch { /* ignore */ }
      }
    }
    return merged;
  },

  /** Recuperar senha */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      });
      if (error) throw error;
    } catch {
      // Mock simulation - sempre com sucesso para apresentação
      return true;
    }
  },

  /** Redefinir senha */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch {
      return true;
    }
  },
};

// ─── PRODUTOS ────────────────────────────────────────────────────────────────

export const productsApi = {
  /** Listar produtos com filtros (retorna { data, count }) */
  async list({ category, brand, condition, minPrice, maxPrice, minRating, onlyInStock, search, storeId, limit = 50, offset = 0 } = {}) {
    try {
      let q = supabase
        .from('products')
        .select(`
          *,
          store:stores(id, name, rating, distance, is_open),
          category:categories(name, icon)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (storeId)    q = q.eq('store_id', storeId);
      if (category)   q = q.eq('categories.slug', category);
      if (brand)      q = q.eq('brand', brand);
      if (condition && condition !== 'all') q = q.eq('condition', condition);
      if (minPrice)   q = q.gte('price', minPrice);
      if (maxPrice)   q = q.lte('price', maxPrice);
      if (minRating)  q = q.gte('rating', minRating);
      if (onlyInStock) q = q.gt('stock', 0);
      if (search) {
        const s = escapeLike(search);
        q = q.or(`name.ilike.%${s}%,brand.ilike.%${s}%,compatibility.ilike.%${s}%,code.ilike.%${s}%`);
      }

      const { data, count, error } = await q;
      if (!error && data && data.length) return { data, count };
    } catch {
      /* fallback */
    }

    const mockList = mockDb.getProducts({ category, brand, condition, minPrice, maxPrice, minRating, onlyInStock, search, storeId });
    return { data: mockList.slice(offset, offset + limit), count: mockList.length };
  },

  /** Buscar produto por ID */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores(id, name, rating, reviews:reviews(rating), is_open, address, phone),
          category:categories(name, icon)
        `)
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getProductById(id) || mockDb.products[0];
  },

  /** Comparar preços do mesmo produto entre lojas */
  async comparePrices(productCode) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, price, stock, rating, condition,
          store:stores(id, name, rating, distance, is_open, address)
        `)
        .eq('code', productCode)
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }

    // Procura no mock
    const match = mockDb.products.filter(p => p.code === productCode || p.name.includes(productCode));
    if (match.length) {
      return match.map(p => {
        const store = mockDb.getStoreById(p.store_id);
        return {
          id: p.id,
          price: p.price,
          stock: p.stock,
          rating: p.rating,
          condition: p.condition,
          store,
        };
      });
    }

    // Retorna variações mockadas de exemplo
    return [
      { id: 'cmp-1', price: 189.90, stock: 24, rating: 4.9, condition: 'new', store: mockDb.stores[0] },
      { id: 'cmp-2', price: 198.50, stock: 12, rating: 4.8, condition: 'new', store: mockDb.stores[1] },
      { id: 'cmp-3', price: 210.00, stock: 8,  rating: 4.7, condition: 'new', store: mockDb.stores[2] },
    ];
  },

  /** Loja cria produto */
  async create(storeId, product) {
    mockDb.saveProduct(storeId, product);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, store_id: storeId })
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return { ...product, id: `prod-${Date.now()}`, store_id: storeId };
  },

  /** Loja atualiza produto */
  async update(id, updates) {
    mockDb.saveProduct(null, { id, ...updates });
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return { id, ...updates };
  },

  /** Loja remove produto */
  async remove(id) {
    mockDb.deleteProduct(id);
    try {
      await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);
    } catch {
      /* fallback */
    }
  },
};

// ─── LOJAS ───────────────────────────────────────────────────────────────────

export const storesApi = {
  /** Listar todas as lojas */
  async list(search = '') {
    try {
      let q = supabase
        .from('stores')
        .select('*')
        .order('rating', { ascending: false });
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getStores(search);
  },

  /** Buscar loja do usuário logado */
  async getMyStore(ownerId) {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', ownerId)
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getStoreByOwner(ownerId);
  },

  /** Atualizar dados da loja */
  async update(id, updates) {
    const updated = mockDb.updateStore(id, updates);
    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return updated;
  },

  /** Criar nova loja */
  async create(data) {
    const created = mockDb.updateStore('store-bandeirantes-01', data);
    try {
      const { data: store, error } = await supabase
        .from('stores')
        .insert(data)
        .select()
        .single();
      if (!error && store) return store;
    } catch {
      /* fallback */
    }
    return created;
  },
};

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

export const ordersApi = {
  /** Cliente cria pedido */
  async create({ clientId, storeId, addressId, items, subtotal, freight, discount, total, deliveryType, paymentMethod }) {
    const mockOrder = mockDb.createOrder({ clientId, storeId, addressId, items, subtotal, freight, discount, total, deliveryType, paymentMethod });
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id:      clientId,
          store_id:       storeId,
          address_id:     addressId,
          subtotal,
          freight,
          discount,
          total,
          delivery_type:  deliveryType,
          payment_method: paymentMethod,
          status:         'pending',
        })
        .select()
        .single();
      if (!orderError && order) return order;
    } catch {
      /* fallback */
    }
    return mockOrder;
  },

  /** Buscar pedidos do cliente */
  async getClientOrders(clientId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name),
          items:order_items(product_name, quantity, product_price)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getClientOrders(clientId);
  },

  /** Buscar pedidos da loja */
  async getStoreOrders(storeId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:profiles(name, phone),
          address:addresses(street, number, city),
          items:order_items(product_name, quantity, product_price, subtotal)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getStoreOrders(storeId);
  },

  /** Atualizar status do pedido (loja/entregador) */
  async updateStatus(orderId, status) {
    const updated = mockDb.updateOrderStatus(orderId, status);
    try {
      const updates = { status };
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return updated;
  },
};

// ─── FAVORITOS ───────────────────────────────────────────────────────────────

export const favoritesApi = {
  async list(userId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id, product:products(*)')
        .eq('user_id', userId);
      if (!error && data) return data.map(f => f.product);
    } catch {
      /* fallback */
    }
    try {
      const raw = localStorage.getItem('prfav') || '[]';
      const ids = JSON.parse(raw);
      return mockDb.products.filter(p => ids.includes(p.id));
    } catch {
      return [];
    }
  },

  async toggle(userId, productId) {
    try {
      const raw = localStorage.getItem('prfav') || '[]';
      const ids = JSON.parse(raw);
      const exists = ids.includes(productId);
      const next = exists ? ids.filter(i => i !== productId) : [...ids, productId];
      localStorage.setItem('prfav', JSON.stringify(next));
      return !exists;
    } catch {
      return true;
    }
  },
};

// ─── CARRINHO (sincronizado) ─────────────────────────────────────────────────

export const cartApi = {
  async list() {
    try {
      const raw = localStorage.getItem('prcart') || '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async replace(userId, items) {
    try {
      localStorage.setItem('prcart', JSON.stringify(items));
    } catch {
      /* ignore */
    }
  },
};

// ─── GEOCODING (Nominatim/OSM) ───────────────────────────────────────────────

export const geoApi = {
  async geocode(address) {
    if (!address || !address.trim()) return null;
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
        encodeURIComponent(address + ', Brasil');
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!res.ok) return { lat: -23.5505, lng: -46.6333 };
      const rows = await res.json();
      if (!rows?.length) return { lat: -23.5505, lng: -46.6333 };
      return { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
    } catch {
      return { lat: -23.5505, lng: -46.6333 };
    }
  },
};

// ─── ENDEREÇOS ───────────────────────────────────────────────────────────────

export const addressesApi = {
  async list(userId) {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getAddresses(userId);
  },

  async create(userId, address) {
    const saved = mockDb.saveAddress(userId, address);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...address, user_id: userId })
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return saved;
  },

  async remove(id) {
    mockDb.removeAddress(id);
    try {
      await supabase.from('addresses').delete().eq('id', id);
    } catch {
      /* fallback */
    }
  },
};

// ─── AVALIAÇÕES ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  async getStoreReviews(storeId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, user:profiles(name)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getStoreReviews(storeId);
  },

  async create({ orderId, storeId, userId, rating, comment }) {
    const rev = mockDb.createReview({ orderId, storeId, userId, rating, comment });
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ order_id: orderId, store_id: storeId, user_id: userId, rating, comment })
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return rev;
  },
};

// ─── ENTREGADORES ────────────────────────────────────────────────────────────

export const driversApi = {
  async getAvailableDeliveries() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name, address, city, lat, lng),
          address:addresses(street, number, city, lat, lng),
          client:profiles(name, phone)
        `)
        .eq('status', 'preparing')
        .is('driver_id', null)
        .order('created_at', { ascending: true });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getAvailableDeliveries();
  },

  async acceptDelivery(orderId, driverId) {
    const updated = mockDb.acceptDelivery(orderId, driverId);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ driver_id: driverId, status: 'shipped' })
        .eq('id', orderId)
        .is('driver_id', null)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return updated;
  },

  async getMyDeliveries(driverId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name, address),
          address:addresses(street, number, city),
          client:profiles(name, phone),
          items:order_items(product_name, quantity)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getMyDeliveries(driverId);
  },

  async setOnline(driverId, isOnline) {
    mockDb.setDriverOnline(driverId, isOnline);
    try {
      await supabase
        .from('drivers')
        .update({ is_online: isOnline })
        .eq('id', driverId);
    } catch {
      /* fallback */
    }
  },

  async getDriver(driverId) {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getDriverData(driverId);
  },

  async updateDriver(driverId, updates) {
    try {
      await supabase
        .from('drivers')
        .upsert({ id: driverId, ...updates });
    } catch {
      /* fallback */
    }
  },
};

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────

export const vehiclesApi = {
  async list(userId) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId);
      if (!error && data && data.length) return data;
    } catch {
      /* fallback */
    }
    return mockDb.getVehicles(userId);
  },

  async create(userId, vehicle) {
    const saved = mockDb.saveVehicle(userId, vehicle);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({ ...vehicle, user_id: userId })
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      /* fallback */
    }
    return saved;
  },
};

// ─── PERFIS ───────────────────────────────────────────────────────────────────

export const profilesApi = {
  async get(userId) {
    return authApi.getProfile(userId);
  },

  async update(userId, updates) {
    return authApi.updateProfile(userId, updates);
  },
};

// ─── NOTIFICAÇÕES ────────────────────────────────────────────────────────────

export const notificationsApi = {
  async list() {
    return [];
  },
  async markRead() {},
  async markAllRead() {},
  subscribe() {
    return { unsubscribe: () => {} };
  },
};

// ─── REALTIME — pedidos ───────────────────────────────────────────────────────

export const realtimeApi = {
  subscribeStoreOrders() {
    return { unsubscribe: () => {} };
  },
  subscribeOrderStatus() {
    return { unsubscribe: () => {} };
  },
  subscribeAvailableDeliveries() {
    return { unsubscribe: () => {} };
  },
  unsubscribe() {},
};
