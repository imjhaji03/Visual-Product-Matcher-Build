import React, { useEffect, useMemo, useState } from "react";

export type SortKey = "relevance" | "price_asc" | "price_desc" | "newest";

// We keep colors in state as HEX strings for compatibility
export type FilterState = {
  query: string;
  category: string | null;
  price: [number, number]; // [min, max]
  colors: string[];        // hex codes are stored/returned here
  inStock: boolean;
  detectedTags: string[];
  sort: SortKey;
};

type ColorOption = { name: string; hex: string };

type Props = {
  value?: Partial<FilterState>;
  onChange: (next: FilterState) => void;
  availableCategories?: string[];
  // Can pass hex strings or { name, hex } objects
  availableColors?: (string | ColorOption)[];
  availableTags?: string[];
  className?: string;
};

const DEFAULTS: FilterState = {
  query: "",
  category: null,
  price: [0, 1000],
  colors: [],
  inStock: false,
  detectedTags: [],
  sort: "relevance",
};

// Friendly names for your current hexes (extend as you like)
const NAMED_COLORS: Record<string, string> = {
  "#111827": "Black",
  "#ef4444": "Red",
  "#f59e0b": "Amber",
  "#22c55e": "Green",
  "#06b6d4": "Cyan",
  "#3b82f6": "Blue",
  "#a855f7": "Violet",
};

export default function FilterPanel({
  value,
  onChange,
  availableCategories = [],
  availableColors = ["#111827", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"],
  availableTags = [],
  className = "",
}: Props) {
  const [state, setState] = useState<FilterState>({ ...DEFAULTS, ...value });

  useEffect(() => setState((s) => ({ ...s, ...value })), [value]);
  useEffect(() => onChange(state), [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const [min, max] = state.price;
  const minMax = useMemo(() => [Math.min(min, max), Math.max(min, max)] as [number, number], [min, max]);

  // Normalize colors to { name, hex }
  const colorOptions: ColorOption[] = useMemo(() => {
    return availableColors.map((c) => {
      if (typeof c === "string") {
        const hex = c;
        const name = NAMED_COLORS[hex.toLowerCase()] ?? hex;
        return { name, hex };
      }
      // sanitize: ensure lowercased hex for matching
      return { name: c.name, hex: c.hex };
    });
  }, [availableColors]);

  // We toggle by HEX (keeps upstream filters stable)
  const toggleColor = (hex: string) =>
    setState((s) => ({
      ...s,
      colors: s.colors.includes(hex) ? s.colors.filter((x) => x !== hex) : [...s.colors, hex],
    }));

  const toggleTag = (t: string) =>
    setState((s) => ({
      ...s,
      detectedTags: s.detectedTags.includes(t) ? s.detectedTags.filter((x) => x !== t) : [...s.detectedTags, t],
    }));

  const clearAll = () => setState(DEFAULTS);

  return (
<aside
  className={
    "filters-panel w-full sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur rounded-none sm:rounded-xl p-4 sm:p-5 " +
    className
  }
>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-neutral-300">
          Filters
        </h2>
        <button
          className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
          onClick={clearAll}
          type="button"
        >
          Clear all
        </button>
      </div>

      {/* Search */}
      <label className="block mb-4">
        <span className="text-xs text-slate-500 dark:text-neutral-400">Search</span>
        <input
          value={state.query}
          onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
          placeholder="e.g., 'sneakers', 'minimal bag'"
          className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>

      {/* Category */}
      <label className="block mb-4">
        <span className="text-xs text-slate-500 dark:text-neutral-400">Category</span>
        <select
          value={state.category ?? ""}
          onChange={(e) => setState((s) => ({ ...s, category: e.target.value || null }))}
          className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-neutral-400">Price range</span>
          <span className="text-xs font-medium tabular-nums">
            ₹{minMax[0]} – ₹{minMax[1]}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            value={min}
            onChange={(e) => setState((s) => ({ ...s, price: [Number(e.target.value || 0), s.price[1]] }))}
            placeholder="min"
          />
          <input
            type="number"
            inputMode="numeric"
            className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            value={max}
            onChange={(e) => setState((s) => ({ ...s, price: [s.price[0], Number(e.target.value || 0)] }))}
            placeholder="max"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="mb-4">
        <span className="block text-xs text-slate-500 dark:text-neutral-400 mb-2">Colors</span>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(({ name, hex }) => {
            const active = state.colors.includes(hex);
            return (
              <button
                key={hex}
                type="button"
                title={`${name} (${hex})`}
                onClick={() => toggleColor(hex)}
                className={
                  "h-7 rounded-full px-2.5 text-[11px] font-medium border border-black/10 dark:border-white/10 flex items-center gap-2 " +
                  (active ? "ring-2 ring-offset-1 ring-sky-500 dark:ring-offset-neutral-900" : "")
                }
                style={{ backgroundColor: hex + "1a" /* light tint */ }}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                <span className="text-[11px]">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detected tags */}
      {availableTags.length > 0 && (
        <div className="mb-4">
          <span className="block text-xs text-slate-500 dark:text-neutral-400 mb-2">Detected tags</span>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((t) => {
              const active = state.detectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={
                    "px-2.5 h-7 rounded-full text-[11px] font-medium border " +
                    (active
                      ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-900"
                      : "bg-white dark:bg-neutral-900 border-black/10 dark:border-white/10")
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock + Sort */}
      <div className="mb-4 flex items-center justify-between">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.inStock}
            onChange={(e) => setState((s) => ({ ...s, inStock: e.target.checked }))}
            className="h-4 w-4 rounded border-black/20 dark:border-white/20"
          />
          <span className="text-sm">In stock only</span>
        </label>

        <select
          value={state.sort}
          onChange={(e) => setState((s) => ({ ...s, sort: e.target.value as SortKey }))}
          className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-sm"
        >
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </aside>
  );
}
