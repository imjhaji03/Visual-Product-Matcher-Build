// frontend/src/reportWebVitals.ts

export type WebVitalsHandler = (metric: any) => void;

/**
 * Reports Core Web Vitals when a handler is provided.
 * Usage:
 *   import reportWebVitals from "./reportWebVitals";
 *   reportWebVitals(console.log);
 */
export default function reportWebVitals(onPerfEntry?: WebVitalsHandler) {
  if (!onPerfEntry || typeof onPerfEntry !== "function") return;

  // Dynamically import to avoid adding to initial bundle
  import("web-vitals").then(
    ({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      try {
        onCLS(onPerfEntry);
        onFID(onPerfEntry);
        onFCP(onPerfEntry);
        onLCP(onPerfEntry);
        onTTFB(onPerfEntry);
        // INP is the newer responsiveness metric replacing FID
        if (typeof onINP === "function") onINP(onPerfEntry);
      } catch {
        // no-op: web-vitals not supported in some environments
      }
    },
    () => {
      // no-op: web-vitals package not installed
    }
  );
}
