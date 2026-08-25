import { describe, it, expect } from 'vitest';
import { fmt, statusLabel } from './index.js';

describe('fmt', () => {
  it('formata número como moeda BR', () => {
    expect(fmt(35)).toBe('R$ 35,00');
    expect(fmt(35.5)).toBe('R$ 35,50');
    expect(fmt(1234.56)).toBe('R$ 1234,56');
  });

  it('trata valores inválidos sem quebrar', () => {
    expect(fmt(NaN)).toBe('R$ 0,00');
    expect(fmt(null)).toBe('R$ 0,00');
    expect(fmt('abc')).toBe('R$ 0,00');
  });
});

describe('statusLabel', () => {
  it('mapeia status conhecidos', () => {
    expect(statusLabel('pending')).toBe('Aguardando');
    expect(statusLabel('preparing')).toBe('Em preparo');
    expect(statusLabel('shipped')).toBe('Enviado');
    expect(statusLabel('delivered')).toBe('Entregue');
    expect(statusLabel('cancelled')).toBe('Cancelado');
  });

  it('retorna o próprio valor para status desconhecido', () => {
    expect(statusLabel('weird')).toBe('weird');
    expect(statusLabel(undefined)).toBe(undefined);
  });
});
