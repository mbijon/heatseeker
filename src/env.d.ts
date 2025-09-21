/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_HEATSEEKER_SUPABASE_URL?: string;
  readonly PUBLIC_HEATSEEKER_SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
