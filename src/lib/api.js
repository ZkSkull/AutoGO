import { supabase } from './supabase';

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  /** Login com email e senha */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** Cadastro — cria usuário e perfil */
  async register({ email, password, name, role, phone, storeName, cnpj, address, vehicleType, cpf }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },  // vai para raw_user_meta_data → trigger cria profile
      },
    });
    if (error) throw error;

    const userId = data.user.id;

    // Complementar o perfil com campos extras
    await supabase.from('profiles').update({ phone, cpf }).eq('id', userId);

    // Se for comerciante, criar a loja
    if (role === 'merchant' && storeName) {
      await supabase.from('stores').insert({
        owner_id: userId,
        name: storeName,
        cnpj,
        address,
        email,
        phone,
      });
    }

    // Se for entregador, criar registro na tabela drivers
    if (role === 'driver') {
      await supabase.from('drivers').insert({
        id: userId,
        vehicle_type: vehicleType || 'moto',
      });
    }

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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
};

// ─── PRODUTOS ────────────────────────────────────────────────────────────────

export const productsApi = {
  /** Listar produtos com filtros */
  async list({ category, brand, condition, minPrice, maxPrice, minRating, onlyInStock, search, storeId, limit = 50, offset = 0 } = {}) {
    let q = supabase
      .from('products')
      .select(`
        *,
        store:stores(id, name, rating, distance, is_open),
        category:categories(name, icon)
      `)
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
      q = q.or(`name.ilike.%${search}%,brand.ilike.%${search}%,compatibility.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data;
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
};

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

export const ordersApi = {
  /** Cliente cria pedido */
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
      })
      .select()
      .single();
    if (orderError) throw orderError;

    // 2. Criar os itens
    const orderItems = items.map(item => ({
      order_id:      order.id,
      product_id:    item.productId,
      product_name:  item.name,
      product_price: item.price,
      quantity:      item.qty,
      subtotal:      item.price * item.qty,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    if (itemsError) throw itemsError;

    // 3. Diminuir estoque de cada produto
    for (const item of items) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity:   item.qty,
      });
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
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
      return false; // removido
    } else {
      await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
      return true;  // adicionado
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
        store:stores(name, address, lat, lng),
        address:addresses(street, number, city, lat, lng),
        client:profiles(name, phone)
      `)
      .eq('status', 'preparing')
      .is('driver_id', null)
      .order('created_at', { ascending: true });
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
