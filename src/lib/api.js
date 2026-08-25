import { supabase } from './supabase';

// Escapa caracteres curinga do LIKE (%, _) e a própria barra invertida
const escapeLike = (str) => String(str).replace(/[\\%_]/g, (m) => `\\${m}`);

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  /** Login com email e senha */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** Logout */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** Buscar sessão atual */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /** Buscar perfil do usuário logado */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Atualizar perfil */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Recuperar senha */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });
    if (error) throw error;
  },

  /** Redefinir senha (usuário autenticado via link de recuperação) */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

// ─── PRODUTOS ────────────────────────────────────────────────────────────────

export const productsApi = {
  /** Listar produtos com filtros (retorna { data, count }) */
  async list({ category, brand, condition, minPrice, maxPrice, minRating, onlyInStock, search, storeId, limit = 50, offset = 0 } = {}) {
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
    if (error) throw error;
    return { data, count };
  },

  /** Buscar produto por ID */
  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(id, name, rating, reviews:reviews(rating), is_open, address, phone),
        category:categories(name, icon)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Comparar preços do mesmo produto (mesmo code) entre lojas */
  async comparePrices(productCode) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, price, stock, rating, condition,
        store:stores(id, name, rating, distance, is_open, address)
      `)
      .eq('code', productCode)
      .eq('is_active', true)
      .order('price', { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Loja cria produto */
  async create(storeId, product) {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, store_id: storeId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Loja atualiza produto */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Loja remove produto */
  async remove(id) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },
};

// ─── LOJAS ───────────────────────────────────────────────────────────────────

export const storesApi = {
  /** Listar todas as lojas */
  async list(search = '') {
    let q = supabase
      .from('stores')
      .select('*')
      .order('rating', { ascending: false });
    if (search) q = q.ilike('name', `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /** Buscar loja do usuário logado */
  async getMyStore(ownerId) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', ownerId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /** Atualizar dados da loja */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Criar nova loja */
  async create(data) {
    const { data: store, error } = await supabase
      .from('stores')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return store;
  },
};

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

export const ordersApi = {
  /** Cliente cria pedido (pedido + itens + baixa de estoque) */
  async create({ clientId, storeId, addressId, items, subtotal, freight, discount, total, deliveryType, paymentMethod }) {
    // 1. Criar o pedido
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
    if (orderError) throw orderError;

    // 2. Criar os itens
    const orderItems = items.map(item => ({
      order_id:      order.id,
      product_id:    item.product_id ?? item.productId,
      product_name:  item.product_name ?? item.name,
      product_price: item.product_price ?? item.price,
      quantity:      item.quantity ?? item.qty,
      subtotal:      item.subtotal ?? (item.price ?? item.product_price) * (item.qty ?? item.quantity),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    if (itemsError) throw itemsError;

    // 3. Diminuir estoque de cada produto
    for (const item of orderItems) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity:   item.quantity,
      });
      if (stockError) throw stockError;
    }

    return order;
  },

  /** Buscar pedidos do cliente */
  async getClientOrders(clientId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        store:stores(name),
        items:order_items(product_name, quantity, product_price)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Buscar pedidos da loja */
  async getStoreOrders(storeId) {
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
    if (error) throw error;
    return data;
  },

  /** Atualizar status do pedido (loja/entregador) */
  async updateStatus(orderId, status) {
    const updates = { status };
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── FAVORITOS ───────────────────────────────────────────────────────────────

export const favoritesApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id, product:products(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data.map(f => f.product);
  },

  async toggle(userId, productId) {
    // Tenta inserir; se a constraint única (user_id, product_id) já existir, remove.
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, product_id: productId });
    if (!error) return true; // adicionado

    if (error.code === '23505') {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
      return false; // removido
    }
    throw error;
  },
};

// ─── CARRINHO (sincronizado) ─────────────────────────────────────────────────

