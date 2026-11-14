#!/usr/bin/env node
// tap-nhan-hai-khu-ghi-thu.mjs — hồ sơ tap-nhan-ghep-tin-hai-khu (PL35) E5b: nạp lát `hai-khu-ghep` và nháp của TÁC TỬ GIẢ vào DB thử
// (không gọi model) để màn /ops/labels của dev server trỏ DB thử hiện ô điền sẵn; --doc-nhan in nhãn người đã lưu của một bài.
// Chỉ chạy trên DB thử (tên oneinvest_u1_pl35 hay oneinvest_suite_*). Chạy qua tap-nhan-hai-khu-db.sh ghi-thu.
//   node pipeline/scripts/tap-nhan-hai-khu-ghi-thu.mjs [--doc-nhan <item_id>]
import pg from "pg";

import { layMau } from "../label-sample.mjs";
import { nhapLat } from "../label-nhap-ghep.mjs";
import { LAT_HAI_KHU } from "../lib/mau-hai-khu.mjs";

const SEED = "pl35-ghi-thu";
const thoatRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Tác tử giả trên dữ liệu thật: toà = tên đầu tiên trong danh sách khu có trong bài (dài trước); mã căn = tên toà + số 3–4 chữ số
 * ngay sau; trục = hai chữ số cuối mã căn. Câu trích là đoạn khớp nguyên văn. */
export async function tacTuGiaDanhBa({ chu, toa }) {
  for (const ten of [...toa].sort((a, b) => b.length - a.length)) {
    const m = new RegExp(`(?<![\\p{L}\\p{N}])${thoatRe(ten)}(?:[ .\\-]?(\\d{1,2})(\\d{2}))?(?![\\p{L}\\p{N}])`, "iu").exec(chu);
    if (!m) continue;
    return {
      building: { v: ten, trich: m[0] },
      stack: m[2] ? { v: m[2], trich: m[0] } : { v: null },
      unit_number: m[2] ? { v: m[0], trich: m[0] } : { v: null },
    };
  }
  return { building: { v: null }, stack: { v: null }, unit_number: { v: null } };
}

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (!/^oneinvest_(u1_pl35(_it)?|suite_[a-z0-9_]+)$/.test(db)) throw new Error(`ghi-thu chỉ chạy trên DB thử, không trên ${db}`);
    const i = process.argv.indexOf("--doc-nhan");
    if (i > 0) {
      const { rows } = await c.query("SELECT field, value, not_stated, labeler_id <> '' AS co_nguoi FROM eval_labels WHERE item_id = $1 ORDER BY field", [Number(process.argv[i + 1])]);
      console.log(`eval_labels item ${process.argv[i + 1]}: ${rows.length} dòng`);
      for (const r of rows) console.log(`  ${r.field} = ${r.not_stated ? "(không nêu)" : r.value}`);
      return;
    }
    const m = await layMau(c, { lat: LAT_HAI_KHU, seed: SEED, thu: false, haiKhu: { co: 75 } });
    console.log(`chọn ${m.chon} · thêm ${m.them}`);
    const n = await nhapLat(c, { lat: LAT_HAI_KHU, tacTu: tacTuGiaDanhBa });
    console.log(`nháp: gọi ${n.goi} · ghi ${n.ghi} · bỏ có nhãn người ${n.bo_co_nguoi} · đã có nháp ${n.bo_co_nhap}`);
    const { rows } = await c.query(
      `SELECT item_id::int, stratum, draft->'cach_doc'->'ghep'->'o' AS o FROM eval_label_items
        WHERE lat = $1 AND draft->'cach_doc'->'ghep'->'o' ?& ARRAY['building','stack','unit_number'] ORDER BY item_id LIMIT 5`, [LAT_HAI_KHU]);
    console.log("bài có đủ ba ô nháp (đối chiếu E5b bước 1):");
    for (const r of rows) console.log(`  item ${r.item_id} · ${r.stratum} · ${JSON.stringify(r.o)}`);
  } finally {
    await c.end();
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
