import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
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

  // ── Verificar sessão ao iniciar ───────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setFavorites([]);
        localStorage.removeItem('prfav');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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

    // Upsert profile com todos os dados preenchidos
    await supabase.from('profiles').upsert({
      id:   userId,
      name: finalName,
      phone: phone || '',
      cpf:   cpf   || '',
      role,
    });

    // Se comerciante, criar loja
    if (role === 'merchant' && storeName) {
      await supabase.from('stores').insert({
        owner_id: userId,
        name: storeName,
        cnpj, address, email, phone,
      });
    }

    // Se entregador, criar registro
    if (role === 'driver') {
      await supabase.from('drivers').insert({
        id: userId,
        vehicle_type: vehicleType || 'moto',
      });
    }

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
        : [...prev, { id: product.id, qty: 1, price: product.price, name: product.name }];
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

  // ── Favoritos ─────────────────────────────────────────────
  const toggleFav = useCallback(async (productId) => {
    if (!user) { showToast('Faça login para favoritar.', 'info'); return; }
    const isFav = favorites.includes(productId);
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      }
      setFavorites(prev => {
        const next = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
        localStorage.setItem('prfav', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Erro ao favoritar:', err.message);
    }
  }, [user, favorites]);

  // ── Toasts ────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

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

export const useApp = () => useContext(AppContext);