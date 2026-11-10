import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { profilesApi, favoritesApi, cartApi, geoApi } from '../lib/api';
import { MOCK_USERS, getDemoRoleByEmail, getFallbackMockUser } from '../data/mockData';

const CONN_TIMEOUT = 2500;
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
      if (data) setProfile(data);

      // Carregar favoritos
      const { data: favs } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (favs && favs.length) {
        const ids = favs.map(f => f.product_id);
        setFavorites(ids);
        localStorage.setItem('prfav', JSON.stringify(ids));
      }
    } catch (err) {
      console.warn('Erro ao carregar profile:', err.message);
    }
  };

  // ── Sincronizar carrinho com o banco ───────────────────────
  const loadCartFromDb = useCallback(async (userId) => {
    try {
      const rows = await cartApi.list(userId);
      const dbCart = (rows || []).map(r => ({
        id: r.product_id || r.id,
        qty: r.quantity || r.qty || 1,
        storeId: r.store_id || null,
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
    } catch {
      /* segue com localStorage */
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
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cart]);

  // ── Verificar sessão ao iniciar ───────────────────────────
  useEffect(() => {
    let active = true;
    const bootStart = Date.now();
    const MIN_BOOT_MS = 850;

    const finishLoading = () => {
      const elapsed = Date.now() - bootStart;
      const wait = Math.max(0, MIN_BOOT_MS - elapsed);
      setTimeout(() => {
        if (active) setLoading(false);
      }, wait);
    };

    // Limpa sessões demo anteriores ao abrir/recarregar o site para nunca iniciar já conectado
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('autogo_demo_session');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('autogo_demo_session');
      }
    } catch { /* ignore */ }

    // Checagem padrão do Supabase com timeout seguro
    withTimeout(supabase.auth.getSession(), CONN_TIMEOUT)
      .then(({ data: { session } }) => {
        if (!active) return;
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
          loadCartFromDb(session.user.id);
        }
        finishLoading();
      })
      .catch((err) => {
        console.warn('Sessão offline / timeout:', err?.message || err);
        if (active) {
          setUser(null);
          setProfile(null);
          finishLoading();
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
        loadCartFromDb(session.user.id);
      } else {
        // Só limpa se não for sessão demo ativa
        const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('autogo_demo_session') : null;
        if (!saved) {
          setUser(null);
          setProfile(null);
          setFavorites([]);
          if (typeof localStorage !== 'undefined') localStorage.removeItem('prfav');
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Login Direto com Conta Demo (com tempo de autenticação realista) ──
  const loginAsDemo = useCallback(async (role = 'client') => {
    const mockUser = MOCK_USERS[role] || MOCK_USERS.client;
    // Simula tempo real de autenticação na tela de login antes de redirecionar
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('autogo_demo_session', JSON.stringify({
        user: mockUser,
        profile: mockUser.profile,
        ts: Date.now(),
      }));
    }
    setUser(mockUser);
    setProfile(mockUser.profile);
    return { user: mockUser, profile: mockUser.profile };
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const demoRole = getDemoRoleByEmail(email);
    if (demoRole) {
      return await loginAsDemo(demoRole);
    }

    const start = Date.now();
    const MIN_LOGIN_MS = 1500;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOGIN_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOGIN_MS - elapsed));
      }
      if (data?.user) {
        if (data.user.profile && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('autogo_demo_session', JSON.stringify({
            user: data.user,
            profile: data.user.profile,
            ts: Date.now(),
          }));
          setProfile(data.user.profile);
        }
        setUser(data.user);
        await loadProfile(data.user.id);
      }
      return data;
    } catch {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOGIN_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOGIN_MS - elapsed));
      }
      // Fallback gracioso para modo apresentação offline
      const fallback = getFallbackMockUser(email);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('autogo_demo_session', JSON.stringify({
          user: fallback,
          profile: fallback.profile,
          ts: Date.now(),
        }));
      }
      setUser(fallback);
      setProfile(fallback.profile);
      return { user: fallback, profile: fallback.profile };
    }
  }, [loginAsDemo]);

  // ── Register ──────────────────────────────────────────────
  const register = useCallback(async ({ email, password, name, role, phone, cpf, storeName, cnpj, address, vehicleType }) => {
    const finalName = role === 'merchant' ? storeName : name;
    const start = Date.now();
    const MIN_REG_MS = 1500;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: finalName, role, phone } },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        const geo = await geoApi.geocode(address);
        await supabase.rpc('finalize_onboarding', {
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
      }
      const elapsed = Date.now() - start;
      if (elapsed < MIN_REG_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_REG_MS - elapsed));
      }
      return data;
    } catch {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_REG_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_REG_MS - elapsed));
      }
      // Mock signup fallback
      const mockUser = {
        id: `usr-${Date.now()}`,
        email,
        role,
        profile: {
          id: `usr-${Date.now()}`,
          name: finalName || name || 'Novo Usuário',
          email,
          role,
          phone: phone || '',
          cpf: cpf || '',
          cnpj: cnpj || '',
        },
      };
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('autogo_demo_session', JSON.stringify({
          user: mockUser,
          profile: mockUser.profile,
          ts: Date.now(),
        }));
      }
      setUser(mockUser);
      setProfile(mockUser.profile);
      return { user: mockUser, profile: mockUser.profile };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('autogo_demo_session');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('autogo_demo_session');
      localStorage.removeItem('prcart');
      localStorage.removeItem('prfav');
    }
    setUser(null);
    setProfile(null);
    setCart([]);
    setFavorites([]);
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
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
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
    } catch {
      showToast('Erro ao favoritar.', 'error');
    }
  }, [user, showToast]);

  const cartTotal = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <AppContext.Provider value={{
      user, profile, loading,
      login, loginAsDemo, register, logout,
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
