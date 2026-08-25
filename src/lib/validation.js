import { z } from 'zod';

const email = z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const forgotSchema = z.object({
  email,
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo.'),
    storeName: z.string().min(2, 'Informe o nome da loja.'),
    phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido. Use (11) 99999-9999.').or(z.literal('')),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido. Use 000.000.000-00.').or(z.literal('')),
    cnpj: z.string().min(1, 'Informe o CNPJ.').or(z.literal('')),
    address: z.string().min(1, 'Informe o endereço.').or(z.literal('')),
    email,
    password: z.string().min(8, 'Senha mínima de 8 caracteres.'),
    confirm: z.string(),
    agreed: z.boolean().refine(v => v, 'Aceite os termos para continuar.'),
  })
  .refine(d => d.password === d.confirm, { message: 'As senhas não coincidem.', path: ['confirm'] });

export const loginFields  = loginSchema.shape;
export const forgotFields = forgotSchema.shape;

/** Extrai o primeiro erro de um resultado zod em mensagem amigável */
export function firstIssue(result) {
  return result.error?.issues?.[0]?.message || 'Dados inválidos.';
}
