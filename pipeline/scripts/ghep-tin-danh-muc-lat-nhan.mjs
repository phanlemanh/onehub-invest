#!/usr/bin/env node
// ghep-tin-danh-muc-lat-nhan.mjs — PL20 (AC-9): rút lát nhãn hai-khu-ghep-b từ chính các tin máy gắn và đóng băng đầu ra của máy.
//   --rut --seed <s> [--co 110] [--ra <thư mục>]   chỉ đọc; ghi tệp đóng băng có băm
//   --nap <tệp>                                    ghi eval_label_items của lát (giám sát chạy trên DB máy thu); chạy lại không nhân dòng
// Hai nhóm chấm riêng: n1 ô tên toà (A, B) · n2 chữ bài cùng model (C, F). Nguồn D, G đang tắt. Không điền nháp.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { bamDong } from "../label-dong-bang.mjs";
import { textHash } from "../lib/eval-labels.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-danh-muc-doc.mjs";

export const LAT = "hai-khu-ghep-b";
export const NHOM_CUA_NGUON = Object.freeze({ A: "n1", B: "n1", C: "n2", F: "n2" });
const THU_MUC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../eval-sets");
const bam = (s) => createHash("sha256").update(s).digest("hex");

/**
 * Mỗi nhóm rút ngẫu nhiên theo tin, mỗi tin một bài do chính nguồn của tin gắn. `boBai`: bài của lát khác, không lấy lại.
 * @returns {{ mau: object[], thieu: Record<string, number>, tong_the: Record<string, number> }}
 */
export function rutMau({ tin, bai }, { theoTin, ketQuaBai }, { seed, co = 110, boBai = new Set() }) {
  const theoNhom = { n1: [], n2: [] };
  for (const t of tin) {
    const g = theoTin.get(t.offer_id);
    if (g?.status !== "gan" || !NHOM_CUA_NGUON[g.nguon]) continue;
    const ds = (t.post_ids ?? []).filter((p) => ketQuaBai.get(p)?.nguon === g.nguon && !boBai.has(p) && (bai.get(p)?.chu ?? "").trim());
    if (!ds.length) continue;
    const p = ds.sort((a, b) => bam(`${seed}|${a}`).localeCompare(bam(`${seed}|${b}`)))[0];
    theoNhom[NHOM_CUA_NGUON[g.nguon]].push({ offer_id: t.offer_id, ref_id: p });
  }
  const mau = [], thieu = {}, tong_the = {}, daBam = new Set();
  for (const [nhom, ds] of Object.entries(theoNhom)) {
    tong_the[nhom] = ds.length;
    ds.sort((a, b) => bam(`${seed}:${nhom}:${a.offer_id}`).localeCompare(bam(`${seed}:${nhom}:${b.offer_id}`)));
    let lay = 0;
    for (const { offer_id, ref_id } of ds) {
      if (lay >= co) break;
      const text_hash = textHash(bai.get(ref_id).chu);
      if (daBam.has(text_hash)) continue;
      daBam.add(text_hash);
      const x = ketQuaBai.get(ref_id);
      mau.push({ ref_id, stratum: nhom, offer_id, du_an: String(x.du_an), muc: x.muc, k: String(x.k), nguon: x.nguon, rule_id: x.rule_id, text_hash });
      lay++;
    }
    if (lay < co) thieu[nhom] = co - lay;
  }
  return { mau, thieu, tong_the };
}

/** Đầu ra máy đã sắp kèm băm: đổi một nút là đổi băm. */
export function dongBangMau(mau, seed) {
  const dong = [...mau].sort((a, b) => a.ref_id.localeCompare(b.ref_id)).map((x) => Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])));
  return { lat: LAT, seed, sha256: bamDong(dong), so_bai: dong.length, dong };
}

/** Đọc tệp đóng băng và kiểm băm. */
export function docTepMau(tep) {
  const x = JSON.parse(readFileSync(tep, "utf8"));
  const tinh = bamDong(x.dong);
  if (tinh !== x.sha256) throw new Error(`lat-nhan: băm trong tệp ${x.sha256} khác băm tính lại ${tinh}`);
  return x;
}

async function main() {
  const a = process.argv.slice(2);
  const lay = (k) => { const i = a.indexOf(k); return i < 0 ? undefined : a[i + 1]; };
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    if (a.includes("--rut")) {
      const seed = lay("--seed");
      if (!seed) { console.error("can --seed"); return 2; }
      await c.query("SET default_transaction_read_only = on");
      const vao = await docDauVao(c);
      const { rows } = await c.query(`SELECT ref_id FROM eval_label_items WHERE lat = 'hai-khu-ghep'`);
      const r = rutMau(vao, tinhGan(vao), { seed, co: Number(lay("--co") ?? 110), boBai: new Set(rows.map((x) => x.ref_id)) });
      const x = dongBangMau(r.mau, seed);
      const ra = lay("--ra") ? path.resolve(lay("--ra")) : THU_MUC;
      const tep = path.join(ra, `${LAT}-dau-ra-${x.sha256.slice(0, 12)}.json`);
      if (!existsSync(tep)) { mkdirSync(ra, { recursive: true }); writeFileSync(tep, `${JSON.stringify(x, null, 1)}\n`); }
      console.log(`lat-nhan: ${x.so_bai} bai · tong the ${JSON.stringify(r.tong_the)} · thieu ${JSON.stringify(r.thieu)}`);
      console.log(`sha256 ${x.sha256}`);
      console.log(tep);
      return Object.keys(r.thieu).length ? 3 : 0;
    }
    if (lay("--nap")) {
      const x = docTepMau(lay("--nap"));
      await c.query("BEGIN");
      try {
        const { rows } = await c.query(`SELECT ref_id FROM eval_label_items WHERE lat = $1`, [LAT]);
        const ds = new Set(x.dong.map((d) => d.ref_id));
        const la = rows.filter((r) => !ds.has(r.ref_id)).map((r) => r.ref_id);
        if (la.length) throw new Error(`lat-nhan: lát đã có ${la.length} bài ngoài tệp đóng băng, ví dụ ${la[0]}`);
        let them = 0;
        for (const d of x.dong) them += (await c.query(
          `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum)
           VALUES ($1, 'S03', $2, $3, 'test', false, $4, $5) ON CONFLICT DO NOTHING`, [LAT, d.ref_id, d.text_hash, x.seed, d.stratum])).rowCount;
        await c.query("COMMIT");
        console.log(`lat-nhan: them ${them}/${x.so_bai} bai vao lat ${LAT}`);
      } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; }
      return 0;
    }
    console.error("lenh: --rut --seed <s> [--co N] [--ra <thu muc>] | --nap <tep>");
    return 2;
  } finally {
    await c.end();
  }
}

const laChinh = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (laChinh) main().then((m) => { process.exitCode = m; }, (e) => { console.error(e.message ?? e); process.exitCode = 1; });
