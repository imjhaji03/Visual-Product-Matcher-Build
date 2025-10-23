// frontend/src/index.tsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Optional: keep document <html> .dark in sync if theme changes elsewhere
(function syncThemeClass() {
  const apply = () => {
    const ls = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = ls ? ls === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldDark);
  };
  apply();
  // Listen to OS theme changes and storage updates
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);
    window.addEventListener("storage", (e) => {
      if (e.key === "theme") apply();
    });
  } catch {
    /* no-op for older browsers */
  }
})();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// If you created src/reportWebVitals.ts, you can optionally enable it:
// import reportWebVitals from "./reportWebVitals";
// reportWebVitals(console.log);
