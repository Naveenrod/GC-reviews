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

## Notes
- Google Places photo URLs embed the API key. For production, restrict the key to the Places API + your domains, or add an image proxy route.
