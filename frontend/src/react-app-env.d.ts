/// <reference types="vite/client" />

// Add any custom env variables you want to expose to the app here.
// (All must start with VITE_ for Vite to inject them.)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
