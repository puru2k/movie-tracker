import { useCallback, useEffect, useState } from "react";
import { MOVIE_QUOTES } from "../lib/quotes";

const ROTATE_MS = 11_000;
const FADE_MS = 400;

/**
 * A subtle, rotating movie quote — a small bit of personality tucked into the
 * sidebar footer. Click to shuffle to the next line.
 */
export function QuoteBar() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * MOVIE_QUOTES.length));
  const [visible, setVisible] = useState(true);

  const advance = useCallback((step = 1) => {
    setVisible(false);
    window.setTimeout(() => {
      setIndex((i) => (i + step + MOVIE_QUOTES.length) % MOVIE_QUOTES.length);
      setVisible(true);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => advance(1), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [advance]);

  const q = MOVIE_QUOTES[index];

  return (
    <button
      onClick={() => advance(1)}
      title="Another one"
      className="group w-full border-t border-white/[0.06] px-4 pb-3 pt-3 text-left"
    >
      <div
        className="transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="font-serif text-[12px] italic leading-snug text-white/70">
          <span className="mr-0.5 text-ink-600">“</span>
          {q.quote}
          <span className="ml-0.5 text-ink-600">”</span>
        </p>
        <p className="mt-1 text-[10.5px] text-ink-600">
          {q.movie} <span className="opacity-60">· {q.year}</span>
        </p>
      </div>
    </button>
  );
}
