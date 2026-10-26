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

/**
 * Đọc trạng thái theo MÃ (không theo tên nguồn) rồi quyết định chạy.
 * @param {{query: Function}} client  pg client đã kết nối
 * @param {string} code  mã nguồn S0x
 * @param {string} [unitKey]  group_key của đơn vị trong source_groups; vắng = không hỏi đơn vị
 */
export async function docTrangThai(client, code, unitKey) {
  const src = (await client.query(`SELECT code, status FROM source_registry WHERE code = $1`, [code])).rows[0] ?? null;
  if (unitKey === undefined) return isRunnable(src);
  const unit = (await client.query(`SELECT status FROM source_groups WHERE source_code = $1 AND group_key = $2`, [code, unitKey])).rows[0] ?? null;
  return isRunnable(src, unit);
}

// CLI cho script bash (TV2b): node pipeline/lib/vong-doi.mjs <mã> [--unit <group_key>]
// In đúng một dòng JSON {code, run, ly_do} — không in group_key hay reason (có thể mang tầng A).
// Thoát 0 = chạy · 3 = không chạy · 2 = lỗi (đối số, DB).
async function main(argv) {
  const [code, ...rest] = argv;
  const i = rest.indexOf("--unit");
  const unitKey = i >= 0 ? rest[i + 1] : undefined;
  if (!code || code.startsWith("-") || (i >= 0 && unitKey === undefined)) {
    console.error("cách dùng: node pipeline/lib/vong-doi.mjs <mã> [--unit <group_key>]");
    return 2;
  }
  const pg = (await import("pg")).default;
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  try {
    await client.connect();
    const kq = await docTrangThai(client, code, unitKey);
    console.log(JSON.stringify({ code, run: kq.run, ly_do: kq.ly_do }));
    return kq.run ? 0 : 3;
  } catch (e) {
    console.error(`vong-doi: không đọc được trạng thái (${e.code ?? e.message})`);
    return 2;
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
