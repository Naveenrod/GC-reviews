-- GC Reviews — full schema, RLS, triggers, seed
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ============ TABLES ============

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  slug text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  address text,
  phone text,
  website text,
  booking_url text,
  description text,
  cover_image_url text,
  photos text[] default '{}',
  lat double precision,
  lng double precision,
  avg_rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (location_id, category_id, slug)
);

create index if not exists venues_category_idx on public.venues(category_id);
create index if not exists venues_location_idx on public.venues(location_id);
create index if not exists venues_search_idx on public.venues using gin (to_tsvector('english', name || ' ' || coalesce(description,'') || ' ' || coalesce(address,'')));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  review_count integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  photos text[] default '{}',
  created_at timestamptz not null default now(),
  unique (venue_id, user_id)
);

create index if not exists reviews_venue_idx on public.reviews(venue_id);
create index if not exists reviews_user_idx on public.reviews(user_id);

-- ============ TRIGGERS ============

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recompute venue avg_rating / review_count + profile review_count when reviews change
create or replace function public.recompute_venue_stats()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(new.venue_id, old.venue_id);
  u_id uuid := coalesce(new.user_id, old.user_id);
begin
  update public.venues v set
    avg_rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where venue_id = v_id), 0),
    review_count = (select count(*) from public.reviews where venue_id = v_id)
  where v.id = v_id;

  update public.profiles p set
    review_count = (select count(*) from public.reviews where user_id = u_id)
  where p.id = u_id;

  return null;
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_venue_stats();

-- ============ ROW LEVEL SECURITY ============

alter table public.locations  enable row level security;
alter table public.categories enable row level security;
alter table public.venues     enable row level security;
alter table public.profiles   enable row level security;
alter table public.reviews    enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Public read for reference + venue data
drop policy if exists "read locations" on public.locations;
create policy "read locations" on public.locations for select using (true);

drop policy if exists "read categories" on public.categories;
create policy "read categories" on public.categories for select using (true);

drop policy if exists "read venues" on public.venues;
create policy "read venues" on public.venues for select using (true);

-- Only admins write reference + venues
drop policy if exists "admin write locations" on public.locations;
create policy "admin write locations" on public.locations for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write venues" on public.venues;
create policy "admin write venues" on public.venues for all using (public.is_admin()) with check (public.is_admin());

-- Profiles: public read, owner update
drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Reviews: public read, owner insert/update/delete; admins can delete (moderation)
drop policy if exists "read reviews" on public.reviews;
create policy "read reviews" on public.reviews for select using (true);

drop policy if exists "insert own review" on public.reviews;
create policy "insert own review" on public.reviews for insert with check (auth.uid() = user_id);

drop policy if exists "update own review" on public.reviews;
create policy "update own review" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own or admin review" on public.reviews;
create policy "delete own or admin review" on public.reviews for delete using (auth.uid() = user_id or public.is_admin());

-- ============ SEED reference data ============

insert into public.locations (name, slug) values
  ('Gold Coast', 'gold-coast'),
  ('Brisbane', 'brisbane')
on conflict (slug) do nothing;

insert into public.categories (name, slug, icon) values
  ('Restaurants', 'restaurants', 'utensils'),
  ('Hotels', 'hotels', 'bed'),
  ('Entertainment', 'entertainment', 'ticket'),
  ('Cafes', 'cafes', 'coffee'),
  ('Bars & Nightlife', 'bars', 'wine'),
  ('Things to Do', 'things-to-do', 'map-pin')
on conflict (slug) do nothing;
