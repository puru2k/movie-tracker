import type { MovieView } from "../types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  earned: boolean;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  period: string;
}

function isoToday(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function mk(
  id: string,
  name: string,
  description: string,
  current: number,
  target: number,
): Achievement {
  return { id, name, description, current: Math.min(current, target), target, earned: current >= target };
}

function countGenre(movies: MovieView[], genre: string): number {
  return movies.filter((m) => m.genres.includes(genre)).length;
}

export function computeAchievements(movies: MovieView[]): Achievement[] {
  const watched = movies.filter((m) => m.status === "watched");
  const watchedCount = watched.length;

  const reviewCount = movies.filter(
    (m) => (m.review && m.review.trim()) || (m.notes && m.notes.trim()),
  ).length;

  const decades = new Set<string>();
  for (const m of watched) {
    if (!m.release_date) continue;
    const y = Number(m.release_date.slice(0, 4));
    if (Number.isFinite(y)) decades.add(`${Math.floor(y / 10) * 10}`);
  }

  const genres = new Set(watched.flatMap((m) => m.genres));

  // Busiest single day across all logged watch dates.
  const dayCounts = new Map<string, number>();
  for (const m of movies) {
    for (const d of m.watch_dates) dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1);
  }
  const busiestDay = Math.max(0, ...dayCounts.values());

  const maxRewatch = Math.max(
    0,
    ...movies.map((m) => Math.max(m.rewatch_count + (m.status === "watched" ? 1 : 0), m.watch_dates.length)),
  );

  const fiveStarCount = watched.filter((m) => m.rating === 10).length;
  const diaryEntries = movies.reduce((n, m) => n + m.watch_dates.length, 0);
  const totalRewatches = movies.reduce((n, m) => n + m.rewatch_count, 0);
  const favoriteCount = movies.filter((m) => m.favorite === 1).length;
  const distinctTags = new Set(movies.flatMap((m) => m.tags)).size;

  // Most films watched from a single director.
  const directorCounts = new Map<string, number>();
  for (const m of watched) {
    if (m.director) directorCounts.set(m.director, (directorCounts.get(m.director) ?? 0) + 1);
  }
  const maxDirector = Math.max(0, ...directorCounts.values());

  return [
    mk("first", "First Watch", "Log your first watched film", watchedCount, 1),
    mk("ten", "Getting Started", "Watch 10 movies", watchedCount, 10),
    mk("fifty", "Cinephile", "Watch 50 movies", watchedCount, 50),
    mk("century", "Century Club", "Watch 100 movies", watchedCount, 100),
    mk("legend", "Silver Screen Legend", "Watch 250 movies", watchedCount, 250),
    mk("critic", "The Critic", "Write 10 reviews", reviewCount, 10),
    mk("diarist", "Diarist", "Log 50 diary entries", diaryEntries, 50),
    mk("fivestar", "Tough Crowd", "Give 10 perfect 5★ ratings", fiveStarCount, 10),
    mk("horror", "Horror Expert", "Watch 10 horror films", countGenre(watched, "Horror"), 10),
    mk("scifi", "Sci-Fi Voyager", "Watch 10 sci-fi films", countGenre(watched, "Science Fiction"), 10),
    mk("comedy", "Comedy Club", "Watch 15 comedies", countGenre(watched, "Comedy"), 15),
    mk("drama", "Drama Devotee", "Watch 20 dramas", countGenre(watched, "Drama"), 20),
    mk("decades", "Time Traveler", "Watch films from 5 decades", decades.size, 5),
    mk("genres", "Genre Explorer", "Watch 8 different genres", genres.size, 8),
    mk("auteur", "Auteur Admirer", "Watch 5 films by one director", maxDirector, 5),
    mk("marathon", "Marathoner", "Watch 3 films in one day", busiestDay, 3),
    mk("devoted", "Devoted Fan", "Watch a single film 3 times", maxRewatch, 3),
    mk("rewatcher", "Rerun Royalty", "Rack up 25 rewatches", totalRewatches, 25),
    mk("curator", "Curator", "Collect 25 favorites", favoriteCount, 25),
    mk("tagger", "Master Organizer", "Create 15 custom tags", distinctTags, 15),
  ];
}

export function computeChallenges(movies: MovieView[]): Challenge[] {
  const today = isoToday();
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);
  const monthName = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
  });

  const watchedThisYear = movies.reduce(
    (n, m) => n + m.watch_dates.filter((d) => d.slice(0, 4) === year).length,
    0,
  );
  const watchedThisMonth = movies.reduce(
    (n, m) => n + m.watch_dates.filter((d) => d.slice(0, 7) === month).length,
    0,
  );

  const genresThisYear = new Set(
    movies
      .filter((m) => m.watch_dates.some((d) => d.slice(0, 4) === year))
      .flatMap((m) => m.genres),
  );

  const ratedThisYear = movies.filter(
    (m) => m.rating != null && m.watch_dates.some((d) => d.slice(0, 4) === year),
  ).length;

  const watchedToday = movies.reduce(
    (n, m) => n + m.watch_dates.filter((d) => d === today).length,
    0,
  );

  // Halloween: horror films watched during October of this year.
  const octoberHorror = movies
    .filter((m) => m.genres.includes("Horror"))
    .reduce(
      (n, m) => n + m.watch_dates.filter((d) => d.slice(0, 4) === year && d.slice(5, 7) === "10").length,
      0,
    );

  return [
    {
      id: "year52",
      name: "52 in a year",
      description: "Watch a movie a week",
      current: Math.min(watchedThisYear, 52),
      target: 52,
      period: year,
    },
    {
      id: "month12",
      name: "12 this month",
      description: "Keep the momentum going",
      current: Math.min(watchedThisMonth, 12),
      target: 12,
      period: monthName,
    },
    {
      id: "genres10",
      name: "Genre marathon",
      description: "Explore 10 genres this year",
      current: Math.min(genresThisYear.size, 10),
      target: 10,
      period: year,
    },
    {
      id: "rate25",
      name: "Rate 25 this year",
      description: "Score the films you watch",
      current: Math.min(ratedThisYear, 25),
      target: 25,
      period: year,
    },
    {
      id: "double",
      name: "Double feature",
      description: "Watch 2 films in one day",
      current: Math.min(watchedToday, 2),
      target: 2,
      period: "Today",
    },
    {
      id: "hallow31",
      name: "31 Nights of Horror",
      description: "Watch 31 horror films in October",
      current: Math.min(octoberHorror, 31),
      target: 31,
      period: `October ${year}`,
    },
  ];
}
