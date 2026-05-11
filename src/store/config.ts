// Mirrors CQUPTRollcall/Models/Config.swift (AppConfig)
// Persisted via Zustand + MMKV/localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export interface ConfigState {
  username: string;
  password: string;
  studentID: string;
  centerServerURL: string;
  centerServerSecret: string;
  autoLocationCheckin: boolean;
  curriculumPreMinutes: number;
  pauseSharedRollcall: boolean;
  clientID: string;

  // setters
  set: (patch: Partial<Omit<ConfigState, 'set' | 'logout'>>) => void;
  /** Wipe password + cookies-equivalent (callers also disconnect WS / stop poller). */
  logout: () => void;
}

function uuidLower(): string {
  // RFC4122 v4-ish, lowercased — iOS used UUID().uuidString.lowercased()
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
    (crypto as any).getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // version 4
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) hex.push(bytes[i]!.toString(16).padStart(2, '0'));
  return (
    `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
  );
}

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      username: '',
      password: '',
      studentID: '',
      centerServerURL: 'wss://cqupt.ishub.top/api/rollcall/ws',
      centerServerSecret: '',
      autoLocationCheckin: true,
      curriculumPreMinutes: 10,
      pauseSharedRollcall: false,
      clientID: uuidLower(),

      set: (patch) => set(patch),
      logout: () => set({ password: '' }),
    }),
    {
      name: 'cqupt-config',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

export const isConfigured = (c: ConfigState) =>
  !!c.username && !!c.password;
