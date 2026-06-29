-- ============================================================================
-- Crown Jewels dashboard — Supabase schema
-- ============================================================================
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- Mirrors the app's localStorage shapes (entities stored as JSONB documents),
-- so migrating from the local demo is a straight copy. Generated columns expose
-- the common fields for queries/views (and the future Excel sync) without
-- changing the app.
--
-- IMPORTANT (security): the policies at the bottom ship in DEMO mode — the
-- public anon key can read/write everything. That is fine for a pre-launch
-- demo, but BEFORE real data goes in, wire Supabase Auth and switch to the
-- PRODUCTION policies (commented below). See BACKEND_SETUP.md.
-- ============================================================================

-- ---- Orders (Joya) ---------------------------------------------------------
create table if not exists public.orders (
  id            text primary key,
  data          jsonb not null,
  order_number  text generated always as (data->>'orderNumber') stored,
  customer_id   text generated always as (data->>'customerId') stored,
  status        text generated always as (data->>'status') stored,
  ship_date     text generated always as (data->>'shipDate') stored,
  salesperson   text generated always as (data->>'salesperson') stored,
  updated_at    timestamptz not null default now(),
  updated_by    text
);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_idx on public.orders (customer_id);

-- ---- Inventory lots (availability board) -----------------------------------
create table if not exists public.inventory_lots (
  id            text primary key,
  data          jsonb not null,
  commodity_id  text generated always as (data->>'commodityId') stored,
  kind          text generated always as (data->>'kind') stored,
  updated_at    timestamptz not null default now(),
  updated_by    text
);
create index if not exists inventory_commodity_idx on public.inventory_lots (commodity_id);

-- ---- Singleton documents (daily-quote prices, client selection, …) ---------
create table if not exists public.app_kv (
  key         text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---- Server-side numbering -------------------------------------------------
-- Atomic across users — replaces the per-browser localStorage counters so two
-- salespeople can never mint the same order/invoice number.
create sequence if not exists public.order_seq   start 1001;
create sequence if not exists public.invoice_seq start 5001;

create or replace function public.next_order_number()
  returns text language sql volatile as $$
  select 'CJ-'  || extract(year from now())::int || '-' || nextval('public.order_seq');
$$;

create or replace function public.next_invoice_number()
  returns text language sql volatile as $$
  select 'INV-' || extract(year from now())::int || '-' || nextval('public.invoice_seq');
$$;

-- ---- updated_at touch ------------------------------------------------------
create or replace function public.touch_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists inventory_touch on public.inventory_lots;
create trigger inventory_touch before update on public.inventory_lots
  for each row execute function public.touch_updated_at();

-- ---- Realtime --------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.inventory_lots;
alter publication supabase_realtime add table public.app_kv;

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.orders         enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.app_kv         enable row level security;

-- ---- DEMO policies (pre-auth) — anon can do everything. ---------------------
-- DROP THESE before launch and enable the PRODUCTION block below.
create policy "demo_all_orders"    on public.orders         for all using (true) with check (true);
create policy "demo_all_inventory" on public.inventory_lots for all using (true) with check (true);
create policy "demo_all_kv"        on public.app_kv         for all using (true) with check (true);

-- ---- PRODUCTION policies (enable once Supabase Auth is wired) ---------------
-- Uncomment, then drop the demo policies above.
--
-- -- Everyone signed in can read the boards/orders (sales desk is collaborative):
-- create policy "auth_read_orders"    on public.orders         for select using (auth.role() = 'authenticated');
-- create policy "auth_read_inventory" on public.inventory_lots for select using (auth.role() = 'authenticated');
-- create policy "auth_read_kv"        on public.app_kv         for select using (auth.role() = 'authenticated');
--
-- -- Salespeople may write; (optionally) scope orders to the owner via a
-- -- `salesperson`/`user_id` claim. Accounting role can update invoices/payments.
-- create policy "auth_write_orders"    on public.orders         for insert with check (auth.role() = 'authenticated');
-- create policy "auth_update_orders"   on public.orders         for update using (auth.role() = 'authenticated');
-- create policy "auth_write_inventory" on public.inventory_lots for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- create policy "auth_write_kv"        on public.app_kv         for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
