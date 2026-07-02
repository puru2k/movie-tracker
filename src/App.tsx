import { useEffect, useMemo, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useAppStore } from "./store/useAppStore";
import { tabLabel } from "./types";
import { Sidebar } from "./components/Sidebar";
import { MovieCard } from "./components/MovieCard";
import { MovieListItem } from "./components/MovieListItem";
import { SearchModal } from "./components/SearchModal";
import { MovieDetail } from "./components/MovieDetail";
import { SettingsModal } from "./components/SettingsModal";
import { StatsView } from "./components/StatsView";
import { DiscoverView } from "./components/DiscoverView";
import { RecommendationsView } from "./components/RecommendationsView";
import { PersonModal } from "./components/PersonModal";
import { AdvancedSearchModal } from "./components/AdvancedSearchModal";
import { AuthGate } from "./components/AuthGate";
import {
  FilmIcon,
  SearchIcon,
  PlusIcon,
  CloseIcon,
  LayoutGridIcon,
  ListIcon,
} from "./components/Icons";
import type { GridSize } from "./types";
import { runPosterCache } from "./lib/posterCache";
import { MOVIE_QUOTES } from "./lib/quotes";

const IN_BROWSER = !isTauri();

const EMPTY_COPY: Record<string, string> = {
  to_watch: "Movies you plan to watch will show up here.",
  watching: "Movies you're currently watching will show up here.",
  watched: "Movies you've finished will show up here.",
  dropped: "Movies you stopped watching will show up here.",
  favorites: "Mark movies with the heart to collect favorites here.",
};

