// MMKV on iOS / Android, localStorage on Web (MMKV requires JSI which web has not).

import { Platform } from 'react-native';

interface KVStore {
  set(key: string, value: string): void;
  getString(key: string): string | undefined;
  delete(key: string): void;
}

let _impl: KVStore;

if (Platform.OS === 'web') {
  _impl = {
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch {}
    },
    getString(key) {
      try { return window.localStorage.getItem(key) ?? undefined; } catch { return undefined; }
    },
    delete(key) {
      try { window.localStorage.removeItem(key); } catch {}
    },
  };
} else {
  // Lazy import MMKV v4 (JSI; uses createMMKV factory, not `new MMKV(...)`).
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv = createMMKV({ id: 'cqupt-rollcall' });
  _impl = {
    set: (k, v) => mmkv.set(k, v),
    getString: (k) => mmkv.getString(k),
    delete: (k) => { mmkv.remove(k); },
  };
}

export const storage = _impl;

/** Adapter for zustand's persist middleware. */
export const zustandStorage = {
  getItem: (name: string) => Promise.resolve(storage.getString(name) ?? null),
  setItem: (name: string, value: string) => Promise.resolve(storage.set(name, value)),
  removeItem: (name: string) => Promise.resolve(storage.delete(name)),
};
