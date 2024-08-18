/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __DATA__: object;

interface ImportMetaEnv {
  readonly VITE_LANGUAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