export default function App() {
  const init = useAppStore((s) => s.init);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const movies = useAppStore((s) => s.movies);
  const view = useAppStore((s) => s.view);
  const activeTab = useAppStore((s) => s.activeTab);
  const openSearch = useAppStore((s) => s.openSearch);
  const selectMovie = useAppStore((s) => s.selectMovie);
  const refresh = useAppStore((s) => s.refresh);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const advancedOpen = useAppStore((s) => s.advancedOpen);
  const cloud = useAppStore((s) => s.cloud);
  const needsAuth = useAppStore((s) => s.needsAuth);
  const layout = useAppStore((s) => s.layout);
  const gridSize = useAppStore((s) => s.gridSize);
  const setLayout = useAppStore((s) => s.setLayout);
  const setGridSize = useAppStore((s) => s.setGridSize);

  const [filter, setFilter] = useState("");
  const isLibrary = view === "library";
  const isInsights = view === "insights";
  const isDiscover = view === "discover";
  const isRecommend = view === "recommend";

  useEffect(() => {
    void init();
  }, [init]);

  // Best-effort offline poster caching: download any uncached posters, then
  // refresh so the cached (offline-ready) versions are used. Never throws.
  useEffect(() => {
    if (loading || movies.length === 0) return;
    let cancelled = false;
    void runPosterCache().then((cached) => {
      if (cached && !cancelled) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [loading, movies.length, refresh]);

  const inTab = useMemo(
    () =>
      activeTab === "favorites"
        ? movies.filter((m) => m.favorite === 1)
        : movies.filter((m) => m.status === activeTab),
    [movies, activeTab],
  );

  const gridClass =
    gridSize === "small"
      ? "grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-4"
      : gridSize === "large"
        ? "grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-6"
        : "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5";

  // A fresh quote each time you land on an empty tab.
  const emptyQuote = useMemo(
    () => MOVIE_QUOTES[Math.floor(Math.random() * MOVIE_QUOTES.length)],
    [activeTab],
  );

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return inTab;
    return inTab.filter((m) => {
      const haystack = [
        m.title,
        m.director ?? "",
        m.platform ?? "",
        ...m.tags,
        ...m.genres,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inTab, filter]);

  if (cloud && needsAuth) return <AuthGate />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {IN_BROWSER && !cloud && (
        <div className="shrink-0 border-b border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-center text-[11px] text-amber-300/90">
          Preview mode — data is not saved in the browser. Open the desktop app to store your
          library.
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
            sidebarCollapsed ? "w-0" : "w-56"
          }`}
        >
          <Sidebar />
        </div>

        <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                title="Show sidebar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-b from-brand to-brand-strong text-white shadow-sm transition hover:brightness-110"
              >
                <FilmIcon width={16} height={16} />
              </button>
            )}
            <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-white/95">
              {isInsights
                ? "Statistics"
                : isDiscover
                  ? "Discover"
                  : isRecommend
                    ? "For You"
                    : tabLabel(activeTab)}
            </h1>
            <p className="text-[11px] text-ink-600">
              {isInsights ? (
                `Your viewing habits across ${movies.length} ${
                  movies.length === 1 ? "movie" : "movies"
                }`
              ) : isDiscover ? (
                "Browse what's trending and popular on TMDB"
              ) : isRecommend ? (
                "Personalized picks based on your taste"
              ) : (
                <>
                  {visible.length} {visible.length === 1 ? "movie" : "movies"}
                  {filter.trim() && ` of ${inTab.length}`}
                </>
              )}
            </p>
            </div>
          </div>

          <div className={`flex shrink-0 items-center gap-2 ${isLibrary ? "" : "hidden"}`}>
            <div className="relative">
              <SearchIcon
                width={14}
                height={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600"
              />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search your library"
                className="w-56 rounded-md bg-white/[0.06] py-1.5 pl-8 pr-7 text-[13px] text-white outline-none ring-1 ring-white/[0.04] transition placeholder:text-ink-600 focus:w-64 focus:bg-white/[0.09] focus:ring-2 focus:ring-brand/70"
              />
              {filter && (
                <button
                  onClick={() => setFilter("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-600 transition hover:bg-white/10 hover:text-white"
                >
                  <CloseIcon width={13} height={13} />
                </button>
              )}
            </div>

            <div className="inline-flex items-center rounded-md bg-white/[0.06] p-0.5 ring-1 ring-white/[0.04]">
              <button
                onClick={() => setLayout("grid")}
                title="Grid view"
                aria-label="Grid view"
                className={`flex h-7 w-7 items-center justify-center rounded transition ${
                  layout === "grid" ? "bg-white/15 text-white" : "text-ink-600 hover:text-white"
                }`}
              >
                <LayoutGridIcon width={15} height={15} />
              </button>
              <button
                onClick={() => setLayout("list")}
                title="List view"
                aria-label="List view"
                className={`flex h-7 w-7 items-center justify-center rounded transition ${
                  layout === "list" ? "bg-white/15 text-white" : "text-ink-600 hover:text-white"
                }`}
              >
                <ListIcon width={15} height={15} />
              </button>
            </div>

            {layout === "grid" && (
              <select
                value={gridSize}
                onChange={(e) => setGridSize(e.target.value as GridSize)}
                title="Grid density"
                aria-label="Grid density"
                className="h-8 rounded-md bg-white/[0.06] px-2 text-[12px] text-white/85 outline-none ring-1 ring-white/[0.04] transition hover:bg-white/[0.09] focus:ring-2 focus:ring-brand/70 [color-scheme:dark]"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            )}

            <button
              onClick={openSearch}
              title="Add a movie"
              aria-label="Add a movie"
              className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-brand-strong active:scale-[0.98]"
            >
              <PlusIcon width={15} height={15} strokeWidth={2.25} />
              Add
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-600">
              Loading your library…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-400">
              {error}
            </div>
          ) : isInsights ? (
            <StatsView />
          ) : isDiscover ? (
            <DiscoverView />
          ) : isRecommend ? (
            <RecommendationsView />
          ) : visible.length === 0 && filter.trim() ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-ink-600">
                <SearchIcon width={26} height={26} />
              </span>
              <p className="text-[13px] font-medium text-white/80">
                No results for “{filter.trim()}”
              </p>
              <button
                onClick={() => setFilter("")}
                className="rounded-md bg-white/[0.08] px-3.5 py-1.5 text-[13px] text-white/90 transition hover:bg-white/[0.12]"
              >
                Clear search
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-ink-600">
                <FilmIcon width={28} height={28} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-white/85">
                  No movies in {tabLabel(activeTab)}
                </p>
                <p className="mt-1 text-[12px] text-ink-600">{EMPTY_COPY[activeTab]}</p>
              </div>
              <button
                onClick={openSearch}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-brand-strong"
              >
                <PlusIcon width={15} height={15} strokeWidth={2.25} />
                Add a movie
              </button>
              <figure className="mt-4 max-w-sm">
                <blockquote className="font-serif text-[13px] italic leading-snug text-white/55">
                  <span className="text-ink-600">“</span>
                  {emptyQuote.quote}
                  <span className="text-ink-600">”</span>
                </blockquote>
                <figcaption className="mt-1 text-[11px] text-ink-600">
                  {emptyQuote.movie} · {emptyQuote.year}
                </figcaption>
              </figure>
            </div>
          ) : layout === "list" ? (
            <div className="flex flex-col gap-2">
              {visible.map((movie) => (
                <MovieListItem
                  key={movie.tmdb_id}
                  movie={movie}
                  onClick={() => selectMovie(movie.tmdb_id)}
                />
              ))}
            </div>
          ) : (
            <div className={gridClass}>
              {visible.map((movie) => (
                <MovieCard
                  key={movie.tmdb_id}
                  movie={movie}
                  onClick={() => selectMovie(movie.tmdb_id)}
                />
              ))}
            </div>
          )}
        </div>
        </main>
      </div>

      <SearchModal />
      <MovieDetail />
      <PersonModal />
      {advancedOpen && <AdvancedSearchModal />}
      <SettingsModal />
    </div>
  );
}
