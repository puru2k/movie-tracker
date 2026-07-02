export interface MovieQuote {
  quote: string;
  movie: string;
  year: number;
}

/** A small, curated set of iconic movie lines shown around the app for flavor. */
export const MOVIE_QUOTES: MovieQuote[] = [
  { quote: "May the Force be with you.", movie: "Star Wars", year: 1977 },
  { quote: "Here's looking at you, kid.", movie: "Casablanca", year: 1942 },
  { quote: "Life is like a box of chocolates.", movie: "Forrest Gump", year: 1994 },
  { quote: "I'll be back.", movie: "The Terminator", year: 1984 },
  { quote: "Why so serious?", movie: "The Dark Knight", year: 2008 },
  { quote: "You're gonna need a bigger boat.", movie: "Jaws", year: 1975 },
  { quote: "There's no place like home.", movie: "The Wizard of Oz", year: 1939 },
  { quote: "I'm going to make him an offer he can't refuse.", movie: "The Godfather", year: 1972 },
  { quote: "Do or do not. There is no try.", movie: "The Empire Strikes Back", year: 1980 },
  { quote: "To infinity and beyond!", movie: "Toy Story", year: 1995 },
  { quote: "Just keep swimming.", movie: "Finding Nemo", year: 2003 },
  { quote: "I see dead people.", movie: "The Sixth Sense", year: 1999 },
  { quote: "You talking to me?", movie: "Taxi Driver", year: 1976 },
  { quote: "Roads? Where we're going we don't need roads.", movie: "Back to the Future", year: 1985 },
  { quote: "Hasta la vista, baby.", movie: "Terminator 2: Judgment Day", year: 1991 },
  { quote: "Say hello to my little friend!", movie: "Scarface", year: 1983 },
  { quote: "Nobody puts Baby in a corner.", movie: "Dirty Dancing", year: 1987 },
  { quote: "There is no spoon.", movie: "The Matrix", year: 1999 },
  { quote: "With great power comes great responsibility.", movie: "Spider-Man", year: 2002 },
  { quote: "Carpe diem. Seize the day, boys.", movie: "Dead Poets Society", year: 1989 },
  { quote: "E.T. phone home.", movie: "E.T. the Extra-Terrestrial", year: 1982 },
  { quote: "Frankly, my dear, I don't give a damn.", movie: "Gone with the Wind", year: 1939 },
  { quote: "Keep your friends close, but your enemies closer.", movie: "The Godfather Part II", year: 1974 },
  { quote: "They may take our lives, but they'll never take our freedom!", movie: "Braveheart", year: 1995 },
  { quote: "Houston, we have a problem.", movie: "Apollo 13", year: 1995 },
  { quote: "Wax on, wax off.", movie: "The Karate Kid", year: 1984 },
  { quote: "My precious.", movie: "The Lord of the Rings: The Two Towers", year: 2002 },
  { quote: "You can't handle the truth!", movie: "A Few Good Men", year: 1992 },
];

export function randomQuote(): MovieQuote {
  return MOVIE_QUOTES[Math.floor(Math.random() * MOVIE_QUOTES.length)];
}
