// vong-doi.mjs — luật chạy theo vòng đời nguồn × đơn vị thu (TV2a `vong-doi-nguon`, design doc
// docs/superpowers/specs/2026-10-26-vong-doi-nguon-design.md). Mọi script thu hỏi «có được thu không» qua đúng hàm này
// (TV2b), không tự đọc `status`/`enabled`. Trạng thái lạ thì chặn (fail-closed); nguồn chặn trước đơn vị.

export const TRANG_THAI = Object.freeze(["draft", "active", "paused", "retired", "completed"]);

const HOP_LE = new Set(TRANG_THAI);
const NGUON_CHAY = new Set(["active"]);

/**
 * Quyết định chạy cho một nguồn và (tuỳ chọn) một đơn vị thu.
 * @param {{code: string, status: string} | null} source  null = mã không có trong sổ
 * @param {{status: string} | null} [unit]  vắng = không hỏi đơn vị; null = hỏi mà đơn vị không có trong sổ
 * @returns {{run: boolean, ly_do: string}}
 */
export function isRunnable(source, unit) {
  if (!source) return { run: false, ly_do: "nguon-khong-co" };
  if (!HOP_LE.has(source.status)) return { run: false, ly_do: "trang-thai-la:nguon" };
  if (!NGUON_CHAY.has(source.status)) return { run: false, ly_do: `nguon-${source.status}` };
  if (unit === undefined) return { run: true, ly_do: "chay" };
  if (unit === null) return { run: false, ly_do: "don-vi-khong-co" };
  if (!HOP_LE.has(unit.status)) return { run: false, ly_do: "trang-thai-la:don-vi" };
  if (unit.status !== "active") return { run: false, ly_do: `don-vi-${unit.status}` };
  return { run: true, ly_do: "chay" };
}
