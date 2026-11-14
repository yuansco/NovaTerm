import { NovaTermApi } from '../main/preload';

declare global {
  interface Window {
    novaTerm: NovaTermApi;
  }
}

export {};
