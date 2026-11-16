-- GC Reviews — legal/compliance migration
-- Run this in the Supabase SQL editor after migration.sql and migration_social.sql.
--
-- 1. Separates Google's rating from member ratings (ACL: don't present one as the other).
-- 2. Tracks when Google Places content was last fetched so the refresh cron can keep it
--    inside Google's 30-day caching window and expire anything older.
-- 3. Stores per-photo author attributions required by the Places API policies.
-- 4. Adds review_reports: the complaints mechanism needed for the Queensland digital
--    intermediary defamation exemption (remove/block within 7 days of a valid complaint).

-- ============ VENUES: Google content bookkeeping ============

alter table public.venues
  add column if not exists google_rating numeric(2,1),
  add column if not exists photo_attributions jsonb not null default '[]'::jsonb,
  add column if not exists google_synced_at timestamptz;

create index if not exists venues_google_synced_idx on public.venues(google_synced_at);

-- Venues imported before this migration were fetched when they were created.
-- Stamp them with that date so the 30-day clock reflects reality.
update public.venues
   set google_synced_at = created_at
 where google_synced_at is null
   and google_place_id is not null;

-- Earlier imports seeded avg_rating with Google's rating. Member ratings must only
-- reflect member reviews, so clear any rating that has no member reviews behind it.
update public.venues
   set avg_rating = 0
 where review_count = 0
   and avg_rating <> 0;

-- ============ REVIEW REPORTS ============

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete set null,
  -- Snapshot of what was reported, so the record survives deletion of the review.
  review_snapshot jsonb,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_name text,
  reporter_email text not null,
  relationship text not null default 'other',       -- venue_owner | subject | member | other
  reason text not null,                             -- defamation | fake | privacy | abuse | conflict | other
  details text not null,
  page_url text,
  status text not null default 'open',              -- open | actioned | dismissed
  resolution text,                                  -- removed | edited | kept | no_review
  resolution_note text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  -- Seven calendar days from receipt: the window in which a digital intermediary must
  -- remove or block access to keep the Defamation Act exemption.
  due_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists review_reports_status_idx on public.review_reports(status, due_at);
create index if not exists review_reports_review_idx on public.review_reports(review_id);

alter table public.review_reports enable row level security;

-- Reports are created server-side (service role) via /api/report so anonymous people
-- can lodge one without an account. Admins read and resolve them in /admin/reports.
drop policy if exists "admin read reports" on public.review_reports;
create policy "admin read reports" on public.review_reports
  for select using (public.is_admin());

drop policy if exists "admin update reports" on public.review_reports;
create policy "admin update reports" on public.review_reports
  for update using (public.is_admin()) with check (public.is_admin());
