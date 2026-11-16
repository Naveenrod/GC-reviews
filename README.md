# GC Reviews

Discover, review and book the best restaurants, hotels and entertainment across the **Gold Coast** and **Brisbane** — all the reviews in one place. Built to expand across Australia.

## Stack
- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- Google Places API (listing data)

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run, in order:
   - [`supabase/migration.sql`](supabase/migration.sql): all tables, RLS policies, triggers, and the Gold Coast / Brisbane seed.
   - [`supabase/migration_social.sql`](supabase/migration_social.sql): Instagram auto-posting tables.
   - [`supabase/migration_photos.sql`](supabase/migration_photos.sql): photo pipeline and the monthly Google budget counter.
   - [`supabase/migration_legal.sql`](supabase/migration_legal.sql): review reports (complaints mechanism), Google content bookkeeping, and separation of Google's rating from member ratings.
3. Enable **Google** as an auth provider: Authentication → Providers → Google (add your Google OAuth client ID/secret).
4. Add the redirect URL `http://localhost:3000/auth/callback` (and your production URL) under Authentication → URL Configuration.

### 2. Environment
Edit `.env.local` and replace the placeholders with your real values:
```
NEXT_PUBLIC_SUPABASE_URL=...        # Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Settings → API → anon public key
SUPABASE_SERVICE_ROLE_KEY=...       # Settings → API → service_role key
GOOGLE_PLACES_API_KEY=...           # already filled in
UNSPLASH_ACCESS_KEY=...             # optional — free location banners (unsplash.com/developers)
GOOGLE_SEARCH_MONTHLY_LIMIT=900     # optional — admin import stops here, inside Google's 1,000 free
# NEXT_PUBLIC_GOOGLE_PHOTOS=on      # NOT recommended — turns paid Google photos back on
# PHOTO_MONTHLY_BUDGET=900          # only used when Google photos are on
GOOGLE_DETAILS_MONTHLY_LIMIT=900    # optional — daily Google content refresh stops here, inside the free allowance
CRON_SECRET=...                     # any long random string; Vercel sends it to cron routes
NEXT_PUBLIC_SITE_URL=...            # production URL, e.g. https://example.com
NEXT_PUBLIC_LEGAL_ENTITY=...        # shown in Terms/Privacy, e.g. "Example Pty Ltd (ABN 12 345 678 901) trading as GC Reviews"
NEXT_PUBLIC_CONTACT_EMAIL=...       # legal/privacy/takedown contact; pages fall back to the Report form if unset
```

### 3. Run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Making yourself an admin
After signing up once, run this in the Supabase SQL editor:
```sql
update public.profiles set is_admin = true where id = (
  select id from auth.users where email = 'you@example.com'
);
```
Then visit `/admin` → **Import venues** to pull real Gold Coast / Brisbane listings from Google Places.

## How it works
- **Listings** come from Google Places via the admin import tool (`/admin/import`).
- **Booking** uses each venue's `booking_url` (defaults to its website; editable in `/admin/venues`) — the "Book Now" button links straight out.
- **Reviews** require sign-in (email or Google). Average ratings recompute automatically via a Postgres trigger.
- **Expansion**: add a row to the `locations` table and re-run the import for a new city.

## Google costs
The public site makes **no** Google API calls. Google is used in two places, both
capped inside Google's free allowance:

- **Admin import**: **Fetch from Google** on the import page stops at
  `GOOGLE_SEARCH_MONTHLY_LIMIT` Text Search requests a month.
- **Daily refresh cron**: `/api/cron/refresh-venues` re-fetches Place Details for
  venues whose Google content is older than 25 days, oldest first, and stops at
  `GOOGLE_DETAILS_MONTHLY_LIMIT` requests a month. This is what keeps the site
  inside the Google Maps Platform 30-day caching limit (see below).

The map on venue pages is Google's free keyless embed.

## Legal and compliance
- **Pages:** `/terms`, `/privacy`, `/review-policy`, `/report`. Update `POLICIES_UPDATED` in `lib/site.ts` when you change them. Fill in `NEXT_PUBLIC_LEGAL_ENTITY` and `NEXT_PUBLIC_CONTACT_EMAIL`.
- **Reports:** every review has a "Report this review" link. Reports land in `review_reports` with a 7-day `due_at` and are worked from `/admin/reports`. The procedure is in [`docs/TAKEDOWN-PROCEDURE.md`](docs/TAKEDOWN-PROCEDURE.md). Check the queue daily.
- **Google content:** place IDs are stored permanently. Everything else from Google (name, address, phone, website, coordinates, summary, photo names, Google rating) is a cache. The daily cron refreshes it within the monthly budget and purges the summary, photos and Google rating from any venue older than 30 days that could not be refreshed; the listing stays, and the content comes back when the refresh reaches it. The first run after `migration_legal.sql` will clear Google content on venues imported more than 30 days ago that the day's budget cannot cover. "Powered by Google" attribution and per-photo author credits render wherever that content appears.
- **Ratings:** `avg_rating` is member reviews only. Google's rating is stored in `google_rating` and shown separately, labelled "on Google". Never seed one from the other.
- **Age:** members must be 16 or older to post, matching Instagram's Australian minimum.
- **Crons:** Vercel's Hobby plan allows two cron jobs, both of which are used (venue refresh, Instagram). Upgrade before adding more.

## Photos (free-first pipeline)
Each venue image is picked from the first source that works:

1. **Venue website image** (`og_image_url`) — the venue's own photo, read from its
   website (share image, schema.org data, or the first large photo) on import, on
   the monthly cron, or via **Admin → Find & copy photos**. Free. Running it again
   retries venues that still have no photo.
   Found photos are **copied onto our own storage** (Supabase bucket `venue-photos`,
   created automatically, resized to max 1200px) and served from `/api/img/...`, which
   Vercel's CDN caches for a year. So images keep working if the venue's site changes,
   and Supabase's free bandwidth is only touched on a cache miss.
2. **Member photos** — reviewers can attach up to 4 photos. They're resized in the
   browser and stored in the public `review-photos` Supabase Storage bucket. Free tier: 1 GB.
3. **Google Places photo** — off by default because it is paid. Only the photo
   *name* is stored; set `NEXT_PUBLIC_GOOGLE_PHOTOS=on` to serve them through
   `/api/photo/...` (key hidden, CDN-cached, capped at `PHOTO_MONTHLY_BUDGET`).
4. **Designed placeholder** — `/api/placeholder` draws a gradient card with the
   category icon and the venue's initials.

If an image fails to load in the browser, it falls through to the next source automatically.
Location pages and home-page location cards use a free Unsplash banner when
`UNSPLASH_ACCESS_KEY` is set. Stock photos are never used for individual venues.

Existing venues imported before this change still work: legacy Google URLs are
recognised and routed through the proxy, so the key is no longer exposed.
