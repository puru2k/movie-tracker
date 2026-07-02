import { supabaseEnabled } from "./supabase";
import * as cloudDb from "./cloudDb";
import * as localDb from "./localDb";

/**
 * Data-layer selector for the web app. Users can browse as a guest
 * (localStorage) or sign in for cloud sync (Supabase). The mode is chosen at
 * runtime, so every call dispatches lazily to the active backend.
 */
export type RepoMode = "cloud" | "local";

/** True when a Supabase backend is configured, i.e. accounts are possible. */
export const cloudAvailable = supabaseEnabled;

let mode: RepoMode = "local";

export function setRepoMode(m: RepoMode): void {
  mode = m;
}

export function getRepoMode(): RepoMode {
  return mode;
}

function impl() {
  return mode === "cloud" ? cloudDb : localDb;
}

export const listMovies: typeof cloudDb.listMovies = (status) => impl().listMovies(status);
export const getMovie: typeof cloudDb.getMovie = (id) => impl().getMovie(id);
export const getSavedIds: typeof cloudDb.getSavedIds = () => impl().getSavedIds();
export const addMovie: typeof cloudDb.addMovie = (details, status) =>
  impl().addMovie(details, status);
export const updateStatus: typeof cloudDb.updateStatus = (id, status) =>
  impl().updateStatus(id, status);
export const updateRating: typeof cloudDb.updateRating = (id, rating) =>
  impl().updateRating(id, rating);
export const updateWatchDate: typeof cloudDb.updateWatchDate = (id, date) =>
  impl().updateWatchDate(id, date);
export const updateNotes: typeof cloudDb.updateNotes = (id, notes) => impl().updateNotes(id, notes);
export const updateRewatchCount: typeof cloudDb.updateRewatchCount = (id, count) =>
  impl().updateRewatchCount(id, count);
export const updatePlatform: typeof cloudDb.updatePlatform = (id, platform) =>
  impl().updatePlatform(id, platform);
export const updateTags: typeof cloudDb.updateTags = (id, tags) => impl().updateTags(id, tags);
export const updateFavorite: typeof cloudDb.updateFavorite = (id, favorite) =>
  impl().updateFavorite(id, favorite);
export const updateWatchDates: typeof cloudDb.updateWatchDates = (id, dates) =>
  impl().updateWatchDates(id, dates);
export const updateReview: typeof cloudDb.updateReview = (id, review) =>
  impl().updateReview(id, review);
export const updateSpoiler: typeof cloudDb.updateSpoiler = (id, spoiler) =>
  impl().updateSpoiler(id, spoiler);
export const deleteMovie: typeof cloudDb.deleteMovie = (id) => impl().deleteMovie(id);
