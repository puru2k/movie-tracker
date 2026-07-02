# Movie Tracker

A cross-platform (macOS, Windows, Linux) desktop app for tracking the movies you want to watch, are watching, and have watched. Built with Tauri v2 (Rust core) + React + TypeScript, with a local SQLite database so your library works fully offline.

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

## Project structure

```
src/                     React + TypeScript frontend
  components/            UI components (cards, modals, sidebar, rating)
  lib/
    db.ts                SQLite data layer (typed CRUD over tauri-plugin-sql)
    tmdb.ts              TMDB API client (search, details, images)
    settings.ts          Local API-key storage (tauri-plugin-store)
  store/useAppStore.ts   Zustand app state
  types.ts               Shared types
src-tauri/               Rust / Tauri backend
  src/lib.rs             Plugin registration + SQLite migration
  capabilities/          Permission capabilities
  tauri.conf.json        App/window/bundle config
```

## Where your data lives

- Movie library (SQLite): the app's data directory as `movietracker.db`
- TMDB API key (encrypted-at-rest by the OS keystore is not used; stored as `settings.json` in the app data directory)

## Tech stack

- [Tauri v2](https://tauri.app/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query)
- [`tauri-plugin-sql`](https://github.com/tauri-apps/plugins-workspace) (SQLite) and [`tauri-plugin-store`](https://github.com/tauri-apps/plugins-workspace)

## Roadmap (not yet implemented)

Custom lists & tags, review/notes, analytics dashboard, streaming-platform tags, rewatch counter, AI recommendations, calendar sync, advanced statistics, screenshot/audio movie identification, and CSV import/export.
