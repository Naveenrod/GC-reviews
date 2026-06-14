-- GC Reviews — social auto-posting tables
-- Run this in the Supabase SQL editor after the main migration.sql.

-- Key/value store for integration secrets (Instagram token, account id, etc.).
-- Locked down: RLS on, NO public policies → only the service role (server) can read/write.
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
-- (intentionally no policies — service role bypasses RLS; anon/auth get nothing)

-- Log of everything we post to social platforms (prevents reposting, shows history).
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'instagram',
  venue_id uuid references public.venues(id) on delete set null,
  guide_slug text,
  caption text,
  image_url text,
  status text not null default 'pending', -- pending | posted | failed
  external_id text,                       -- the IG media id once published
  error text,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists social_posts_venue_idx on public.social_posts(venue_id);
create index if not exists social_posts_status_idx on public.social_posts(status);

alter table public.social_posts enable row level security;

-- Admins can read the post history in the dashboard. Writes happen via service role only.
drop policy if exists "admin read social posts" on public.social_posts;
create policy "admin read social posts" on public.social_posts
  for select using (public.is_admin());
