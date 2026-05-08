# Franchise Matchmaker (No-Code Friendly Build)

This app is a browser-based starter for your setter team with:
- strict script-first workflow
- button-based qualifying questions
- hard financial/location matching
- daily broker lock (1 lead per broker per EST day)
- admin override toggle

## What You Need

1. A Supabase account (for shared memory across users)
2. Any static hosting (Vercel, Netlify, Cloudflare Pages, or even shared web hosting)

## Quick Setup

### 1) Create Supabase table

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists bookings (
  id bigint generated always as identity primary key,
  broker_name text not null,
  setter_name text,
  lead_city text,
  lead_state text,
  date_est text not null,
  created_at timestamptz not null default now()
);
```

### 2) Add Supabase keys

Open `app.js` and set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ADMIN_CODE` (change from default)

### 3) Run locally

Double-click `index.html` to open in your browser.

### 4) Host it

Upload all files in this folder to your static host.

## Day-to-Day Use

- Setter chooses `Setter`, enters their name, clicks `Start`.
- Reads script, clicks `Next`, answers all 6 qualifying questions.
- App returns matches and booking links.
- After setter manually books, click `Booked` next to selected broker.
- Broker is hidden from matches until midnight EST.

## Admin Use

- Choose `Admin`, enter admin code.
- Enable "Admin override" to include already-booked brokers.

## Notes

- Source of truth currently lives in `BROKERS` inside `app.js`.
- You can add/remove brokers by editing that array.
- If Supabase keys are empty, app falls back to local browser storage (single-device only).
