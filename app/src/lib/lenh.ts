/**
 * Lệnh có khuôn (TV4 `so-lenh-bo-ap`, ADR-0015) — bản TS cho route cloud của hàm kiểm khuôn ở pipeline/lib/lenh.mjs.
 * Hai bản phải trả giống hệt nhau trên mọi ô (test SL-AC-5b ở pipeline/scripts/lenh.test.mjs so từng ô).
 */

/** 14 loại lệnh của ADR-0015 §4 — bằng CHECK change_requests_type_chk của 091. */
export const LOAI_LENH = Object.freeze([
  "unit.create", "unit.update_meta", "unit.enable", "unit.disable", "unit.retire",
  "source.pause", "source.resume", "source.set_schedule", "source.set_slo",
  "context_rule.publish", "context_rule.retire", "coverage_target.set", "job.rerun", "review.decide",
] as const);

/** Loại đã có bộ áp ở vòng này. */
export const LOAI_CO_BO_AP = Object.freeze(["source.pause", "source.resume"] as const);
export type LoaiCoBoAp = (typeof LOAI_CO_BO_AP)[number];

/** 11 khoá cấm của ADR-0015 §7 (an toàn Zalo) — nguyên dạng văn bản; `x.*` cấm x và mọi khoá con. */
export const KHOA_CAM = Object.freeze([
  "bindings", "channels.zalo", "plugins.entries.zalo", "agents.*", "talk", "commands.*",
  "hooks.internal.*", "pluginHooks", "groupPolicy", "groupAllowFrom", "requireMention",
] as const);

const KHOA_PAYLOAD: Record<LoaiCoBoAp, readonly string[]> = { "source.pause": ["reason", "resume_when"], "source.resume": [] };

export type KetQuaKiem = { ok: true } | { ok: false; ly_do: string };

const laDoiTuong = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

function khoaCamCua(duong: string[]): string | null {
  for (const k of KHOA_CAM) {
    const doan = k.replace(/\.\*$/, "").split(".");
    for (let i = 0; i + doan.length <= duong.length; i++) {
      if (doan.every((d, j) => duong[i + j] === d)) return k;
    }
  }
  return null;
}

function timKhoaCam(v: unknown, duong: string[] = []): string | null {
  if (Array.isArray(v)) {
    for (const x of v) {
      const k = timKhoaCam(x, duong);
      if (k) return k;
    }
    return null;
  }
  if (!laDoiTuong(v)) return null;
  for (const [ten, x] of Object.entries(v)) {
    const d = [...duong, ten];
    const k = khoaCamCua(d) ?? timKhoaCam(x, d);
    if (k) return k;
  }
  return null;
}

/** Kiểm khuôn một lệnh — cùng thứ tự và cùng mã lý do với bản .mjs. */
export function kiemLenh(cmd: { type?: unknown; target?: unknown; payload?: unknown } | null | undefined): KetQuaKiem {
  const type = cmd?.type;
  if (typeof type !== "string" || !(LOAI_LENH as readonly string[]).includes(type)) return { ok: false, ly_do: `loai-la:${String(type)}` };
  if (!(LOAI_CO_BO_AP as readonly string[]).includes(type)) return { ok: false, ly_do: `loai-chua-co-bo-ap:${type}` };
  if (typeof cmd?.target !== "string" || !/^S\d{2}$/.test(cmd.target)) return { ok: false, ly_do: "target-sai-khuon" };
  const cam = timKhoaCam(cmd);
  if (cam) return { ok: false, ly_do: `khoa-cam:${cam}` };
  const payload = cmd.payload === undefined ? {} : cmd.payload;
  if (!laDoiTuong(payload)) return { ok: false, ly_do: "payload-sai-khuon" };
  const thua = Object.keys(payload).find((k) => !KHOA_PAYLOAD[type as LoaiCoBoAp].includes(k));
  if (thua) return { ok: false, ly_do: `khoa-thua:${thua}` };
  if (type === "source.pause" && (typeof payload.reason !== "string" || payload.reason.trim() === "")) {
    return { ok: false, ly_do: "thieu-reason" };
  }
  return { ok: true };
}
