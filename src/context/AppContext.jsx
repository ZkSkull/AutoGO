import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { profilesApi, favoritesApi, cartApi, geoApi } from '../lib/api';

const CONN_TIMEOUT = 8000;
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo de conexão esgotado')), ms)),
  ]);

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prcart') || '[]'); } catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prfav') || '[]'); } catch { return []; }
  });
  const [toasts, setToasts] = useState([]);

  // ── Carregar profile do banco ──────────────────────────────
  const loadProfile = async (userId) => {
    try {
      const data = await profilesApi.get(userId);
      setProfile(data);

      // Carregar favoritos
      const { data: favs } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (favs) {
        const ids = favs.map(f => f.product_id);
        setFavorites(ids);
        localStorage.setItem('prfav', JSON.stringify(ids));
      }
    } catch (err) {
      console.error('Erro ao carregar profile:', err.message);
    }
  };

  // ── Sincronizar carrinho com o banco ───────────────────────
  const loadCartFromDb = useCallback(async (userId) => {
    try {
      const rows = await cartApi.list(userId);
      const dbCart = rows.map(r => ({
        id: r.product_id,
        qty: r.quantity,
        storeId: null,
      }));

      // Merge: carrinho local (não logado) + carrinho do banco
      const local = (() => {
        try { return JSON.parse(localStorage.getItem('prcart') || '[]'); } catch { return []; }
      })();
      const localIds = new Set(local.map(i => i.id));
      const merged = [
        ...local,
        ...dbCart.filter(i => !localIds.has(i.id)),
      ];
      if (merged.length) localStorage.setItem('prcart', JSON.stringify(merged));
      setCart(merged);
    } catch (err) {
      // Tabela ainda não existe (migration não aplicada) — segue só com localStorage
      if (err?.code !== '42P01') console.error('Erro ao sincronizar carrinho:', err?.message || err);
    }
  }, []);

  // Salva carrinho no banco quando mudar (se logado)
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const userRef = useRef(user);
  userRef.current = user;
  useEffect(() => {
    if (!userRef.current) return;
    const c = cartRef.current;
    const timer = setTimeout(async () => {
      try {
        await cartApi.replace(userRef.current.id, c);
      } catch (err) {
        if (err?.code !== '42P01') console.error('Erro ao salvar carrinho:', err?.message || err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cart]);

  // ── Verificar sessão ao iniciar ───────────────────────────
  useEffect(() => {
    let active = true;

    withTimeout(supabase.auth.getSession(), CONN_TIMEOUT)
      .then(({ data: { session } }) => {
        if (!active) return;
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
          loadCartFromDb(session.user.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Falha ao verificar sessão:', err?.message || err);
        if (active) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
        loadCartFromDb(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setFavorites([]);
        localStorage.removeItem('prfav');
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange vai chamar loadProfile automaticamente
    return data;
  }, []);

  // ── Register ──────────────────────────────────────────────
  const register = useCallback(async ({ email, password, name, role, phone, cpf, storeName, cnpj, address, vehicleType }) => {
    const finalName = role === 'merchant' ? storeName : name;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: finalName, role, phone } },
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) return data;

    // RLS-safe: o signup não tem sessão (e-mail de confirmação), então
    // loja/entregador/perfil são criados via RPC SECURITY DEFINER.
    const geo = await geoApi.geocode(address);
    const { error: onboardError } = await supabase.rpc('finalize_onboarding', {
      p_user_id: userId,
      p_role: role,
      p_store: role === 'merchant' ? {
        name: storeName, cnpj: cnpj || '', phone: phone || '',
        email, address: address || '',
        lat: geo?.lat ?? '', lng: geo?.lng ?? '',
      } : null,
      p_driver: role === 'driver' ? { vehicle_type: vehicleType || 'moto' } : null,
      p_phone: phone || '',
      p_cpf: cpf || '',
    });
    if (onboardError) throw onboardError;

    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCart([]);
    setProfile(null);
    localStorage.removeItem('prcart');
  }, []);

  // ── Cart ──────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const next = existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, {
            id: product.id,
            qty: 1,
            price: product.price,
            name: product.name,
            storeId: product.storeId || product.store_id || null,
          }];
      localStorage.setItem('prcart', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem('prcart', JSON.stringify(next));
      return next;
    });
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(prev => {
      const next = prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
      localStorage.setItem('prcart', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.setItem('prcart', '[]');
    setCart([]);
  }, []);

  // ── Toasts ────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Favoritos ─────────────────────────────────────────────
  const toggleFav = useCallback(async (productId) => {
    if (!user) { showToast('Faça login para favoritar.', 'info'); return; }
    try {
      const added = await favoritesApi.toggle(user.id, productId);
      setFavorites(prev => {
        const next = added ? [...prev, productId] : prev.filter(id => id !== productId);
        localStorage.setItem('prfav', JSON.stringify(next));
        return next;
      });
      showToast(added ? 'Favoritado!' : 'Removido dos favoritos.', 'info');
    } catch (err) {
      console.error('Erro ao favoritar:', err.message);
      showToast('Erro ao favoritar.', 'error');
    }
  }, [user, showToast]);

  const cartTotal = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <AppContext.Provider value={{
      user, profile, loading,
      login, register, logout,
      cart, cartTotal, addToCart, removeFromCart, changeQty, clearCart,
      favorites, toggleFav,
      toasts, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);