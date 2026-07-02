import { useState } from "react";
import { StarIcon } from "./Icons";

interface StarRatingProps {
  /** Rating from 0-10 (half-star precision), or null when unrated. */
  value: number | null;
  /** When provided, the control is interactive. */
  onChange?: (value: number | null) => void;
  size?: number;
}

/** A single star that can display an empty, half, or full fill. */
function Star({ fill, size }: { fill: "empty" | "half" | "full"; size: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <StarIcon width={size} height={size} className="absolute inset-0 text-ink-600" />
      {fill !== "empty" && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: fill === "half" ? size / 2 : size }}
        >
          <StarIcon width={size} height={size} className="text-accent" />
        </span>
      )}
    </span>
  );
}

export function StarRating({ value, onChange, size = 22 }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const display = hover ?? value ?? 0;

  function fillFor(starIndex: number): "empty" | "half" | "full" {
    const full = (starIndex + 1) * 2;
    const half = full - 1;
    if (display >= full) return "full";
    if (display >= half) return "half";
    return "empty";
  }

  if (!interactive) {
    return (
      <div className="inline-flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} fill={fillFor(i)} size={size} />
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const halfValue = i * 2 + 1;
        const fullValue = i * 2 + 2;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star fill={fillFor(i)} size={size} />
            <button
              type="button"
              aria-label={`Rate ${halfValue / 2} stars`}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
              onMouseEnter={() => setHover(halfValue)}
              onClick={() => onChange!(value === halfValue ? null : halfValue)}
            />
            <button
              type="button"
              aria-label={`Rate ${fullValue / 2} stars`}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
              onMouseEnter={() => setHover(fullValue)}
              onClick={() => onChange!(value === fullValue ? null : fullValue)}
            />
          </span>
        );
      })}
    </div>
  );
}
