# Rentle

A daily apartment value comparison game. Every day, two real apartments from major US cities are shown side by side. Vote on which is better value for money. After voting, the percentage split is revealed and you get ✅ if you picked the majority or ❌ if you picked the minority. Streak tracking. Shareable result card.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres + RLS)
- **Tailwind CSS**
- **Vercel-ready**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Run the schema

In the Supabase SQL editor, run the contents of `supabase/schema.sql` to create the tables and RLS policies.

### 4. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase project URL and anon key (found in Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Seed the database

```bash
npm run seed
```

This inserts 5 sample apartments (NYC, LA, Chicago, Austin) and schedules 3 daily pairs (today, tomorrow, day after).

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | The daily game — vote on today's pair |
| `/admin` | Admin panel — add apartments, schedule pairs |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/today` | Today's pair with vote counts |
| `POST` | `/api/vote` | Cast a vote `{ pair_id, choice: "A"\|"B" }` |
| `GET` | `/api/pairs` | All daily pairs (admin) |
| `POST` | `/api/pairs` | Schedule a new pair (admin) |
| `GET` | `/api/apartments` | All apartments (admin) |
| `POST` | `/api/apartments` | Add a new apartment (admin) |

## Deploy to Vercel

```bash
npx vercel
```

Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.

## Adding New Content

Use the admin panel at `/admin` to:
1. Add new apartments with photos (use any image hosting — Unsplash works well)
2. Schedule daily pairs by picking a date and two apartments

## Local Storage

Vote state is persisted in `localStorage` keyed by date, so refreshing keeps your result. Streak is tracked across days.

