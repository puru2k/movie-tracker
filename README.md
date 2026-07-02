# Movie Tracker

A movie tracking app that runs two ways from one codebase:

- **Desktop** (macOS, Windows, Linux) — Tauri v2 (Rust core) + React + TypeScript, with a local SQLite database so your library works fully offline.
- **Web** — the same React UI deployed as a static site, with **user accounts** and per-user cloud storage backed by [Supabase](https://supabase.com) (Postgres + Auth + Row-Level Security).

The app auto-detects its environment: inside Tauri it uses local SQLite; in the browser (with Supabase configured) it uses cloud accounts.

## Features (MVP)

- **Movie search & metadata** — powered by [TMDB](https://www.themoviedb.org/). Auto-fills titles, posters, release dates, runtime, genres, director, and top cast.
- **Watch status tracking** — organize movies into **To Watch**, **Watching**, and **Watched** via sidebar tabs.
- **Personal ratings** — Letterboxd-style 5-star rating with half-star precision.
- **Watch-date logging** — a calendar picker to record the exact day you finished a movie (auto-suggests today when you mark a film as Watched).
- **Local data storage** — everything is stored on-device in SQLite; no account or internet needed after metadata is fetched.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [Rust](https://www.rust-lang.org/tools/install) (stable) with Cargo
- Platform build tools for Tauri — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/):
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Windows:** Microsoft C++ Build Tools + WebView2 (preinstalled on Win 10/11)
  - **Linux:** `webkit2gtk`, `libgtk-3-dev`, and related packages

## Getting a TMDB API key (free)

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings → API** and request an API key (choose "Developer").
3. Copy the **API Key (v3 auth)** value.
4. Launch the app, open **Settings** (bottom of the sidebar), paste the key, and click **Save key**. It is validated and stored locally on your device.

## Development

```bash
npm install
npm run tauri dev
```

This launches the Vite dev server and opens the native app window with hot-reload.

## Building distributable bundles

```bash
npm run tauri build
```

Bundles are written to `src-tauri/target/release/bundle/`:

- **macOS:** `.app` and `.dmg`
- **Windows:** `.msi` / `.exe` (NSIS)
- **Linux:** `.deb`, `.rpm`, and `.AppImage`

> Note: you can only build a platform's bundle on that platform (e.g. build the Windows installer on Windows).

## Web version (cloud, multi-user accounts)

The web build serves the same UI as a static site. Data and sign-in are handled by Supabase, so each account gets its own private library.

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a project.
2. In the **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). This creates the `movies` table and Row-Level Security policies so users can only see their own rows.
3. (Optional) Under **Authentication → Providers**, keep Email enabled. You can turn off "Confirm email" for quick local testing.
4. From **Settings → API**, copy the **Project URL** and the **anon public** key.

### 2. Configure env vars

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_TMDB_API_KEY=your-tmdb-v3-api-key   # shared key so web users don't need their own
```

> The anon key is safe to ship in a frontend (RLS enforces per-user access). The TMDB v3 key is read-only and embedded in the bundle by design so users don't have to bring their own.

### 3. Run / build the web app

```bash
npm install
npm run dev     # local dev server (http://localhost:1420)
npm run build   # static production build → dist/
```

Sign up with an email + password on first load; your library is then stored in your account.

### 4. Deploy

`dist/` is a static bundle — host it anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Set the three `VITE_*` variables in your host's environment and run `npm run build` there. No server to manage; Supabase is the backend.

## Project structure

```
src/                     React + TypeScript frontend
  components/            UI components (cards, modals, sidebar, rating)
  lib/
    db.ts                Local SQLite data layer (tauri-plugin-sql) — desktop
    cloudDb.ts           Supabase data layer (same surface as db.ts) — web
    repo.ts              Picks db.ts (desktop) or cloudDb.ts (web) at runtime
    supabase.ts          Supabase client + session helpers
    tmdb.ts              TMDB API client (search, details, images)
    settings.ts          Local API-key storage (tauri-plugin-store)
  store/useAppStore.ts   Zustand app state (+ auth on web)
  components/AuthGate.tsx  Web sign-in / sign-up screen
  types.ts               Shared types
supabase/schema.sql      Cloud table + Row-Level Security policies
src-tauri/               Rust / Tauri backend
  src/lib.rs             Plugin registration + SQLite migration
  capabilities/          Permission capabilities
  tauri.conf.json        App/window/bundle config
```

## Where your data lives

- **Desktop:** movie library in SQLite (`movietracker.db` in the app data directory); TMDB API key in `settings.json` in the app data directory.
- **Web:** movie library in your Supabase project (`movies` table, scoped to your account by Row-Level Security); auth session in the browser; TMDB key comes from the shared build-time env var.

## Tech stack

- [Tauri v2](https://tauri.app/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query)
- Desktop storage: [`tauri-plugin-sql`](https://github.com/tauri-apps/plugins-workspace) (SQLite) and [`tauri-plugin-store`](https://github.com/tauri-apps/plugins-workspace)
- Web storage & auth: [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security)
