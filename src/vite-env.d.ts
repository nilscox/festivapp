/// <reference types="vite-plugin-solid-svg/types-component-solid" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __DATA__: object;
declare const __VERSION__: string;

declare const _paq: unknown[];

interface ImportMetaEnv {
  readonly VITE_LANGUAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
