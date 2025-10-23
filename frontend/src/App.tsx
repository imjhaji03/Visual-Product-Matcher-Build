// frontend/src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import FilterPanel, { FilterState as PanelFilters, SortKey } from "./components/FilterPanel";
import ImageUpload from "./components/ImageUpload";
import ProductCard from "./components/ProductCard";
import api, { Filters as ApiFilters, Product, getCategories, getTags, uploadAndSearch, getHealth } from "./services/api";

// ---------- Local Types ----------
type Toast = { id: string; kind: "error" | "info" | "success"; message: string };

// ---------- Helpers ----------
const toApiFilters = (f: PanelFilters): ApiFilters => ({
  query: f.query || undefined,
  category: f.category ?? undefined,
  price: f.price,
  colors: f.colors,
  inStock: f.inStock,
  detectedTags: f.detectedTags,
  sort: f.sort as SortKey,
});

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Main App ----------
export default function App() {
  const [filters, setFilters] = useState<PanelFilters>({
    query: "",
    category: null,
    price: [0, 1000],
    colors: [],
    inStock: false,
    detectedTags: [],
    sort: "relevance",
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  // ---------- Effects ----------
  // Ping health + fetch categories & tags on mount
  useEffect(() => {
    getHealth().then(
      () => setApiHealthy(true),
      () => setApiHealthy(false)
    );
    getCategories().then(setCategories).catch(() => {});
    getTags().then(setTags).catch(() => {});
  }, []);

  // Keyboard ESC closes details drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- Handlers ----------
  const pushToast = (kind: Toast["kind"], message: string) => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const handleFiles = async (files: File[]) => {
    if (!files?.length) return;
    setIsSearching(true);
    try {
      const res = await uploadAndSearch(files, toApiFilters(filters));
      setResults(res.items || []);
      setTotal(res.total || 0);
      if (!res.items?.length) pushToast("info", "No matches found. Try adjusting filters or another image.");
    } catch (err: any) {
      pushToast("error", err?.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const filteredSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.query) parts.push(`“${filters.query}”`);
    if (filters.category) parts.push(filters.category);
    if (filters.inStock) parts.push("In stock");
    if (filters.colors.length) parts.push(`${filters.colors.length} colors`);
    if (filters.detectedTags.length) parts.push(`${filters.detectedTags.length} tags`);
    return parts.join(" · ");
  }, [filters]);

  // ---------- Render ----------
  return (
    <div className="app-container">
      {/* Left Filters (hidden on small screens) */}
      <div className="filter-panel">
        <FilterPanel
          value={filters}
          onChange={setFilters}
          availableCategories={categories}
          availableColors={["#111827", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"]}
          availableTags={tags}
          className="h-full"
        />
      </div>

      {/* Main content */}
      <main className="main-content">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Visual Product Matcher
            </h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Upload an image to find visually similar products using AI.
            </p>
            {filteredSummary && (
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                Active: {filteredSummary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border " +
                (apiHealthy
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900"
                  : apiHealthy === false
                  ? "border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900"
                  : "border-slate-200 text-slate-600 bg-white dark:bg-neutral-900 dark:text-neutral-300 dark:border-white/10")
              }
              title="API health"
            >
              <span className="w-2.5 h-2.5 rounded-full"
                style={{ background: apiHealthy ? "#10b981" : apiHealthy === false ? "#ef4444" : "#cbd5e1" }}
              />
              {apiHealthy ? "API Online" : apiHealthy === false ? "API Offline" : "Checking…"}
            </span>
          </div>
        </header>

        {/* Upload */}
        <section className="mb-6">
          <ImageUpload onFiles={handleFiles} className="fade-in" />
          <div className="mt-3 flex items-center gap-2">
            <button
              className="btn-primary"
              onClick={() => {
                // helpful if someone wants to search without file to test
                pushToast("info", "Tip: drag & drop or paste an image to start searching.");
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              New Search
            </button>
            <button
              className="btn-outline"
              onClick={() => setResults([])}
            >
              Clear Results
            </button>
          </div>
        </section>

        {/* Results header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-neutral-300">
            {isSearching ? "Searching…" : total ? `${total} result${total > 1 ? "s" : ""}` : "No results yet"}
          </div>
          <div className="text-xs text-slate-500 dark:text-neutral-400">
            Sort: <strong className="font-semibold capitalize">{filters.sort.replace("_", " ")}</strong>
          </div>
        </div>

        {/* Results grid or skeleton */}
        {isSearching ? (
          <SkeletonGrid />
        ) : results.length ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => (
              <ProductCard
                key={p.id}
                imageUrl={p.imageUrl}
                title={p.title}
                price={p.price ?? null}
                badges={p.badges ?? []}
                distanceScore={p.distanceScore ?? null}
                onView={() => setSelected(p)}
                onSimilar={() => {
                  // optional: trigger a new search seeded by this product
                  pushToast("info", "Finding similar items… (hook this to a backend route if needed)");
                }}
                onSave={() => pushToast("success", "Saved to favorites (demo).")}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Right-side Details Drawer */}
      <DetailsDrawer product={selected} onClose={() => setSelected(null)} />

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-xl px-3 py-2 text-sm shadow card " +
              (t.kind === "error"
                ? "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900"
                : t.kind === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900"
                : "border-slate-200 bg-white text-slate-800 dark:bg-neutral-900 dark:text-neutral-200 dark:border-white/10")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Details Drawer ----------
function DetailsDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <div
      className={
        "fixed inset-y-0 right-0 w-full sm:w-[380px] bg-white dark:bg-neutral-900 border-l border-black/10 dark:border-white/10 shadow-xl transition-transform duration-300 z-40 " +
        (product ? "translate-x-0" : "translate-x-full")
      }
      aria-hidden={!product}
    >
      <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
        <h3 className="text-sm font-semibold">Details</h3>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Close details"
        >
          Close
        </button>
      </div>
      {product ? (
        <div className="p-4 space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
          </div>
          <div>
            <h4 className="text-base font-semibold">{product.title}</h4>
            {product.price != null && (
              <div className="mt-1 text-sm font-semibold tabular-nums">₹{product.price}</div>
            )}
            {product.distanceScore != null && (
              <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                similarity score: <span className="tabular-nums">{product.distanceScore.toFixed(3)}</span>
              </div>
            )}
          </div>
          {product.badges?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {product.badges.map((b) => (
                <span key={b} className="rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-black/5 dark:border-white/10 px-2 py-0.5 text-[11px] font-medium">
                  {b}
                </span>
              ))}
            </div>
          ) : null}
          {/* Meta (optional) */}
          {product.meta && (
            <div className="text-xs text-slate-600 dark:text-neutral-300">
              <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-neutral-800/60 p-2 rounded-lg border border-black/10 dark:border-white/10">
                {JSON.stringify(product.meta, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ---------- Skeleton & Empty ----------
function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-56 w-full bg-slate-200/70 dark:bg-neutral-800" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-3/4 bg-slate-200/70 dark:bg-neutral-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-200/70 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-neutral-800">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-base font-semibold">Start by uploading an image</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Drag & drop, paste, or browse your files to find visually similar products.
      </p>
    </div>
  );
}
