-- Subscribers table for newsletter signups
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now()
);

-- RLS: allow anonymous INSERT (subscribe), no SELECT for public
alter table public.subscribers enable row level security;

-- Anyone can subscribe
create policy "Allow anonymous insert"
  on public.subscribers
  for insert
  to anon
  with check (true);

-- Service role can do everything (for edge functions, admin)
create policy "Service role full access"
  on public.subscribers
  for all
  to service_role
  using (true)
  with check (true);
