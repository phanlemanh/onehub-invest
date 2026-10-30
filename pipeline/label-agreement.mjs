#!/usr/bin/env node
// label-agreement.mjs — PL7 `man-gan-nhan-mu` (AC-6, đường đo): đồng thuận từng trường trên phần gắn trùng và phút công
// theo người gắn. Đọc view eval_label_agreement (một chỗ tính, trang /ops/labels đọc chung) — chỉ đọc, thoát 0.
//   node pipeline/label-agreement.mjs --lat ocp1 [--json]
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { NGHI_PHUT, phutCong, thapNhat } from "./lib/eval-labels.mjs";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** @param {import("pg").Client} client */
export async function docDongThuan(client, lat) {
  const { rows } = await client.query(
    `SELECT field, cap_du, khop, ti_le::float8 AS ti_le FROM eval_label_agreement WHERE lat = $1 ORDER BY field`, [lat]);
  const { rows: moc } = await client.query(
    `SELECT DISTINCT l.labeler_id, l.labeled_at FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1`,
    [lat]);
  return { lat, truong: rows, thap_nhat: thapNhat(rows), phut_cong: phutCong(moc), nghi_phut: NGHI_PHUT };
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--lat");
  const lat = i >= 0 ? args[i + 1] : null;
  if (!lat) throw new Error("label-agreement: thiếu --lat");
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const kq = await docDongThuan(client, lat);
    if (args.includes("--json")) {
      console.log(JSON.stringify(kq));
      return;
    }
    if (kq.truong.length === 0) console.log(`label-agreement: lát ${lat} chưa có tin nào`);
    for (const t of kq.truong) {
      console.log(`${t.field} cap_du=${t.cap_du} khop=${t.khop} ti_le=${t.ti_le === null ? "chua-du-cap" : t.ti_le}`);
    }
    console.log(kq.thap_nhat ? `thap_nhat ${kq.thap_nhat.field} ${kq.thap_nhat.ti_le}` : "thap_nhat chua-du-cap");
    for (const [id, phut] of Object.entries(kq.phut_cong)) console.log(`phut_cong ${id} ${phut}`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
