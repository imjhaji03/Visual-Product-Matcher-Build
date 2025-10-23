// frontend/src/services/api.ts

// Base URL from Vite env; fallback to localhost for dev
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

// ---------- Types (you can move these to src/types.ts later) ----------
export type SortKey = "relevance" | "price_asc" | "price_desc" | "newest";

export type Filters = {
  query?: string;
  category?: string | null;
  price?: [number, number];    // [min, max]
  colors?: string[];           // hex or token names
  inStock?: boolean;
  detectedTags?: string[];
  sort?: SortKey;
};

export type Product = {
  id: string;
  title: string;
  imageUrl: string;
  price?: number | null;
  badges?: string[];
  distanceScore?: number | null;  // similarity distance (lower is better)
  meta?: Record<string, unknown>;
};

export type SearchResponse = {
  items: Product[];
  total: number;
  tookMs?: number;
};

export type HealthResponse = { status: "ok"; uptime?: number; version?: string };

// ---------- Low-level request helpers ----------
type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: BodyInit | null;
  signal?: AbortSignal;
};

async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    },
  });

  // Try to parse JSON either way for better error messages
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // ignore non-JSON
  }

  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.detail ||
      `API error ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return payload as T;
}

// Build FormData for file uploads + filters
function buildSearchForm(files: File[], filters?: Filters): FormData {
  const form = new FormData();
  files.forEach((f, i) => form.append("files", f, f.name || `image_${i}.jpg`));
  if (filters && Object.keys(filters).length > 0) {
    form.append("filters", JSON.stringify(filters));
  }
  return form;
}

// ---------- Public API ----------

/** Ping backend health. */
export function getHealth(signal?: AbortSignal) {
  return apiRequest<HealthResponse>("/health", { method: "GET", signal });
}

/** Get available categories (for filters). */
export function getCategories(signal?: AbortSignal) {
  return apiRequest<string[]>("/categories", { method: "GET", signal });
}

/** Get available detected tags (labels) from the catalog. */
export function getTags(signal?: AbortSignal) {
  return apiRequest<string[]>("/tags", { method: "GET", signal });
}

/**
 * Upload one or more images and perform visual similarity search.
 * Backend should accept multipart/form-data with:
 *   - files: File[]
 *   - filters: JSON string (optional)
 */
export async function uploadAndSearch(
  files: File[],
  filters?: Filters,
  signal?: AbortSignal
) {
  const form = buildSearchForm(files, filters);
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    body: form,
    signal,
    // Let browser set multipart boundaries; no manual Content-Type here
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Search failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SearchResponse;
}

/**
 * Trigger (re)computation of CLIP embeddings for the product catalog.
 * Useful after adding catalog images. The backend can run this async.
 */
export function precomputeEmbeddings(signal?: AbortSignal) {
  return apiRequest<{ ok: true; startedAt?: string; tookMs?: number }>(
    "/precompute",
    { method: "POST", signal }
  );
}

/** Fetch a single product by id. */
export function getProduct(id: string, signal?: AbortSignal) {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}

/** Optional helper to cancelable requests from components. */
export function withAbort<TArgs extends any[], TRes>(
  fn: (...args: [...TArgs, AbortSignal?]) => Promise<TRes>
) {
  const controller = new AbortController();
  const run = (...args: TArgs) => fn(...args, controller.signal);
  return { run, cancel: () => controller.abort() };
}

// ---------- Example usage patterns (for reference) ----------
// const { run, cancel } = withAbort(uploadAndSearch);
// run([file], { query: "sneakers", sort: "relevance" })
//   .then(console.log)
//   .catch(console.error);
// cancel();

export const api = {
  baseUrl: API_BASE,
  getHealth,
  getCategories,
  getTags,
  uploadAndSearch,
  precomputeEmbeddings,
  getProduct,
  withAbort,
};

export default api;
