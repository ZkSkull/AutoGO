-- 20260102_enable_rls.sql
-- Habilita Row Level Security em todas as tabelas públicas.
-- Regras por role:
--   profiles  : cada usuário lê/atualiza o próprio; insert do próprio (register)
--   stores    : leitura pública; escrita só do dono
--   products  : leitura pública; escrita só do dono da loja
--   categories: leitura pública
--   orders    : cliente vê os próprios; loja vê os da sua loja; entregador vê os próprios
--   order_items: segue orders
--   favorites : dono
--   reviews   : leitura pública; escrita do autor
--   addresses / vehicles / notifications / drivers / cart_items: dono

-- ⚠️ IMPORTANTE: antes de rodar, garanta que profiles tem as colunas id, name, phone, cpf, role
-- e que o trigger de criação automática de profile existe (ver 20260102b).

alter table public.profiles       enable row level security;
alter table public.stores         enable row level security;
alter table public.products       enable row level security;
alter table public.categories     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.favorites      enable row level security;
alter table public.reviews        enable row level security;
alter table public.addresses      enable row level security;
alter table public.vehicles       enable row level security;
alter table public.notifications  enable row level security;
alter table public.drivers        enable row level security;

-- ─── PROFILES ──────────────────────────────────────────────
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Merchant/driver precisam ver nome/telefone do cliente em pedidos.
create policy "profiles_select_for_orders" on public.profiles
  for select using (
    exists (
      select 1 from public.orders o
      where o.client_id = profiles.id
        and (
          o.store_id in (select s.id from public.stores s where s.owner_id = auth.uid())
          or o.driver_id = auth.uid()
        )
    )
  );

-- ─── STORES ────────────────────────────────────────────────
create policy "stores_select_public" on public.stores
  for select using (true);

create policy "stores_insert_owner" on public.stores
  for insert with check (auth.uid() = owner_id);

create policy "stores_update_owner" on public.stores
  for update using (auth.uid() = owner_id);

create policy "stores_delete_owner" on public.stores
  for delete using (auth.uid() = owner_id);

-- ─── PRODUCTS ──────────────────────────────────────────────
create policy "products_select_public" on public.products
  for select using (true);

create policy "products_insert_owner" on public.products
  for insert with check (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "products_update_owner" on public.products
  for update using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "products_delete_owner" on public.products
  for delete using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- ─── CATEGORIES ────────────────────────────────────────────
create policy "categories_select_public" on public.categories
  for select using (true);

-- ─── ORDERS ────────────────────────────────────────────────
create policy "orders_select_client" on public.orders
  for select using (auth.uid() = client_id);

create policy "orders_select_store" on public.orders
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "orders_select_driver" on public.orders
  for select using (auth.uid() = driver_id);

create policy "orders_insert_client" on public.orders
  for insert with check (auth.uid() = client_id);

-- Cliente marca pedido como avaliado (reviewed)
create policy "orders_update_client" on public.orders
  for update using (auth.uid() = client_id);

create policy "orders_update_store" on public.orders
  for update using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- Entregador: aceita entrega disponível (driver_id ainda null) ou atualiza
-- as próprias entregas. A policy USING é avaliada com a linha ANTIGA,
-- então aceitar (driver_id = null) exige a condição extra de status.
create policy "orders_update_driver" on public.orders
  for update using (
    auth.uid() = driver_id
    or (status = 'preparing' and driver_id is null)
  );

-- ─── ORDER ITEMS ───────────────────────────────────────────
create policy "order_items_select_client" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid())
  );

create policy "order_items_select_store" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      join public.stores s on s.id = o.store_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );

create policy "order_items_select_driver" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.driver_id = auth.uid())
  );

create policy "order_items_insert_client" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid())
  );

-- ─── FAVORITES ─────────────────────────────────────────────
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);

-- Garante a constraint única usada pelo favoritesApi.toggle (erro 23505)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'favorites_user_product_key'
  ) then
    alter table public.favorites
      add constraint favorites_user_product_key unique (user_id, product_id);
  end if;
end $$;

-- ─── REVIEWS ───────────────────────────────────────────────
create policy "reviews_select_public" on public.reviews
  for select using (true);

create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id);

create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);

-- ─── ADDRESSES ─────────────────────────────────────────────
create policy "addresses_select_own" on public.addresses
  for select using (auth.uid() = user_id);

create policy "addresses_insert_own" on public.addresses
  for insert with check (auth.uid() = user_id);

create policy "addresses_delete_own" on public.addresses
  for delete using (auth.uid() = user_id);

-- ─── VEHICLES ──────────────────────────────────────────────
create policy "vehicles_select_own" on public.vehicles
  for select using (auth.uid() = user_id);

create policy "vehicles_insert_own" on public.vehicles
  for insert with check (auth.uid() = user_id);

-- ─── NOTIFICATIONS ─────────────────────────────────────────
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- ─── DRIVERS ───────────────────────────────────────────────
create policy "drivers_select_own" on public.drivers
  for select using (auth.uid() = id);

create policy "drivers_insert_own" on public.drivers
  for insert with check (auth.uid() = id);

create policy "drivers_update_own" on public.drivers
  for update using (auth.uid() = id);

-- Merchant precisa ver dados do entregador atribuído ao pedido
create policy "drivers_select_for_orders" on public.drivers
  for select using (
    exists (
      select 1 from public.orders o
      where o.driver_id = drivers.id
        and exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
    )
  );
