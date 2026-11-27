#!/usr/bin/env node
// ghep-tin-truc-can-soat-nhan.mjs — PL36 việc 10: soát nhãn trục, mã căn đã lưu theo quy ước «Mã căn» (CONTEXT.md, Mạnh chốt 24/11).
// Chỉ đọc. Với mỗi bài S03 hai khu có nhãn mã căn: tách mã bằng hàm dùng chung `tachMa`, so với nhãn toà và nhãn trục người đã lưu;
// in nhãn lệch (lát, bài, mã, toà nhãn ↔ toà theo quy ước, trục nhãn ↔ trục theo quy ước) để Mạnh xem lại.
// Chạy: DATABASE_URL=… node scripts/ghep-tin-truc-can-soat-nhan.mjs
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { docDanhBa } from "../lib/ghep-tin-truc-can-doc.mjs";
import { chuanTen, chuanTruc, tachMa } from "../lib/ghep-tin-truc-can.mjs";

/** So một bài: nhãn mã căn tách theo quy ước có ra đúng toà, trục người đã ghi không. */
export function soatBai({ ma, building, stack }, tenToa) {
  const t = tachMa(ma, tenToa);
  if (!t.toa) return { lech: "ma-khong-tach-duoc", theo_quy_uoc: t.ly_do };
  const toaQuyUoc = t.tenToa;
  const lech = [];
  if (building && chuanTen(building) !== chuanTen(toaQuyUoc)) lech.push("toa");
  if (stack && chuanTruc(stack) !== t.truc) lech.push("truc");
  return lech.length ? { lech: lech.join("+"), toa_quy_uoc: toaQuyUoc, truc_quy_uoc: t.truc } : null;
}

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on" });
  await c.connect();
  try {
    const { danhBa } = await docDanhBa(c);
    const { rows } = await c.query(
      `SELECT i.lat, i.ref_id, g.value AS du_an,
              max(l.value) FILTER (WHERE l.field = 'unit_number' AND NOT l.not_stated) AS ma,
              max(l.value) FILTER (WHERE l.field = 'building' AND NOT l.not_stated) AS building,
              max(l.value) FILTER (WHERE l.field = 'stack' AND NOT l.not_stated) AS stack
         FROM eval_label_items i JOIN eval_labels l ON l.item_id = i.item_id
         LEFT JOIN LATERAL (SELECT value FROM field_assertions f WHERE f.subject_key = 'S03:' || i.ref_id AND f.field = 'project_node_id'
                              AND f.retracted_at IS NULL LIMIT 1) g ON true
        WHERE i.source_code = 'S03' GROUP BY 1, 2, 3`);
    // project_node_id có thể là dự án con: đi lên dự án của danh bạ
    const { rows: nut } = await c.query(`SELECT id::text, parent_id::text FROM asset_nodes`);
    const cha = new Map(nut.map((n) => [n.id, n.parent_id]));
    const duAnGoc = (id) => { for (let n = id, i = 0; n && i < 16; n = cha.get(n), i++) if (danhBa.has(n)) return n; return null; };
    let so = 0;
    const lech = [];
    for (const r of rows) {
      if (!r.ma) continue;
      const d = danhBa.get(duAnGoc(r.du_an));
      if (!d) continue;
      so++;
      const x = soatBai(r, d.tenToa);
      if (x) lech.push({ lat: r.lat, ref_id: r.ref_id, ma: r.ma, toa_nhan: r.building, truc_nhan: r.stack, ...x });
    }
    console.log(`Soát nhãn mã căn hai khu: ${so} bài có nhãn mã căn · ${lech.length} lệch quy ước`);
    for (const x of lech) console.log(`  ${x.lat} ${x.ref_id} · mã ${x.ma} · lệch ${x.lech} · toà nhãn ${x.toa_nhan ?? "-"} ↔ ${x.toa_quy_uoc ?? "-"} · trục nhãn ${x.truc_nhan ?? "-"} ↔ ${x.truc_quy_uoc ?? x.theo_quy_uoc ?? "-"}`);
  } finally { await c.end(); }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
