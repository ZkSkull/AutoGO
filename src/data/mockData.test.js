import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb, MOCK_USERS, getDemoRoleByEmail, getFallbackMockUser } from './mockData';

describe('mockData - Helper Functions', () => {
  it('detecta role correto a partir do email', () => {
    expect(getDemoRoleByEmail('cliente@autogo.com')).toBe('client');
    expect(getDemoRoleByEmail('loja@autogo.com')).toBe('merchant');
    expect(getDemoRoleByEmail('comerciante@autogo.com')).toBe('merchant');
    expect(getDemoRoleByEmail('entregador@autogo.com')).toBe('driver');
    expect(getDemoRoleByEmail('driver@autogo.com')).toBe('driver');
    expect(getDemoRoleByEmail('outro@email.com')).toBe(null);
  });

  it('retorna usuário demo padrão por role', () => {
    const client = MOCK_USERS.client;
    expect(client.role).toBe('client');
    expect(client.profile.name).toBe('João Silva');

    const merchant = MOCK_USERS.merchant;
    expect(merchant.role).toBe('merchant');
    expect(merchant.profile.name).toBe('Auto Peças Bandeirantes');

    const driver = MOCK_USERS.driver;
    expect(driver.role).toBe('driver');
    expect(driver.profile.name).toBe('Lucas Motta');
  });

  it('gera fallback mock para qualquer email', () => {
    const fallback = getFallbackMockUser('teste@empresa.com');
    expect(fallback.email).toBe('teste@empresa.com');
    expect(fallback.role).toBe('client');
  });
});

describe('mockDb - Database em memória', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('retorna lista completa de produtos e lojas', () => {
    const prods = mockDb.getProducts();
    expect(prods.length).toBeGreaterThanOrEqual(16);
    expect(prods[0]).toHaveProperty('name');
    expect(prods[0]).toHaveProperty('price');
    expect(prods[0]).toHaveProperty('store');

    const stores = mockDb.getStores();
    expect(stores.length).toBeGreaterThanOrEqual(4);
  });

  it('filtra produtos por categoria e busca', () => {
    const freios = mockDb.getProducts({ category: 'Freios' });
    expect(freios.length).toBeGreaterThan(0);
    freios.forEach(p => expect(p.category.toLowerCase()).toBe('freios'));

    const search = mockDb.getProducts({ search: 'Bosch' });
    expect(search.length).toBeGreaterThan(0);
    search.forEach(p => {
      const match = p.name.includes('Bosch') || p.brand.includes('Bosch') || p.code.includes('BOS');
      expect(match).toBe(true);
    });
  });

  it('gerencia pedidos para cliente, loja e entregador', () => {
    const clientOrders = mockDb.getClientOrders('usr-client-demo');
    expect(clientOrders.length).toBeGreaterThan(0);

    const storeOrders = mockDb.getStoreOrders('store-bandeirantes-01');
    expect(storeOrders.length).toBeGreaterThan(0);

    const available = mockDb.getAvailableDeliveries();
    expect(Array.isArray(available)).toBe(true);

    const driverDeliveries = mockDb.getMyDeliveries('usr-driver-demo');
    expect(driverDeliveries.length).toBeGreaterThan(0);
  });

  it('permite atualizar status de pedido', () => {
    const updated = mockDb.updateOrderStatus('ord-101', 'delivered');
    expect(updated.status).toBe('delivered');
    expect(updated).toHaveProperty('delivered_at');
  });

  it('permite entregador aceitar entrega disponível', () => {
    const accepted = mockDb.acceptDelivery('ord-103', 'usr-driver-demo');
    expect(accepted.driver_id).toBe('usr-driver-demo');
    expect(accepted.status).toBe('shipped');
  });

  it('retorna endereços e veículos do cliente', () => {
    const addrs = mockDb.getAddresses('usr-client-demo');
    expect(addrs.length).toBeGreaterThanOrEqual(2);

    const vehs = mockDb.getVehicles('usr-client-demo');
    expect(vehs.length).toBeGreaterThanOrEqual(2);
  });
});
