// Mirrors CQUPTRollcall/ViewModels/AppState.swift
// Runtime app state: rollcalls, polling status, services lifecycle.

import { create } from 'zustand';
import { LMSClient, LMSError } from '../services/lmsClient';
import { CenterWSClient } from '../services/centerWS';
import { Poller } from '../services/poller';
import { extractQRData } from '../services/qrUtil';
import type { Rollcall } from '../models/rollcall';
import type { CurriculumInstance } from '../models/curriculum';
import { useConfig } from './config';
import { isAbsent } from '../models/rollcall';

export interface AppState {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  rollcalls: Rollcall[];
  todayCourses: CurriculumInstance[];
  centerConnected: boolean;
  isPolling: boolean;
  lastPollTime: number | null;
  checkinMessage: string | null;

  login: () => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
  refreshRollcalls: () => Promise<void>;

  submitGlobalQR: (rawData: string) => Promise<void>;
  checkinQR: (rollcallID: number, qrData: string) => Promise<void>;
  checkinNumber: (rollcallID: number, number: string) => Promise<void>;
  checkinLocation: (rollcallID: number, lat: number, lon: number) => Promise<void>;

  /** Internal: clear toast after delay */
  setCheckinMessage: (msg: string | null) => void;
}

const lms = new LMSClient();
let centerWS: CenterWSClient | null = null;
let poller: Poller | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppState = create<AppState>((set, get) => ({
  isLoggedIn: false,
  isLoggingIn: false,
  loginError: null,
  rollcalls: [],
  todayCourses: [],
  centerConnected: false,
  isPolling: false,
  lastPollTime: null,
  checkinMessage: null,

  setCheckinMessage(msg) {
    set({ checkinMessage: msg });
    if (toastTimer) clearTimeout(toastTimer);
    if (msg) {
      toastTimer = setTimeout(() => set({ checkinMessage: null }), 2500);
    }
  },

  async login() {
    const cfg = useConfig.getState();
    set({ isLoggingIn: true, loginError: null });
    try {
      await lms.login(cfg.username, cfg.password);
      set({ isLoggedIn: true });
      startServices();
    } catch (e) {
      const msg = e instanceof LMSError ? e.message : (e as Error).message;
      set({ loginError: msg });
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout() {
    stopServices();
    useConfig.getState().logout();
    set({
      isLoggedIn: false,
      rollcalls: [],
      todayCourses: [],
      centerConnected: false,
      lastPollTime: null,
    });
  },

  async checkSession() {
    try {
      const list = await lms.getRollcalls(async () => {
        const cfg = useConfig.getState();
        await lms.login(cfg.username, cfg.password);
      });
      set({ rollcalls: list, isLoggedIn: true });
      startServices();
    } catch {
      set({ isLoggedIn: false });
    }
  },

  async refreshRollcalls() {
    try {
      const list = await lms.getRollcalls(async () => {
        const cfg = useConfig.getState();
        await lms.login(cfg.username, cfg.password);
      });
      set({ rollcalls: list });
    } catch {
      // swallow — keep existing
    }
  },

  async submitGlobalQR(rawData) {
    const extracted = extractQRData(rawData);
    if (!extracted) {
      get().setCheckinMessage('无效或过期的二维码');
      return;
    }

    centerWS?.sendRollcallSuccess('qr', { rollcall_data: extracted });

    const qrTasks = get().rollcalls.filter(r => r.source === 'qr' && isAbsent(r));
    if (qrTasks.length === 0) {
      get().setCheckinMessage('已共享到 Center');
      return;
    }

    const cfg = useConfig.getState();
    let success = 0;
    for (const r of qrTasks) {
      try {
        await lms.doCheckin(r.rollcall_id, 'qr', { data: extracted }, cfg.clientID);
        success++;
      } catch {}
    }
    if (success > 0) {
      get().setCheckinMessage(`签到成功 (${success}门课)`);
      await get().refreshRollcalls();
    } else {
      get().setCheckinMessage('已共享到 Center（本地签到失败）');
    }
  },

  async checkinQR(rollcallID, qrData) {
    const extracted = extractQRData(qrData);
    if (!extracted) {
      get().setCheckinMessage('无效或过期的二维码');
      return;
    }
    const cfg = useConfig.getState();
    try {
      await lms.doCheckin(rollcallID, 'qr', { data: extracted }, cfg.clientID);
      get().setCheckinMessage('扫码签到成功');
      centerWS?.sendRollcallSuccess('qr', { rollcall_data: extracted });
      await get().refreshRollcalls();
    } catch (e) {
      get().setCheckinMessage(`签到失败: ${(e as Error).message}`);
    }
  },

  async checkinNumber(rollcallID, number) {
    const cfg = useConfig.getState();
    try {
      await lms.doCheckin(rollcallID, 'number', { numberCode: number }, cfg.clientID);
      get().setCheckinMessage('数字签到成功');
      centerWS?.sendRollcallSuccess('number', {
        rollcall_id: rollcallID,
        rollcall_number: parseInt(number, 10) || 0,
      });
      await get().refreshRollcalls();
    } catch (e) {
      get().setCheckinMessage(`签到失败: ${(e as Error).message}`);
    }
  },

  async checkinLocation(rollcallID, lat, lon) {
    const cfg = useConfig.getState();
    try {
      await lms.doCheckin(rollcallID, 'radar', { lat, lon }, cfg.clientID);
      get().setCheckinMessage('定位签到成功');
      await get().refreshRollcalls();
    } catch (e) {
      get().setCheckinMessage(`签到失败: ${(e as Error).message}`);
    }
  },
}));

// ------------ Service lifecycle ------------

function startServices() {
  const get = useAppState.getState;
  const set = useAppState.setState;
  const cfg = useConfig.getState();

  // CenterWS
  if (cfg.centerServerURL) {
    centerWS = new CenterWSClient(
      () => {
        const c = useConfig.getState();
        return {
          url: c.centerServerURL,
          clientID: c.clientID,
          secret: c.centerServerSecret,
          pauseSharedRollcall: c.pauseSharedRollcall,
        };
      },
      (connected) => set({ centerConnected: connected }),
      {
        async onQRShare(qrData) {
          const list = get().rollcalls;
          for (const r of list) {
            if (r.source === 'qr' && isAbsent(r)) {
              await get().checkinQR(r.rollcall_id, qrData);
              break;
            }
          }
        },
        async onNumberShare(rollcallID, number) {
          const list = get().rollcalls;
          for (const r of list) {
            if (r.rollcall_id === rollcallID && isAbsent(r)) {
              await get().checkinNumber(rollcallID, String(number));
              break;
            }
          }
        },
      },
    );
    centerWS.connect();
  }

  // Poller
  poller = new Poller(
    () => {
      const c = useConfig.getState();
      return {
        studentID: c.studentID,
        curriculumPreMinutes: c.curriculumPreMinutes,
        autoLocationCheckin: c.autoLocationCheckin,
      };
    },
    {
      refreshRollcalls: () => get().refreshRollcalls(),
      emitTodayCourses: (courses) => set({ todayCourses: courses }),
      emitPolling: (state, t) => set({ isPolling: state, lastPollTime: t }),
      sendTasksToCenter: () => {
        const list = get().rollcalls;
        const hasQR = list.some(r => r.source === 'qr' && isAbsent(r));
        const numbers = list
          .filter(r => r.source === 'number' && isAbsent(r))
          .map(r => ({ rollcall_id: r.rollcall_id, course_title: r.course_title }));
        centerWS?.sendRollcallTasks(hasQR, numbers);
      },
      autoLocationCheckin: async (inst) => {
        const { getCoords } = await import('../services/locationData');
        const coords = getCoords(inst.location);
        if (!coords) return;
        const list = get().rollcalls;
        for (const r of list) {
          if (r.source === 'radar' && isAbsent(r)) {
            await get().checkinLocation(r.rollcall_id, coords.lat, coords.lon);
          }
        }
      },
    },
  );
  poller.start();
}

function stopServices() {
  centerWS?.disconnect();
  centerWS = null;
  poller?.stop();
  poller = null;
}
