-- Newsletters: sent campaign metadata
create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);

alter table public.newsletters enable row level security;

-- Only service_role can access newsletters
create policy "Service role full access"
  on public.newsletters
  for all
  to service_role
  using (true)
  with check (true);
