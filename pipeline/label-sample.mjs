#!/usr/bin/env node
// label-sample.mjs — PL7 `man-gan-nhan-mu` (AC-2): chọn tin của một lát vào eval_label_items để người gắn nhãn mù.
//   node pipeline/label-sample.mjs --lat ocp1 --n 200 --seed <s> [--nhom-khop <regex>] [--thu]
// Tin S03 ở stg_zalo_posts, gạt post thử bằng ĐÚNG bộ lọc của transform (lib/test-posts.mjs, L19), lọc nhóm theo mẫu tên
// của lát, khử trùng theo nội dung, chọn tất định theo seed (lib/eval-labels.mjs). Chạy lại cùng tham số: 0 dòng thêm.
// --thu: chỉ in, không ghi. Bảng chỉ ở máy thu (054_labels.sql).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { loadStgPosts } from "./lib/test-posts.mjs";
import { chonMau, LAT_NHOM } from "./lib/eval-labels.mjs";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

function docCo(argv) {
  const co = { thu: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--thu") co.thu = true;
    else if (["--lat", "--n", "--seed", "--nhom-khop"].includes(a)) co[a.slice(2)] = argv[++i];
    else throw new Error(`label-sample: cờ lạ «${a}»`);
  }
  if (!co.lat || !/^[a-z0-9-]+$/.test(co.lat)) throw new Error("label-sample: thiếu --lat (chữ thường, số, gạch nối)");
  const n = Number(co.n);
  if (!Number.isInteger(n) || n <= 0) throw new Error("label-sample: --n phải là số nguyên dương");
  if (!co.seed) throw new Error("label-sample: thiếu --seed");
  const mau = co["nhom-khop"] ?? LAT_NHOM[co.lat];
  if (!mau) throw new Error(`label-sample: lát «${co.lat}» chưa có mẫu tên nhóm — truyền --nhom-khop`);
  return { lat: co.lat, n, seed: co.seed, nhom: new RegExp(mau, "i"), thu: co.thu };
}

/** @param {import("pg").Client} client */
export async function layMau(client, { lat, n, seed, nhom, thu }) {
  const { rows: cu } = await client.query(
    `SELECT count(*)::int AS so, array_agg(DISTINCT seed) AS seeds FROM eval_label_items WHERE lat = $1`, [lat]);
  if (cu[0].so > 0 && !(cu[0].seeds.length === 1 && cu[0].seeds[0] === seed)) {
    throw new Error(`label-sample: lát «${lat}» đã lấy mẫu với seed khác (${cu[0].seeds.join(", ")}) — không trộn hai mẫu`);
  }
  const { posts, rejected } = await loadStgPosts(client, "zalo");
  const cuaLat = posts.filter((p) => nhom.test(p.group_name ?? ""));
  const { chon, khac_nhau } = chonMau(cuaLat, { n, seed });
  let them = 0;
  if (!thu && cu[0].so < n) {
    await client.query("BEGIN");
    try {
      for (const r of chon) {
        const res = await client.query(
          `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed)
           VALUES ($1, 'S03', $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [lat, r.ref_id, r.text_hash, r.split, r.double_label, seed]);
        them += res.rowCount;
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
  }
  return {
    lat, gat_post_thu: rejected.total, tin_cua_lat: cuaLat.length, khac_nhau, chon: chon.length,
    trung: chon.filter((r) => r.double_label).length, dev: chon.filter((r) => r.split === "dev").length,
    them, thieu: Math.max(0, n - chon.length), thu,
  };
}

async function main() {
  const co = docCo(process.argv.slice(2));
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const kq = await layMau(client, co);
    console.log(`label-sample: lát ${kq.lat} · tin của lát ${kq.tin_cua_lat} (${kq.khac_nhau} nội dung khác nhau, gạt ${kq.gat_post_thu} post thử)`);
    console.log(`chon ${kq.chon} · trung ${kq.trung} · dev ${kq.dev} / test ${kq.chon - kq.dev} · them ${kq.them}${kq.thu ? " (--thu: không ghi)" : ""}`);
    if (kq.thieu > 0) console.log(`thieu ${kq.thieu} — lát chỉ có ${kq.khac_nhau} nội dung khác nhau`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
