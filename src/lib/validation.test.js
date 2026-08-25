import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotSchema, firstIssue } from './validation.js';

const validRegister = {
  name: 'João Silva',
  storeName: 'Auto Peças Silva',
  phone: '(11) 99999-9999',
  cpf: '',
  cnpj: '',
  address: '',
  email: 'joao@email.com',
  password: 'senhaForte1',
  confirm: 'senhaForte1',
  agreed: true,
};

describe('loginSchema', () => {
  it('aceita credenciais válidas', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    const r = loginSchema.safeParse({ email: 'inválido', password: 'x' });
    expect(r.success).toBe(false);
    expect(firstIssue(r)).toMatch(/e-mail/i);
  });

  it('rejeita campo vazio', () => {
    const r = loginSchema.safeParse({ email: '', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('aceita cadastro válido', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it('rejeita senhas divergentes', () => {
    const r = registerSchema.safeParse({ ...validRegister, confirm: 'outra' });
    expect(r.success).toBe(false);
    expect(firstIssue(r).toLowerCase()).toContain('coincidem');
  });

  it('rejeita senha curta', () => {
    const r = registerSchema.safeParse({ ...validRegister, password: '123', confirm: '123' });
    expect(r.success).toBe(false);
    expect(firstIssue(r).toLowerCase()).toContain('8');
  });

  it('rejeita termos não aceitos', () => {
    const r = registerSchema.safeParse({ ...validRegister, agreed: false });
    expect(r.success).toBe(false);
    expect(firstIssue(r)).toMatch(/termos/i);
  });

  it('aceita telefone vazio (opcional)', () => {
    const r = registerSchema.safeParse({ ...validRegister, phone: '' });
    expect(r.success).toBe(true);
  });

  it('rejeita telefone malformado quando informado', () => {
    const r = registerSchema.safeParse({ ...validRegister, phone: '999' });
    expect(r.success).toBe(false);
  });
});

describe('forgotSchema', () => {
  it('rejeita e-mail inválido', () => {
    expect(forgotSchema.safeParse({ email: 'x' }).success).toBe(false);
    expect(forgotSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
});

describe('firstIssue', () => {
  it('retorna mensagem legível', () => {
    const r = loginSchema.safeParse({ email: 'mau', password: '' });
    expect(firstIssue(r)).toBeTruthy();
  });
});