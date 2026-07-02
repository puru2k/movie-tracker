import { create } from "zustand";
import type {
  GridSize,
  LibraryLayout,
  LibraryTab,
  MovieView,
  TmdbMovieDetails,
  WatchStatus,
} from "../types";
import { isTauri } from "@tauri-apps/api/core";
import * as db from "../lib/repo";
import { useCloud } from "../lib/repo";
import { supabase } from "../lib/supabase";
import {
  getApiKey,
  getDisplayPrefs,
  setApiKey as persistApiKey,
  setDisplayPrefs,
} from "../lib/settings";

export type AppView = "library" | "insights" | "discover" | "recommend";

export interface PersonRef {
  name: string;
  role: "director" | "cast";
}

/** One step in the nested Movie ⇄ Person browsing history. */
export type NavEntry =
  | { kind: "movie"; id: number }
  | { kind: "person"; name: string; role: "director" | "cast" };

/** Derive the visible modal (selectedId / person) from the top of the stack. */
function navPatch(stack: NavEntry[]) {
  const top = stack[stack.length - 1];
  return {
    navStack: stack,
    selectedId: top?.kind === "movie" ? top.id : null,
    person: top?.kind === "person" ? { name: top.name, role: top.role } : null,
  };
}

interface AppState {
  // data
  movies: MovieView[];
  loading: boolean;
  error: string | null;

  // settings
  apiKey: string | null;
  settingsLoaded: boolean;

  // auth (web / cloud only)
  cloud: boolean;
  needsAuth: boolean;
  userEmail: string | null;
  authError: string | null;
  authBusy: boolean;

  // ui
  view: AppView;
  activeTab: LibraryTab;
  searchOpen: boolean;
  settingsOpen: boolean;
  selectedId: number | null;
  person: PersonRef | null;
  navStack: NavEntry[];
  sidebarCollapsed: boolean;
  advancedOpen: boolean;
  advancedGenreId: number | null;

  // display prefs
  layout: LibraryLayout;
  gridSize: GridSize;

  // lifecycle
  init: () => Promise<void>;
  refresh: () => Promise<void>;

  // settings actions
  saveApiKey: (key: string) => Promise<void>;

  // auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // ui actions
  setView: (view: AppView) => void;
  setActiveTab: (tab: LibraryTab) => void;
  openSearch: () => void;
  closeSearch: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  selectMovie: (id: number) => void;
  clearSelection: () => void;
  openPerson: (name: string, role: "director" | "cast") => void;
  closePerson: () => void;
  navBack: () => void;
  toggleSidebar: () => void;
  openAdvanced: (genreId?: number | null) => void;
  closeAdvanced: () => void;
  setLayout: (layout: LibraryLayout) => void;
  setGridSize: (size: GridSize) => void;

