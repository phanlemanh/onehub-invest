#!/usr/bin/env node
// ghep-tin-truc-can-lat.mjs — PL36 (AC-10, Hỏi-2 Mạnh chốt 24/11): rút lát nhãn trục hai-khu-truc từ bài OP1 máy gắn trục hay căn.
//   --rut --seed <s> [--co 110] [--ra <thư mục>]  chỉ đọc; ghi tệp đóng băng có băm vào pipeline/eval-sets/
//   --nap <tệp>                                   ghi eval_label_items của lát (giám sát chạy trên DB máy thu); chạy lại không nhân dòng
// Mỗi tin một bài; bỏ bài của các lát hai khu trước; trùng chữ bài thì bỏ. Trợ lý gắn nháp rồi Mạnh duyệt trên /ops/labels.
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { bamDong } from "../label-dong-bang.mjs";
import { textHash } from "../lib/eval-labels.mjs";
import { KHU_SLUG } from "../lib/mau-hai-khu.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-truc-can-doc.mjs";

export const LAT = "hai-khu-truc";
const LAT_DA_DUNG = ["hai-khu-ghep", "hai-khu-ghep-b", "hai-khu-ghep-c"];
const THU_MUC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../eval-sets");
const bam = (s) => createHash("sha256").update(s).digest("hex");

/**
 * Rút ngẫu nhiên theo tin trong khu `duAn`: mỗi tin một bài máy gắn trục hay căn, thứ tự theo băm (seed, offer_id).
 * @param {Map<string, object>} ketQuaBai kết quả luật theo bài
 * @param {{offer_id: string, post_ids: string[]}[]} tin
 */
export function rutMau({ ketQuaBai, bai, tin }, { seed, co = 110, duAn, boBai = new Set() }) {
  const ds = [];
  for (const t of tin) {
    const ung = (t.post_ids ?? []).filter((p) => ketQuaBai.get(p)?.muc && ketQuaBai.get(p).du_an === duAn && !boBai.has(p) && (bai.get(p)?.chu ?? "").trim());
    if (!ung.length) continue;
    ds.push({ offer_id: t.offer_id, ref_id: ung.sort((a, b) => bam(`${seed}|${a}`).localeCompare(bam(`${seed}|${b}`)))[0] });
  }
  ds.sort((a, b) => bam(`${seed}:${a.offer_id}`).localeCompare(bam(`${seed}:${b.offer_id}`)));
  const mau = [], daBam = new Set();
  for (const { offer_id, ref_id } of ds) {
    if (mau.length >= co) break;
    const text_hash = textHash(bai.get(ref_id).chu);
    if (daBam.has(text_hash)) continue;
    daBam.add(text_hash);
    const x = ketQuaBai.get(ref_id);
    mau.push({ ref_id, offer_id, stratum: "op1-truc", muc: x.muc, stack: x.stack, truc: x.can_cu?.truc ?? null, toa: x.can_cu?.toa ?? null,
      tang: x.tang ?? null, unit: x.unit ?? null, ma: x.can_cu?.ma ?? null, rule_id: x.rule_id, text_hash });
  }
  return { mau, tong_the: ds.length, thieu: Math.max(0, co - mau.length) };
}

/** Đầu ra máy đã sắp kèm băm: đổi một dòng là đổi băm. */
export function dongBangMau(mau, seed) {
  const dong = [...mau].sort((a, b) => a.ref_id.localeCompare(b.ref_id)).map((x) => Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])));
  return { lat: LAT, seed, sha256: bamDong(dong), so_bai: dong.length, dong };
}

async function main() {
  const a = process.argv.slice(2);
  const g = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  if (a.includes("--rut")) {
    const seed = g("--seed"); if (!seed) { console.error("lenh: --rut --seed <s>"); return 2; }
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on" });
    await c.connect();
    try {
      const vao = await docDauVao(c);
      const kq = tinhGan(vao);
      const { rows: [{ id: duAn }] } = await c.query(`SELECT id::text FROM asset_nodes WHERE node_type = 'project' AND slug = $1`, [KHU_SLUG.op1]);
      const { rows: tin } = await c.query(`SELECT offer_id, post_ids FROM sale_offers WHERE source = 'S03' AND property_type = 'apartment'`);
      const { rows: cu } = await c.query(`SELECT ref_id FROM eval_label_items WHERE lat = ANY ($1)`, [LAT_DA_DUNG]);
      const r = rutMau({ ketQuaBai: kq.ketQuaBai, bai: vao.bai, tin }, { seed, co: Number(g("--co", 110)), duAn, boBai: new Set(cu.map((x) => x.ref_id)) });
      const x = dongBangMau(r.mau, seed);
      const ra = g("--ra", THU_MUC); mkdirSync(ra, { recursive: true });
      const tep = path.join(ra, `${LAT}-${seed}.json`);
      writeFileSync(tep, JSON.stringify(x, null, 1) + "\n");
      console.log(`lat-truc: ${x.so_bai} bài (tổng thể ${r.tong_the} tin, thiếu ${r.thieu}) · sha256 ${x.sha256} → ${tep}`);
    } finally { await c.end(); }
    return 0;
  }
  if (a.includes("--nap")) {
    const { docTapDongBang } = await import("../label-dong-bang.mjs");
    const x = docTapDongBang(g("--nap"));
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
    try {
      await c.query("BEGIN");
      let them = 0;
      for (const d of x.dong) them += (await c.query(
        `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum)
         VALUES ($1, 'S03', $2, $3, 'test', false, $4, $5) ON CONFLICT DO NOTHING`, [x.lat, d.ref_id, d.text_hash, x.seed, d.stratum])).rowCount;
      await c.query("COMMIT");
      console.log(`lat-truc: thêm ${them}/${x.so_bai} bài vào lát ${x.lat}`);
    } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; } finally { await c.end(); }
    return 0;
  }
  console.error("lenh: --rut --seed <s> [--co N] [--ra <thu muc>] | --nap <tep>");
  return 2;
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = await main();
