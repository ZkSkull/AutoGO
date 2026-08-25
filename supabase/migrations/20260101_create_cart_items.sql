-- 20260101_create_cart_items.sql
-- Cria a tabela cart_items para sincronizar o carrinho entre dispositivos.

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    int  not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Um item por usuário/produto
create unique index if not exists cart_items_user_product_uq
  on public.cart_items (user_id, product_id);

alter table public.cart_items enable row level security;

create policy "cart_items_select_own" on public.cart_items
  for select using (auth.uid() = user_id);

create policy "cart_items_insert_own" on public.cart_items
  for insert with check (auth.uid() = user_id);

create policy "cart_items_update_own" on public.cart_items
  for update using (auth.uid() = user_id);

create policy "cart_items_delete_own" on public.cart_items
  for delete using (auth.uid() = user_id);

-- Mantém updated_at atualizado
create or replace function public.touch_cart_item()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cart_items_touch on public.cart_items;
create trigger cart_items_touch
  before update on public.cart_items
  for each row execute function public.touch_cart_item();