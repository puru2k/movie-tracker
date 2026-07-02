import { isTauri } from "@tauri-apps/api/core";
import { supabaseEnabled } from "./supabase";
import * as tauriDb from "./db";
import * as cloudDb from "./cloudDb";
import * as localDb from "./localDb";

/**
 * Data-layer selector. The desktop (Tauri) app always uses local SQLite. On the
 * web, users can browse as a guest (localStorage) or sign in for cloud sync
 * (Supabase) — the mode is chosen at runtime, so all calls dispatch lazily.
 */
export type RepoMode = "tauri" | "cloud" | "local";

/** True on the web when a Supabase backend is configured (accounts possible). */
export const cloudAvailable = !isTauri() && supabaseEnabled;

let mode: RepoMode = isTauri() ? "tauri" : "local";

export function setRepoMode(m: RepoMode): void {
  mode = m;
}

export function getRepoMode(): RepoMode {
  return mode;
}

function impl() {
  if (mode === "tauri") return tauriDb;
  if (mode === "cloud") return cloudDb;
  return localDb;
}

export const listMovies: typeof tauriDb.listMovies = (status) => impl().listMovies(status);
export const getMovie: typeof tauriDb.getMovie = (id) => impl().getMovie(id);
export const getSavedIds: typeof tauriDb.getSavedIds = () => impl().getSavedIds();
export const addMovie: typeof tauriDb.addMovie = (details, status) =>
  impl().addMovie(details, status);
export const updateStatus: typeof tauriDb.updateStatus = (id, status) =>
  impl().updateStatus(id, status);
export const updateRating: typeof tauriDb.updateRating = (id, rating) =>
  impl().updateRating(id, rating);
export const updateWatchDate: typeof tauriDb.updateWatchDate = (id, date) =>
  impl().updateWatchDate(id, date);
export const updateNotes: typeof tauriDb.updateNotes = (id, notes) => impl().updateNotes(id, notes);
export const updateRewatchCount: typeof tauriDb.updateRewatchCount = (id, count) =>
  impl().updateRewatchCount(id, count);
export const updatePlatform: typeof tauriDb.updatePlatform = (id, platform) =>
  impl().updatePlatform(id, platform);
export const updateTags: typeof tauriDb.updateTags = (id, tags) => impl().updateTags(id, tags);
export const updateFavorite: typeof tauriDb.updateFavorite = (id, favorite) =>
  impl().updateFavorite(id, favorite);
export const updateWatchDates: typeof tauriDb.updateWatchDates = (id, dates) =>
  impl().updateWatchDates(id, dates);
export const updateReview: typeof tauriDb.updateReview = (id, review) =>
  impl().updateReview(id, review);
export const updateSpoiler: typeof tauriDb.updateSpoiler = (id, spoiler) =>
  impl().updateSpoiler(id, spoiler);
export const updatePosterCache: typeof tauriDb.updatePosterCache = (id, uri) =>
  impl().updatePosterCache(id, uri);
export const moviesNeedingPosterCache: typeof tauriDb.moviesNeedingPosterCache = () =>
  impl().moviesNeedingPosterCache();
export const deleteMovie: typeof tauriDb.deleteMovie = (id) => impl().deleteMovie(id);
