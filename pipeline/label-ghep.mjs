#!/usr/bin/env node
// label-ghep.mjs — hồ sơ ghep-anh-tren-the-gan-nhan: ghi cột `eval_label_items.ghep` của một lát.
// node pipeline/label-ghep.mjs --lat <lát> [--thu] [--lam-lai] [--db-that]
// Ghi một lần để hai người gắn cùng thấy một cụm dù sau đó thu thêm bài: lát đã có ghép thì giữ, muốn tính lại phải `--lam-lai`.
// Chỉ đọc và ghi cột này, không đổi dòng mẫu. Đích không phải DB thử thì phải khai `--db-that`.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { ghepChoMau } from "./lib/ghep-mau.mjs";
import { loadStgPosts } from "./lib/test-posts.mjs";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** DB thử: máy này, tên `oneinvest_<việc>` (db/db-thu.sh). */
export function laDbThu(url) {
  const u = new URL(url);
  return ["localhost", "127.0.0.1"].includes(u.hostname) && /^\/oneinvest_\w+$/.test(u.pathname);
}

// jsonb không giữ thứ tự khoá.
const giongNhau = (a, b) => {
  if (a === null || b === null) return a === b;
  return Object.keys(b).every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k])) && Object.keys(a).length === Object.keys(b).length;
};

/** @returns {Promise<{ lat: string, dong: number, co_ghep: number, nhan_ghep: number, trung: number, ghi: number, giu?: boolean, thieu_cot?: boolean }>} */
export async function ghepLat(client, { lat, thu = false, lamLai = false }) {
  const { rows: cot } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'eval_label_items' AND column_name = 'ghep'`);
  if (!cot.length) return { lat, dong: 0, co_ghep: 0, nhan_ghep: 0, trung: 0, ghi: 0, thieu_cot: true };
  const { rows: items } = await client.query(`SELECT item_id, ref_id, ghep FROM eval_label_items WHERE lat = $1 ORDER BY item_id`, [lat]);
  const daCo = items.some((i) => i.ghep != null);
  const { posts } = await loadStgPosts(client, "zalo");
  const ghep = ghepChoMau(items, posts);
  const gs = [...ghep.values()].filter(Boolean);
  const kq = { lat, dong: items.length, co_ghep: gs.length, nhan_ghep: gs.filter((g) => g.chu_ref).length, trung: gs.filter((g) => g.trung_voi).length, ghi: 0 };
  if (thu) return kq;
  if (daCo && !lamLai) return { ...kq, giu: true };
  for (const it of items) {
    const g = ghep.get(String(it.item_id)) ?? null;
    if (giongNhau(it.ghep ?? null, g)) continue;
    await client.query(`UPDATE eval_label_items SET ghep = $2::jsonb WHERE item_id = $1`, [it.item_id, g ? JSON.stringify(g) : null]);
    kq.ghi++;
  }
  return kq;
}

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--lat");
  const lat = i >= 0 ? argv[i + 1] : null;
  if (!lat) throw new Error("label-ghep: thiếu --lat");
  const thu = argv.includes("--thu");
  if (!laDbThu(DATABASE_URL) && !thu && !argv.includes("--db-that")) {
    throw new Error("label-ghep: đích không phải DB thử — khai --db-that nếu chủ ý ghi DB thật");
  }
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const kq = await ghepLat(client, { lat, thu, lamLai: argv.includes("--lam-lai") });
    if (kq.thieu_cot) throw new Error("label-ghep: thiếu cột ghep — áp migration 076 trước");
    console.log(`label-ghep: lát ${kq.lat} · ${kq.dong} dòng · có ghép ${kq.co_ghep} · nhãn ghép ${kq.nhan_ghep} · trùng cụm ${kq.trung} · ghi ${kq.ghi}${thu ? " (--thu)" : ""}${kq.giu ? " · lát đã có ghép, giữ nguyên, tính lại phải --lam-lai" : ""}`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
