#!/usr/bin/env node
// label-cases.mjs — GC0 `gan-nhan-theo-nhom-s03` (AC-8): xuất lý do, trường hợp, trả lời thẻ theo từng nhóm cho `GCQ1`.
// Chỉ đọc, không mang định danh người gắn.
//   node pipeline/label-cases.mjs --lat s03-theo-nhom [--nhom S03-N003] [--json]
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { xuatTruongHop } from "./lib/label-cases.mjs";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

function docCo(argv) {
  const co = { json: false, nhom: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") co.json = true;
    else if (["--lat", "--nhom"].includes(a) && i + 1 < argv.length) co[a.slice(2)] = argv[++i];
    else throw new Error(`label-cases: cờ lạ «${a}» — chỉ nhận --lat --nhom --json`);
  }
  if (!co.lat) throw new Error("label-cases: thiếu --lat");
  return co;
}

async function main() {
  const co = docCo(process.argv.slice(2));
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const kq = await xuatTruongHop(client, co.lat, co.nhom);
    if (co.json) {
      console.log(JSON.stringify(kq));
      return;
    }
    for (const n of kq.nhom) {
      console.log(`${n.unit_code} ${n.ten}: lý do ${n.ly_do.length} · trường hợp ${n.truong_hop.length} · thẻ ${n.the_nhom.length} · giá trị ngữ cảnh ${n.gia_tri_ngu_canh.length}`);
    }
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
