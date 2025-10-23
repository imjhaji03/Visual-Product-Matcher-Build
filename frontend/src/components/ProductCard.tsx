import React from "react";

export type ProductCardProps = {
  imageUrl: string;
  title: string;
  price?: number | null;
  badges?: string[];               // e.g., ["sneaker","leather","black"]
  distanceScore?: number | null;   // similarity score, lower is better (optional)
  onView?: () => void;
  onSimilar?: () => void;
  onSave?: () => void;
  className?: string;
};

export default function ProductCard({
  imageUrl,
  title,
  price = null,
  badges = [],
  distanceScore = null,
  onView,
  onSimilar,
  onSave,
  className = "",
}: ProductCardProps) {
  return (
    <div
      className={
        "group rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow " +
        className
      }
    >
      {/* Image */}
      <div className="relative">
        <img
          src={imageUrl}
          alt={title}
          className="h-56 w-full object-cover"
          loading="lazy"
        />

        {/* Quick actions */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onSave}
            title="Save"
            className="rounded-full bg-white/90 dark:bg-neutral-800/90 p-2 shadow border border-black/10 dark:border-white/10 hover:scale-105 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 2h9l3 3v17l-7.5-4-7.5 4V2z"
                fill="currentColor"
                className="text-sky-600 dark:text-sky-400"
              />
            </svg>
          </button>
          <button
            onClick={onSimilar}
            title="Find similar"
            className="rounded-full bg-white/90 dark:bg-neutral-800/90 p-2 shadow border border-black/10 dark:border:white/10 hover:scale-105 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M11 6a5 5 0 013.536 8.536l3.95 3.95-1.414 1.414-3.95-3.95A5 5 0 1111 6z"
                fill="currentColor"
                className="text-slate-700 dark:text-neutral-300"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{title}</h3>
          {price != null && (
            <span className="shrink-0 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-0.5 text-xs font-semibold tabular-nums">
              ₹{price}
            </span>
          )}
        </div>

        {/* badges */}
        {badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.slice(0, 4).map((b) => (
              <span
                key={b}
                className="rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-black/5 dark:border-white/10 px-2 py-0.5 text-[11px] font-medium"
              >
                {b}
              </span>
            ))}
            {badges.length > 4 && (
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">+{badges.length - 4}</span>
            )}
          </div>
        )}

        {/* footer */}
        <div className="mt-3 flex items-center justify-between">
          {distanceScore != null ? (
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
              similarity score: <span className="tabular-nums">{distanceScore.toFixed(3)}</span>
            </span>
          ) : (
            <span className="text-[11px] text-transparent">_</span>
          )}

          <button
            onClick={onView}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-semibold hover:opacity-90"
          >
            View
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h12M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
