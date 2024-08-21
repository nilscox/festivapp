/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __DATA__: object;
declare const __VERSION__: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const _paq: any;

interface ImportMetaEnv {
  readonly VITE_LANGUAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