  // data mutations
  addMovie: (details: TmdbMovieDetails, status: WatchStatus) => Promise<void>;
  setStatus: (id: number, status: WatchStatus) => Promise<void>;
  setRating: (id: number, rating: number | null) => Promise<void>;
  setWatchDate: (id: number, date: string | null) => Promise<void>;
  setNotes: (id: number, notes: string | null) => Promise<void>;
  setRewatchCount: (id: number, count: number) => Promise<void>;
  setPlatform: (id: number, platform: string | null) => Promise<void>;
  setTags: (id: number, tags: string[]) => Promise<void>;
  setFavorite: (id: number, favorite: boolean) => Promise<void>;
  setWatchDates: (id: number, dates: string[]) => Promise<void>;
  setReview: (id: number, review: string | null) => Promise<void>;
  setSpoiler: (id: number, spoiler: boolean) => Promise<void>;
  removeMovie: (id: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  movies: [],
  loading: true,
  error: null,

  apiKey: null,
  settingsLoaded: false,

  cloud: useCloud,
  needsAuth: false,
  userEmail: null,
  authError: null,
  authBusy: false,

  view: "discover",
  activeTab: "to_watch",
  searchOpen: false,
  settingsOpen: false,
  selectedId: null,
  person: null,
  navStack: [],
  sidebarCollapsed: false,
  advancedOpen: false,
  advancedGenreId: null,

  layout: "grid",
  gridSize: "medium",

  init: async () => {
    try {
      const prefs = await getDisplayPrefs();
      // TMDB key: local store on desktop; shared build-time env on the web.
      const apiKey = isTauri()
        ? await getApiKey()
        : import.meta.env.VITE_TMDB_API_KEY ?? null;
      set({
        apiKey,
        layout: prefs.layout,
        gridSize: prefs.gridSize,
        settingsLoaded: true,
      });

      // Cloud (web) mode: gate on a signed-in Supabase session.
      if (useCloud && supabase) {
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            void db
              .listMovies()
              .then((movies) =>
                set((s) => ({
                  movies,
                  userEmail: session.user.email ?? null,
                  needsAuth: false,
                  error: null,
                  activeTab: movies.length ? movies[0].status : s.activeTab,
                })),
              )
              .catch((e) =>
                set({ error: e instanceof Error ? e.message : String(e) }),
              );
          } else {
            set({ movies: [], needsAuth: true, userEmail: null });
          }
        });

        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session) {
          const movies = await db.listMovies();
          set({
            movies,
            userEmail: session.user.email ?? null,
            needsAuth: false,
            activeTab: movies.length ? movies[0].status : "to_watch",
            loading: false,
          });
        } else {
          set({ needsAuth: true, loading: false });
        }
        return;
      }

      // Unconfigured web preview: no persistence, just browse.
      if (!isTauri()) {
        set({ movies: [], activeTab: "to_watch", loading: false });
        return;
      }

      // Desktop: local SQLite.
      const movies = await db.listMovies();
      set({
        movies,
        activeTab: movies.length ? movies[0].status : "to_watch",
        loading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
        loading: false,
        settingsLoaded: true,
      });
    }
  },

  refresh: async () => {
    const movies = await db.listMovies();
    set({ movies });
  },

  saveApiKey: async (key) => {
    await persistApiKey(key);
    set({ apiKey: key.trim() });
  },

  signIn: async (email, password) => {
    if (!supabase) return;
    set({ authBusy: true, authError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ authBusy: false, authError: error ? error.message : null });
  },

  signUp: async (email, password) => {
    if (!supabase) return;
    set({ authBusy: true, authError: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ authBusy: false, authError: error.message });
      return;
    }
    set({
      authBusy: false,
      authError: data.session
        ? null
        : "Account created — check your email to confirm, then sign in.",
    });
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ movies: [], needsAuth: true, userEmail: null });
  },

  setView: (view) => set({ view }),
  setActiveTab: (tab) => set({ activeTab: tab, view: "library" }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  selectMovie: (id) =>
    set((s) => navPatch([...s.navStack, { kind: "movie", id }])),
  clearSelection: () => set(navPatch([])),
  openPerson: (name, role) =>
    set((s) => navPatch([...s.navStack, { kind: "person", name, role }])),
  closePerson: () => set(navPatch([])),
  navBack: () => set((s) => navPatch(s.navStack.slice(0, -1))),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openAdvanced: (genreId = null) => set({ advancedOpen: true, advancedGenreId: genreId }),
  closeAdvanced: () => set({ advancedOpen: false, advancedGenreId: null }),
  setLayout: (layout) => {
    set({ layout });
    void setDisplayPrefs({ layout });
  },
  setGridSize: (gridSize) => {
    set({ gridSize });
    void setDisplayPrefs({ gridSize });
  },

  addMovie: async (details, status) => {
    await db.addMovie(details, status);
    await get().refresh();
  },

  setStatus: async (id, status) => {
    await db.updateStatus(id, status);
    await get().refresh();
  },

  setRating: async (id, rating) => {
    await db.updateRating(id, rating);
    await get().refresh();
  },

  setWatchDate: async (id, date) => {
    await db.updateWatchDate(id, date);
    await get().refresh();
  },

  setNotes: async (id, notes) => {
    await db.updateNotes(id, notes);
    await get().refresh();
  },

  setRewatchCount: async (id, count) => {
    await db.updateRewatchCount(id, count);
    await get().refresh();
  },

  setPlatform: async (id, platform) => {
    await db.updatePlatform(id, platform);
    await get().refresh();
  },

  setTags: async (id, tags) => {
    await db.updateTags(id, tags);
    await get().refresh();
  },

  setFavorite: async (id, favorite) => {
    await db.updateFavorite(id, favorite);
    await get().refresh();
  },

  setWatchDates: async (id, dates) => {
    await db.updateWatchDates(id, dates);
    await get().refresh();
  },

  setReview: async (id, review) => {
    await db.updateReview(id, review);
    await get().refresh();
  },

  setSpoiler: async (id, spoiler) => {
    await db.updateSpoiler(id, spoiler);
    await get().refresh();
  },

  removeMovie: async (id) => {
    await db.deleteMovie(id);
    const s = get();
    if (s.selectedId === id) set(navPatch(s.navStack.slice(0, -1)));
    await get().refresh();
  },
}));
