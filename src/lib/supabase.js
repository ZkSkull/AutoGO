import { createClient } from '@supabase/supabase-js';
import { mockDb, MOCK_USERS, getDemoRoleByEmail, getFallbackMockUser } from '../data/mockData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tevzyssfvpjzhtwcmimn.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-YaGyBYVp97TVLdXVxhvpQ_a6IDoM_p';

// Criação do cliente Supabase real
const rawClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper de sessão mock salva
function getSavedMockSession() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('autogo_demo_session');
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

// ── Resolvedor de tabelas mockadas quando Supabase estiver offline ou em modo demo ──
function resolveMockTable(table, state) {
  let list = [];
  if (table === 'products') {
    list = mockDb.getProducts();
  } else if (table === 'stores') {
    list = mockDb.getStores();
  } else if (table === 'orders') {
    list = [...mockDb.orders];
  } else if (table === 'profiles') {
    list = Object.values(MOCK_USERS).map(u => u.profile);
    const saved = getSavedMockSession();
    if (saved?.profile) {
      const idx = list.findIndex(p => p.id === saved.profile.id);
      if (idx >= 0) list[idx] = saved.profile;
      else list.unshift(saved.profile);
    }
  } else if (table === 'addresses') {
    list = [...mockDb.addresses];
  } else if (table === 'vehicles') {
    list = [...mockDb.vehicles];
  } else if (table === 'drivers') {
    list = [mockDb.driver];
  } else if (table === 'reviews') {
    list = [...mockDb.reviews];
  } else if (table === 'categories') {
    list = [
      { name: 'Motor', slug: 'motor', icon: 'fa-solid fa-engine' },
      { name: 'Freios', slug: 'freios', icon: 'fa-solid fa-circle-stop' },
      { name: 'Suspensão', slug: 'suspensao', icon: 'fa-solid fa-car-burst' },
      { name: 'Elétrica', slug: 'eletrica', icon: 'fa-solid fa-bolt' },
      { name: 'Filtros', slug: 'filtros', icon: 'fa-solid fa-filter' },
      { name: 'Transmissão', slug: 'transmissao', icon: 'fa-solid fa-gears' },
      { name: 'Arrefecimento', slug: 'arrefecimento', icon: 'fa-solid fa-temperature-half' },
      { name: 'Acessórios', slug: 'acessorios', icon: 'fa-solid fa-wrench' },
    ];
  } else if (table === 'favorites' || table === 'cart_items' || table === 'order_items') {
    list = [];
  }

  // Filtros
  for (const f of state.filters || []) {
    if (f.op === 'eq') {
      list = list.filter(item => {
        if (f.col.includes('.')) {
          const parts = f.col.split('.');
          return item[parts[0]]?.[parts[1]] == f.val;
        }
        return item[f.col] == f.val;
      });
    } else if (f.op === 'is') {
      list = list.filter(item => item[f.col] === f.val);
    } else if (f.op === 'gte') {
      list = list.filter(item => Number(item[f.col]) >= Number(f.val));
    } else if (f.op === 'lte') {
      list = list.filter(item => Number(item[f.col]) <= Number(f.val));
    } else if (f.op === 'gt') {
      list = list.filter(item => Number(item[f.col]) > Number(f.val));
    }
  }

  // Ordenação
  if (state.order) {
    const { col, ascending } = state.order;
    list.sort((a, b) => {
      const va = a[col] ?? 0;
      const vb = b[col] ?? 0;
      return ascending ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }

  const totalCount = list.length;

  if (state.isHead) {
    return { data: null, error: null, count: totalCount };
  }

  if (state.limit && state.limit > 0) {
    list = list.slice(0, state.limit);
  }

  if (state.isSingle) {
    return { data: list[0] || null, error: null, count: totalCount };
  }

  return { data: list, error: null, count: totalCount };
}

// ── Wrapper Proxy com Fallback Automático ────────────────────────────────────
function createSafeBuilder(targetBuilder, table) {
  const queryState = {
    filters: [],
    isSingle: false,
    isHead: false,
    limit: null,
    order: null,
  };

  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve) => {
          // Se já estiver logado em modo demo ou Supabase desconectado, responde mock rapidamente
          const savedSession = getSavedMockSession();
          const executeTimeout = savedSession ? 800 : 2000;

          const timer = setTimeout(() => {
            const fallback = resolveMockTable(table, queryState);
            resolve(fallback);
          }, executeTimeout);

          return target.then(
            (res) => {
              clearTimeout(timer);
              if (res && res.error) {
                const fallback = resolveMockTable(table, queryState);
                return resolve(fallback);
              }
              return resolve(res);
            },
            () => {
              clearTimeout(timer);
              const fallback = resolveMockTable(table, queryState);
              return resolve(fallback);
            }
          ).catch(() => {
            clearTimeout(timer);
            const fallback = resolveMockTable(table, queryState);
            return resolve(fallback);
          });
        };
      }

      const orig = target[prop];
      if (typeof orig === 'function') {
        return (...args) => {
          if (prop === 'eq')     queryState.filters.push({ col: args[0], op: 'eq', val: args[1] });
          if (prop === 'is')     queryState.filters.push({ col: args[0], op: 'is', val: args[1] });
          if (prop === 'gte')    queryState.filters.push({ col: args[0], op: 'gte', val: args[1] });
          if (prop === 'lte')    queryState.filters.push({ col: args[0], op: 'lte', val: args[1] });
          if (prop === 'gt')     queryState.filters.push({ col: args[0], op: 'gt', val: args[1] });
          if (prop === 'single') queryState.isSingle = true;
          if (prop === 'limit')  queryState.limit = args[0];
          if (prop === 'order')  queryState.order = { col: args[0], ascending: args[1]?.ascending ?? true };
          if (prop === 'select' && args[1]?.head) queryState.isHead = true;

          // Se for mutação em modo offline, atualiza mockDb
          if (prop === 'update') {
            const updates = args[0];
            if (table === 'orders') {
              const f = queryState.filters.find(fl => fl.col === 'id');
              if (f?.val && updates.status) mockDb.updateOrderStatus(f.val, updates.status);
            }
          }

          try {
            const res = orig.apply(target, args);
            return (res && typeof res === 'object' && typeof res.then === 'function')
              ? createSafeBuilder(res, table)
              : res;
          } catch {
            return createSafeBuilder(target, table);
          }
        };
      }

      return orig;
    },
  };

  return new Proxy(targetBuilder, handler);
}

