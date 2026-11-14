#!/usr/bin/env node
// label-dong-bang.mjs — PL35 tap-nhan-ghep-tin-hai-khu (AC-8): đóng băng nhãn người của một lát thành tệp JSON chuẩn hoá có băm,
// làm tập test cho PL20 (đo cận dưới Wilson theo tầng).
//   node pipeline/label-dong-bang.mjs --lat hai-khu-ghep [--ra pipeline/eval-sets]
// Mỗi bài đã có nhãn người → đúng một dòng {building, ref_id, stack, stratum, unit_number} (giá trị người gắn; «không nêu»
// hay bỏ trống là null). Bài hai người gắn lệch nhau ở bất kỳ trường nào bị loại và đếm riêng. Tệp không có chữ bài, câu
// trích, người gắn. Băm sha256 tính trên mảng dòng đã sắp (theo ref_id, khoá sắp chữ cái) và ghi trong tệp; tên tệp mang
// 12 ký tự đầu của băm, nên cùng dữ liệu → cùng tệp, đổi một nhãn → tệp mới; tệp cũ không bị sửa.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

export const TRUONG_DONG_BANG = Object.freeze(["building", "stack", "unit_number"]);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Băm sha256 của mảng dòng (đã chuẩn hoá) — hàm duy nhất bên ghi và bên đọc (PL20) cùng dùng. */
export const bamDong = (dong) => createHash("sha256").update(JSON.stringify(dong)).digest("hex");

/**
 * Dòng nhãn → tập đóng băng. Thuần, tất định.
 * @param {{ ref_id: string, stratum: string|null, labeler_id: string, field: string, value: string|null }[]} nhan
 * @returns {{ dong: object[], bo_lech: string[], sha256: string }}
 */
export function dongBang(nhan) {
  const theoBai = new Map();
  for (const n of nhan) {
    if (!TRUONG_DONG_BANG.includes(n.field)) continue;
    const b = theoBai.get(n.ref_id) ?? { stratum: n.stratum ?? null, nguoi: new Map() };
    const g = b.nguoi.get(n.labeler_id) ?? {};
    g[n.field] = n.value === undefined || n.value === "" ? null : n.value;
    b.nguoi.set(n.labeler_id, g);
    theoBai.set(n.ref_id, b);
  }
  // Bài có nhãn người nhưng không chạm ba trường (người chỉ lưu ô khác) vẫn là bài đã duyệt: đọc tên người từ mọi dòng.
  for (const n of nhan) {
    const b = theoBai.get(n.ref_id) ?? { stratum: n.stratum ?? null, nguoi: new Map() };
    if (!b.nguoi.has(n.labeler_id)) b.nguoi.set(n.labeler_id, {});
    theoBai.set(n.ref_id, b);
  }
  const dong = [], bo_lech = [];
  for (const ref_id of [...theoBai.keys()].sort()) {
    const b = theoBai.get(ref_id);
    const ba = [...b.nguoi.values()].map((g) => Object.fromEntries(TRUONG_DONG_BANG.map((f) => [f, g[f] ?? null])));
    if (ba.some((x) => JSON.stringify(x) !== JSON.stringify(ba[0]))) { bo_lech.push(ref_id); continue; }
    const d = { ...ba[0], ref_id, stratum: b.stratum };
    dong.push(Object.fromEntries(Object.keys(d).sort().map((k) => [k, d[k]])));
  }
  return { dong, bo_lech, sha256: bamDong(dong) };
}

/** Đọc tệp đóng băng và kiểm băm (cho PL20). Băm sai thì ném lỗi. */
export function docTapDongBang(tep) {
  const x = JSON.parse(readFileSync(tep, "utf8"));
  const tinh = bamDong(x.dong);
  if (tinh !== x.sha256) throw new Error(`label-dong-bang: băm trong tệp ${x.sha256} khác băm tính lại ${tinh}`);
  return x;
}

/** @param {import("pg").Client} c */
export async function dongBangLat(c, { lat, ra = path.join(ROOT, "pipeline/eval-sets") }) {
  const { rows } = await c.query(
    `SELECT i.ref_id, i.stratum, l.labeler_id, l.field, l.value
       FROM eval_labels l JOIN eval_label_items i USING (item_id)
      WHERE i.lat = $1 ORDER BY i.ref_id, l.labeler_id, l.field`, [lat]);
  const { dong, bo_lech, sha256 } = dongBang(rows);
  const tep = path.join(ra, `${lat}-${sha256.slice(0, 12)}.json`);
  const noiDung = JSON.stringify({ lat, sha256, so_dong: dong.length, so_bo_lech: bo_lech.length, dong }, null, 1) + "\n";
  const daCo = existsSync(tep);
  if (!daCo) { mkdirSync(ra, { recursive: true }); writeFileSync(tep, noiDung); }
  return { lat, tep, sha256, so_dong: dong.length, so_bo_lech: bo_lech.length, da_co: daCo };
}

function docCo(argv) {
  const co = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--lat") co.lat = argv[++i];
    else if (a === "--ra") co.ra = path.resolve(argv[++i]);
    else throw new Error(`label-dong-bang: cờ lạ «${a}»`);
  }
  if (!co.lat) throw new Error("label-dong-bang: thiếu --lat");
  return co;
}

async function main() {
  const co = docCo(process.argv.slice(2));
  const c = new pg.Client({ connectionString: DATABASE_URL });
  await c.connect();
  try {
    const kq = await dongBangLat(c, co);
    console.log(`label-dong-bang: lát ${kq.lat} · ${kq.so_dong} dòng · loại vì hai người lệch ${kq.so_bo_lech}`);
    console.log(`sha256 ${kq.sha256}`);
    console.log(`${kq.da_co ? "đã có (cùng dữ liệu, không ghi lại)" : "ghi"} ${path.relative(process.cwd(), kq.tep)}`);
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
