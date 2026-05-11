// Mirrors CQUPTRollcall/Models/Curriculum.swift

export interface CurriculumInstanceRaw {
  date: string;        // "2026-05-11"
  start_time: string;  // "08:00"
  end_time: string;    // "09:40"
  course: string;
  location: string;
}

export interface CurriculumDataRaw {
  instances: CurriculumInstanceRaw[];
}

export interface CurriculumCacheRaw {
  _updated_at: string;
  data: CurriculumDataRaw;
}

export interface CurriculumInstance extends CurriculumInstanceRaw {
  id: string;
  startMs: number | null;
  endMs: number | null;
}

/** Parse "yyyy-MM-dd HH:mm" as local time */
function parseLocal(date: string, hm: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (!m || !t) return null;
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(t[1]),
    Number(t[2]),
    0,
    0
  );
  return d.getTime();
}

export function enrichInstance(raw: CurriculumInstanceRaw): CurriculumInstance {
  return {
    ...raw,
    id: `${raw.date}-${raw.start_time}-${raw.course}`,
    startMs: parseLocal(raw.date, raw.start_time),
    endMs: parseLocal(raw.date, raw.end_time),
  };
}

/** Within 15 minutes before start through end */
export function isInstanceNow(inst: CurriculumInstance, now = Date.now()): boolean {
  if (inst.startMs == null || inst.endMs == null) return false;
  return now >= inst.startMs - 15 * 60 * 1000 && now <= inst.endMs;
}
