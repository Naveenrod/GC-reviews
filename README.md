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
2. Open the **SQL Editor** and run the contents of [`supabase/migration.sql`](supabase/migration.sql). This creates all tables, RLS policies, triggers, and seeds the Gold Coast / Brisbane locations + categories.
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
PHOTO_MONTHLY_BUDGET=900            # optional — max Google photo fetches per month (default 900)
```
Also run [`supabase/migration_photos.sql`](supabase/migration_photos.sql) in the SQL editor to enable the photo pipeline below.

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

## Photos (free-first pipeline)
Each venue image is picked from the first source that works, so the site keeps
looking good even when Google's free photo quota runs out:

1. **Venue website image** (`og_image_url`) — the venue's own hero image, read from
   its website's `og:image` tag on import, on the monthly cron, or via
   **Admin → Find website photos**. Free.
2. **Member photos** — reviewers can attach up to 4 photos. They're resized in the
   browser and stored in the public `review-photos` Supabase Storage bucket. Free tier: 1 GB.
3. **Google Places photo** — only the photo *name* is stored. Images are served
   through `/api/photo/...`, which keeps the API key on the server, is cached by the
   CDN for 30 days, and stops at `PHOTO_MONTHLY_BUDGET` fetches per month.
4. **Designed placeholder** — `/api/placeholder` draws a gradient card with the
   category icon and the venue's initials.

If an image fails to load in the browser, it falls through to the next source automatically.
Location pages and home-page location cards use a free Unsplash banner when
`UNSPLASH_ACCESS_KEY` is set. Stock photos are never used for individual venues.

Existing venues imported before this change still work: legacy Google URLs are
recognised and routed through the proxy, so the key is no longer exposed.
