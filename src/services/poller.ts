// Mirrors CQUPTRollcall/Services/Poller.swift
//
// 30-second polling for rollcall tasks. Decides "should poll right now?"
// based on the user's curriculum (if available), otherwise falls back to
// fixed daily windows. Caches curriculum to MMKV/localStorage.

import {
  CurriculumCacheRaw,
  CurriculumDataRaw,
  CurriculumInstance,
  enrichInstance,
  isInstanceNow,
} from '../models/curriculum';
import { storage } from '../store/storage';

const CACHE_KEY = 'curriculum_cache_json';
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface PollerEnv {
  studentID: string;
  curriculumPreMinutes: number;
  autoLocationCheckin: boolean;
}

export interface PollerHooks {
  refreshRollcalls(): Promise<void>;
  emitTodayCourses(courses: CurriculumInstance[]): void;
  emitPolling(state: boolean, lastPollTime: number): void;
  sendTasksToCenter(): void;
  autoLocationCheckin(currentInstance: CurriculumInstance): Promise<void>;
}

export class Poller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private curriculum: { instances: CurriculumInstance[] } | null = null;
  private lastFetch = 0;

  constructor(
    private env: () => PollerEnv,
    private hooks: PollerHooks,
  ) {}

  start(): void {
    this.loadCurriculumFromCache();
    void this.poll();
    this.timer = setInterval(() => { void this.poll(); }, 30_000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  triggerPoll(): void { void this.poll(); }

  // ------------ Internals ------------

  private async poll() {
    await this.fetchCurriculumIfNeeded();

    if (!this.shouldPoll()) return;

    this.hooks.emitPolling(true, Date.now());
    try {
      await this.hooks.refreshRollcalls();
    } catch {}
    this.hooks.emitPolling(false, Date.now());

    this.updateTodayCourses();
    this.hooks.sendTasksToCenter();

    if (this.env().autoLocationCheckin) {
      const inst = this.findCurrentCourse();
      if (inst) {
        try { await this.hooks.autoLocationCheckin(inst); } catch {}
      }
    }
  }

  private shouldPoll(): boolean {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (!this.env().studentID) {
      // Default windows: morning / afternoon / evening
      const windows: [number, number][] = [
        [7 * 60 + 50, 12 * 60],
        [13 * 60 + 50, 18 * 60],
        [18 * 60 + 50, 22 * 60 + 40],
      ];
      return windows.some(([s, e]) => nowMin >= s && nowMin <= e);
    }

    if (!this.curriculum) return true;

    const todayStr = formatDate(now);
    const pre = this.env().curriculumPreMinutes;
    const t = now.getTime();

    for (const inst of this.curriculum.instances) {
      if (inst.date !== todayStr) continue;
      if (inst.startMs == null || inst.endMs == null) continue;
      if (t >= inst.startMs - pre * 60_000 && t <= inst.endMs) return true;
    }
    return false;
  }

  private findCurrentCourse(): CurriculumInstance | null {
    if (!this.curriculum) return null;
    const now = Date.now();
    const todayStr = formatDate(new Date(now));
    for (const inst of this.curriculum.instances) {
      if (inst.date !== todayStr) continue;
      if (inst.startMs == null || inst.endMs == null) continue;
      if (now >= inst.startMs - 15 * 60_000 && now <= inst.endMs) return inst;
    }
    return null;
  }

  private updateTodayCourses(): void {
    if (!this.curriculum) return;
    const todayStr = formatDate(new Date());
    const todayCourses = this.curriculum.instances
      .filter(c => c.date === todayStr)
      .sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
    this.hooks.emitTodayCourses(todayCourses);
  }

  // ------------ Curriculum fetch / cache ------------

  private curriculumURL(): string {
    const sid = this.env().studentID;
    if (!sid) return '';
    return `https://cqupt.ishub.top/api/curriculum/${sid}/curriculum.json`;
  }

  private async fetchCurriculumIfNeeded(): Promise<void> {
    const url = this.curriculumURL();
    if (!url) return;
    if (Date.now() - this.lastFetch < CACHE_TTL_MS) return;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as CurriculumDataRaw;
      const enriched = data.instances.map(enrichInstance);
      this.curriculum = { instances: enriched };
      this.lastFetch = Date.now();
      this.saveCurriculumCache(data);
      this.updateTodayCourses();
    } catch {
      // network error — keep cache
    }
  }

  private loadCurriculumFromCache(): void {
    const raw = storage.getString(CACHE_KEY);
    if (!raw) return;
    try {
      const cache = JSON.parse(raw) as CurriculumCacheRaw;
      const enriched = cache.data.instances.map(enrichInstance);
      this.curriculum = { instances: enriched };
      this.updateTodayCourses();
    } catch {}
  }

  private saveCurriculumCache(data: CurriculumDataRaw): void {
    const cache: CurriculumCacheRaw = {
      _updated_at: new Date().toISOString(),
      data,
    };
    storage.set(CACHE_KEY, JSON.stringify(cache));
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
