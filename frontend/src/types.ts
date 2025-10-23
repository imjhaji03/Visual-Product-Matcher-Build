// frontend/src/types.ts

/** Sort options available for the product grid. */
export type SortKey = "relevance" | "price_asc" | "price_desc" | "newest";

/** Filters applied when searching or refining results. */
export type Filters = {
  query?: string;
  category?: string | null;
  price?: [number, number];
  colors?: string[];
  inStock?: boolean;
  detectedTags?: string[];
  sort?: SortKey;
};

/** Product object as returned by the backend or search API. */
export type Product = {
  id: string;
  title: string;
  imageUrl: string;
  price?: number | null;
  badges?: string[];
  distanceScore?: number | null; // similarity distance; lower = more similar
  meta?: Record<string, unknown>;
};

/** Response for visual search results. */
export type SearchResponse = {
  items: Product[];
  total: number;
  tookMs?: number;
};

/** Response for API health endpoint. */
export type HealthResponse = {
  status: "ok";
  uptime?: number;
  version?: string;
};

/** Toast / notification message. */
export type Toast = {
  id: string;
  kind: "error" | "info" | "success";
  message: string;
};

/** Utility for request aborting pattern (optional helper). */
export interface Abortable<TArgs extends any[], TRes> {
  run: (...args: TArgs) => Promise<TRes>;
  cancel: () => void;
}
