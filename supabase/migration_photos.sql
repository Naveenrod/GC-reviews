-- GC Reviews — photo pipeline (website og:image, member uploads, Google budget)
-- Run after migration.sql (and migration_social.sql if you use it).

-- ============ VENUE COLUMNS ============
alter table public.venues
  add column if not exists og_image_url text,          -- the venue's own website hero image
  add column if not exists og_checked_at timestamptz,  -- when we last looked for one
  add column if not exists community_cover_url text;   -- first member-uploaded photo

-- ============ MEMBER PHOTO UPLOADS (Supabase Storage) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Anyone can view; signed-in members write only inside their own folder: {venue_id}/{user_id}/...
drop policy if exists "public read review photos" on storage.objects;
create policy "public read review photos" on storage.objects
  for select using (bucket_id = 'review-photos');

drop policy if exists "members upload own review photos" on storage.objects;
create policy "members upload own review photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'review-photos' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists "members delete own review photos" on storage.objects;
create policy "members delete own review photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'review-photos' and (storage.foldername(name))[2] = auth.uid()::text);

-- Keep venues.community_cover_url pointing at a member photo when one exists.
create or replace function public.sync_community_cover()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(new.venue_id, old.venue_id);
begin
  update public.venues v set community_cover_url = (
    select r.photos[1] from public.reviews r
    where r.venue_id = v_id and coalesce(array_length(r.photos, 1), 0) > 0
    order by r.created_at desc limit 1
  ) where v.id = v_id;
  return null;
end;
$$;

drop trigger if exists on_review_photos_change on public.reviews;
create trigger on_review_photos_change
  after insert or update of photos or delete on public.reviews
  for each row execute function public.sync_community_cover();

-- ============ GOOGLE PHOTO BUDGET COUNTER ============
-- Atomic monthly counter stored in app_config (created by migration_social.sql).
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;

create or replace function public.bump_counter(p_key text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.app_config (key, value) values (p_key, '1')
  on conflict (key) do update
    set value = (coalesce(public.app_config.value, '0')::integer + 1)::text,
        updated_at = now()
  returning value::integer into n;
  return n;
end;
$$;
revoke all on function public.bump_counter(text) from public, anon, authenticated;
