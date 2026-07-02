import { isTauri } from "@tauri-apps/api/core";
import { supabaseEnabled } from "./supabase";
import * as tauriDb from "./db";
import * as cloudDb from "./cloudDb";

/**
 * Data-layer selector. The desktop (Tauri) app always uses local SQLite; the
 * web build uses the Supabase cloud repo when it's configured, so accounts get
 * their own persisted, per-user library.
 */
export const useCloud = !isTauri() && supabaseEnabled;

const impl = useCloud ? cloudDb : tauriDb;

export const {
  listMovies,
  getMovie,
  getSavedIds,
  addMovie,
  updateStatus,
  updateRating,
  updateWatchDate,
  updateNotes,
  updateRewatchCount,
  updatePlatform,
  updateTags,
  updateFavorite,
  updateWatchDates,
  updateReview,
  updateSpoiler,
  updatePosterCache,
  moviesNeedingPosterCache,
  deleteMovie,
} = impl;