// ── Cliente Supabase Seguro com suporte completo a Demonstração ───────────────
export const supabase = new Proxy(rawClient, {
  get(target, prop) {
    if (prop === 'from') {
      return (table) => {
        try {
          const b = target.from(table);
          return createSafeBuilder(b, table);
        } catch {
          // Caso a inicialização do builder do Supabase falhe
          return createSafeBuilder({ then: (res) => res(resolveMockTable(table, {})) }, table);
        }
      };
    }

    if (prop === 'channel') {
      return (name) => {
        try { target.channel(name); } catch { /* ignore */ }
        return {
          on: function() { return this; },
          subscribe: function(cb) { if (cb) setTimeout(() => cb('SUBSCRIBED'), 10); return this; },
          unsubscribe: function() { return this; },
          send: function() { return this; },
        };
      };
    }

    if (prop === 'removeChannel') {
      return () => Promise.resolve('ok');
    }

    if (prop === 'rpc') {
      return async (fn, args) => {
        try {
          const res = await target.rpc(fn, args);
          if (res && !res.error) return res;
        } catch { /* ignore */ }
        return { data: null, error: null };
      };
    }

    if (prop === 'auth') {
      const origAuth = target.auth;
      return new Proxy(origAuth, {
        get(aTarget, aProp) {
          if (aProp === 'getSession') {
            return async () => {
              const saved = getSavedMockSession();
              if (saved?.user) {
                return { data: { session: { user: saved.user } }, error: null };
              }
              try {
                const res = await Promise.race([
                  aTarget.getSession(),
                  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
                ]);
                return res;
              } catch {
                return { data: { session: null }, error: null };
              }
            };
          }

          if (aProp === 'signInWithPassword') {
            return async ({ email, password }) => {
              const demoRole = getDemoRoleByEmail(email);
              if (demoRole) {
                const mockUser = MOCK_USERS[demoRole];
                return { data: { user: mockUser, session: { user: mockUser } }, error: null };
              }
              try {
                const res = await Promise.race([
                  aTarget.signInWithPassword({ email, password }),
                  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000)),
                ]);
                if (res?.data?.user) return res;
              } catch (err) {
                // Fallback gracioso para modo apresentação
                console.warn('Supabase auth offline, fallback para mock demo:', err.message);
                const fallback = getFallbackMockUser(email);
                return { data: { user: fallback, session: { user: fallback } }, error: null };
              }
              const fallback = getFallbackMockUser(email);
              return { data: { user: fallback, session: { user: fallback } }, error: null };
            };
          }

          if (aProp === 'signOut') {
            return async () => {
              try {
                if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem('autogo_demo_session');
                }
                await aTarget.signOut();
              } catch { /* ignore */ }
              return { error: null };
            };
          }

          if (aProp === 'resetPasswordForEmail') {
            return async () => ({ error: null });
          }

          if (aProp === 'updateUser') {
            return async () => ({ data: { user: {} }, error: null });
          }

          const orig = aTarget[aProp];
          return typeof orig === 'function' ? orig.bind(aTarget) : orig;
        },
      });
    }

    const orig = target[prop];
    return typeof orig === 'function' ? orig.bind(target) : orig;
  },
});

export default supabase;