export const cartApi = {
  /** Buscar carrinho do usuário no banco */
  async list(userId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  /** Substitui o carrinho inteiro do usuário (upsert em lote) */
  async replace(userId, items) {
    if (!items.length) {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
      if (error) throw error;
      return;
    }
    const rows = items.map(i => ({ user_id: userId, product_id: i.id, quantity: i.qty }));
    const { error } = await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,product_id' });
    if (error) throw error;
  },
};

// ─── GEOCODING (Nominatim/OSM) ───────────────────────────────────────────────

export const geoApi = {
  /** Converte endereço em { lat, lng } — retorna null se não conseguir */
  async geocode(address) {
    if (!address || !address.trim()) return null;
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
        encodeURIComponent(address + ', Brasil');
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!res.ok) return null;
      const rows = await res.json();
      if (!rows?.length) return null;
      return { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
    } catch {
      return null; // geocoding é best-effort
    }
  },
};

// ─── ENDEREÇOS ───────────────────────────────────────────────────────────────

export const addressesApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(userId, address) {
    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...address, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── AVALIAÇÕES ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  async getStoreReviews(storeId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, user:profiles(name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create({ orderId, storeId, userId, rating, comment }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({ order_id: orderId, store_id: storeId, user_id: userId, rating, comment })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── ENTREGADORES ────────────────────────────────────────────────────────────

export const driversApi = {
  /** Listar entregas disponíveis para um entregador */
  async getAvailableDeliveries() {
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
    if (error && error.code === '42703') {
      // Migration de geo ainda não aplicada — busca sem lat/lng
      const { data: fallback, error: fErr } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name, address, city),
          address:addresses(street, number, city),
          client:profiles(name, phone)
        `)
        .eq('status', 'preparing')
        .is('driver_id', null)
        .order('created_at', { ascending: true });
      if (fErr) throw fErr;
      return fallback;
    }
    if (error) throw error;
    return data;
  },

  /** Entregador aceita uma entrega */
  async acceptDelivery(orderId, driverId) {
    const { data, error } = await supabase
      .from('orders')
      .update({ driver_id: driverId, status: 'shipped' })
      .eq('id', orderId)
      .is('driver_id', null) // evita double-accept
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Buscar entregas do entregador */
  async getMyDeliveries(driverId) {
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
    if (error) throw error;
    return data;
  },

  /** Toggle online/offline */
  async setOnline(driverId, isOnline) {
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: isOnline })
      .eq('id', driverId);
    if (error) throw error;
  },

  /** Buscar dados do entregador */
  async getDriver(driverId) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /** Atualizar dados do entregador */
  async updateDriver(driverId, updates) {
    const { error } = await supabase
      .from('drivers')
      .upsert({ id: driverId, ...updates });
    if (error) throw error;
  },
};

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────

export const vehiclesApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async create(userId, vehicle) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...vehicle, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── PERFIS ───────────────────────────────────────────────────────────────────

export const profilesApi = {
  async get(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async update(userId, updates) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
  },
};

// ─── NOTIFICAÇÕES ────────────────────────────────────────────────────────────

export const notificationsApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  },

  async markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllRead(userId) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  /** Ouvir notificações em tempo real */
  subscribe(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => callback(payload.new))
      .subscribe();
  },
};

// ─── REALTIME — pedidos ───────────────────────────────────────────────────────

export const realtimeApi = {
  /** Loja ouve novos pedidos em tempo real */
  subscribeStoreOrders(storeId, callback) {
    return supabase
      .channel(`store_orders:${storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      }, payload => callback(payload))
      .subscribe();
  },

  /** Cliente ouve status do pedido */
  subscribeOrderStatus(orderId, callback) {
    return supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, payload => callback(payload.new))
      .subscribe();
  },

  /** Entregador ouve entregas disponíveis */
  subscribeAvailableDeliveries(callback) {
    return supabase
      .channel('available_deliveries')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `status=eq.preparing`,
      }, payload => callback(payload.new))
      .subscribe();
  },

  unsubscribe(channel) {
    supabase.removeChannel(channel);
  },
};
