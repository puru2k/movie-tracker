# Movie Tracker

**🎬 Live web app: [puru2k.github.io/movie-tracker](https://puru2k.github.io/movie-tracker/)** — no install, no sign-up required (browse as a guest, or create an account to sync across devices).

A movie tracking web app built with React + TypeScript + Vite. Search films, track what you're watching, rate them, log watch dates, and dig into your stats. Use it instantly as a guest (saved in your browser) or create an account for cloud sync backed by [Supabase](https://supabase.com) (Postgres + Auth + Row-Level Security).

## Features

- **Movie search & metadata** — powered by [TMDB](https://www.themoviedb.org/). Auto-fills titles, posters, release dates, runtime, genres, director, and top cast.
- **Watch status tracking** — organize movies into **To Watch**, **Watching**, **Watched**, **Dropped**, and **Favorites**.
- **Personal ratings** — Letterboxd-style 5-star rating with half-star precision.
- **Watch-date logging** — record one or more dates you watched a film (or leave it unknown).
- **Reviews, tags, platforms & rewatch counts** — capture notes, spoiler-tagged reviews, custom tags, where you watched, and how many times.
- **Discover & advanced search** — trending/popular rows, genre browsing, and rich filters (genre, year, rating, runtime, language).
- **Stats & achievements** — charts, a watch heatmap, achievements, and yearly/monthly challenges.
- **Import / export** — back up to CSV or import a Letterboxd export; titles are matched and enriched via TMDB.
- **Accounts** — sign in for per-user cloud storage, with password reset and email confirmation. Or stay a guest — your library is saved in the browser.
- **Responsive** — works great on desktop and touch/mobile.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

## Quick start

```bash
npm install
cp .env.example .env   # fill in your keys (see below)
npm run dev            # local dev server (http://localhost:5173)
npm run build          # static production build → dist/
```

Without any env vars the app still runs in **guest mode** (library saved in the browser). Add the env vars below to enable TMDB metadata and cloud accounts.

## Configuration

Copy `.env.example` to `.env` and fill in:

```dotenv
# Enables accounts + per-user cloud storage (leave blank for guest-only)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Shared TMDB API key (v3 auth) so users don't need their own
VITE_TMDB_API_KEY=your-tmdb-v3-api-key
```

> The anon key is safe to ship in a frontend (RLS enforces per-user access). The TMDB v3 key is read-only and embedded in the bundle by design. A user can also set a personal TMDB key in **Settings** (stored in their browser) if none is configured at build time.

### Getting a TMDB API key (free)

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings → API** and request an API key (choose "Developer").
3. Copy the **API Key (v3 auth)** value into `VITE_TMDB_API_KEY`.

### Setting up Supabase (accounts)

1. Sign up at [supabase.com](https://supabase.com) and create a project.
2. In the **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). This creates the `movies` table and Row-Level Security policies so users can only see their own rows.
3. Under **Authentication → Providers**, keep Email enabled. To email users a confirmation and password-reset links, make sure email is configured (Supabase's built-in email works for testing; add SMTP for production volume).
4. Under **Authentication → URL Configuration**, add your site URL (e.g. your Pages URL) as a **Site URL** and **Redirect URL** so confirmation and password-reset links return to the app.
5. From **Settings → API**, copy the **Project URL** and the **anon public** key into `.env`.

**Email notifications & password reset:** on sign-up, Supabase emails a confirmation link (unless you disable "Confirm email"). The sign-in screen has **Forgot password?** (sends a reset link) and **Resend confirmation**. Following a reset link returns to the app in "set a new password" mode.

## Deploy

`dist/` is a static bundle — host it anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Set the three `VITE_*` variables in your host's environment and run `npm run build` there. There's no server to manage; Supabase is the backend.

**This repo auto-deploys to GitHub Pages.** A push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the bundle and publishes it to <https://puru2k.github.io/movie-tracker/>. The three `VITE_*` values are stored as repository **Secrets** (Settings → Secrets and variables → Actions) and injected at build time; `BASE_PATH=/movie-tracker/` is set so assets resolve under the project sub-path.

> If you fork this, add your own `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TMDB_API_KEY` secrets, enable Pages (Settings → Pages → Source: **GitHub Actions**), and add your Pages URL to Supabase → **Authentication → URL Configuration**.

## Project structure

```
src/                       React + TypeScript frontend
  components/              UI components (cards, modals, sidebar, auth, stats)
  lib/
    repo.ts               Data-layer selector: cloud (Supabase) or local (guest)
    cloudDb.ts            Supabase data layer (per-user, RLS)
    localDb.ts            Guest data layer (localStorage)
    supabase.ts           Supabase client + session helpers
    tmdb.ts               TMDB API client (search, details, images, discover)
    settings.ts           Per-device settings (API key override, display prefs)
    porting.ts            CSV import/export
    openExternal.ts       Safe external-link helper
  store/useAppStore.ts    Zustand app state + auth
  types.ts                Shared types
supabase/schema.sql       Cloud table + Row-Level Security policies
```

## Where your data lives

- **Guest:** your library is stored in the browser's `localStorage` on this device only.
- **Signed in:** your library lives in your Supabase project (`movies` table, scoped to your account by Row-Level Security); the auth session is kept in the browser.

## Tech stack

- [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query)
- Storage & auth: [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security) with a `localStorage` guest fallback
