-- 20260103_stores_geo_hours.sql
-- 1. Colunas lat/lng em stores (usadas pelo driversApi.getAvailableDeliveries e MapView)
-- 2. Horários de funcionamento para is_open automático
-- 3. Trigger que cria profile automaticamente no signup
-- 4. decrement_stock com SECURITY DEFINER (senão o RLS bloqueia a baixa de estoque)

-- ─── 1. GEO ────────────────────────────────────────────────
alter table public.stores add column if not exists lat double precision;
alter table public.stores add column if not exists lng double precision;

-- ─── 2. HORÁRIOS ───────────────────────────────────────────
alter table public.stores add column if not exists open_time  time;
alter table public.stores add column if not exists close_time time;

-- Seta is_open automaticamente quando os horários forem definidos.
-- O merchant pode forçar manualmente; se informar horários, o trigger respeita o horário atual.
create or replace function public.sync_store_is_open()
returns trigger language plpgsql as $$
begin
  if new.open_time is not null and new.close_time is not null then
    new.is_open = (current_time >= new.open_time and current_time < new.close_time);
  end if;
  return new;
end;
$$;

drop trigger if exists stores_sync_is_open on public.stores;
create trigger stores_sync_is_open
  before insert or update of open_time, close_time on public.stores
  for each row execute function public.sync_store_is_open();

-- ─── 3. TRIGGER DE PROFILE NO SIGNUP ───────────────────────
-- Cria o profile automaticamente quando um novo usuário se registra.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 4. DECREMENT STOCK (RLS-safe) ─────────────────────────
-- A função já deve existir; garante SECURITY DEFINER para operar
-- sob RLS usando o role da função (postgres), não do usuário anon.
create or replace function public.decrement_stock(p_product_id uuid, p_quantity int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products
    set stock = greatest(0, stock - p_quantity),
        updated_at = now()
    where id = p_product_id;
end;
$$;

revoke all on function public.decrement_stock(uuid, int) from public;
grant execute on function public.decrement_stock(uuid, int) to authenticated, anon;

-- ─── 5. ONBOARDING (cria loja/entregador no signup sob RLS) ─────────────────
-- O signup acontece SEM sessão (e-mail de confirmação), então os inserts de
-- stores/drivers não passariam pelas policies de RLS (auth.uid() é null).
-- Essa função roda como SECURITY DEFINER e valida que o usuário existe.
create or replace function public.finalize_onboarding(
  p_user_id uuid,
  p_role text,
  p_store jsonb default null,
  p_driver jsonb default null,
  p_phone text default '',
  p_cpf text default ''
) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Garante que o usuário existe em auth.users
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuário não encontrado';
  end if;

  -- Completa o profile (o trigger já cria a linha; aqui só acrescenta phone/cpf/role)
  insert into public.profiles (id, name, phone, cpf, role)
  values (
    p_user_id,
    coalesce(p_store->>'name', (select raw_user_meta_data->>'name' from auth.users where id = p_user_id), ''),
    p_phone,
    p_cpf,
    p_role
  )
  on conflict (id) do update
    set phone = coalesce(public.profiles.phone, '') || '',
        cpf   = coalesce(public.profiles.cpf, ''),
        role  = public.profiles.role;

  if p_role = 'merchant' and p_store is not null then
    insert into public.stores (owner_id, name, cnpj, phone, email, address, lat, lng)
    values (
      p_user_id,
      p_store->>'name',
      p_store->>'cnpj',
      p_store->>'phone',
      p_store->>'email',
      p_store->>'address',
      nullif(p_store->>'lat', '')::double precision,
      nullif(p_store->>'lng', '')::double precision
    );
  end if;

  if p_role = 'driver' and p_driver is not null then
    insert into public.drivers (id, vehicle_type)
    values (p_user_id, coalesce(p_driver->>'vehicle_type', 'moto'));
  end if;
end;
$$;

grant execute on function public.finalize_onboarding(uuid, text, jsonb, jsonb, text, text)
  to authenticated, anon;
