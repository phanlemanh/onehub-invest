#!/usr/bin/env node
// do1-dung-thu.mjs — DO1: dựng một DB thử có số để chụp hai màn ở S4 (E9 /ops/quality, E11 /ops/labels). Không gọi model:
// kết quả đọc gộp là bản giả ghi thẳng silver_labels (run_id do1-dung-thu). Chỉ chạy trên DB tên oneinvest_* (khác oneinvest).
//   bash db/db-thu.sh oneinvest_do1 && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_do1 node pipeline/scripts/do1-dung-thu.mjs
// Sau đó: cd app && DATABASE_URL=… npm run dev -- -p 3462 → /ops/quality, /ops/labels?lat=s03-cuon-chieu (tài khoản ops thử).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { doHangNgay } from "../do-hang-ngay.mjs";
import { textHash } from "../lib/eval-labels.mjs";
import { rutMau } from "../mau-soat-cuon-chieu.mjs";
import { soSanh } from "../so-sanh-cach-doc.mjs";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MODEL = "gateway:anthropic/claude-haiku-5.5";
const ngayVn = (d) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (!/^oneinvest_/.test(db)) throw new Error(`do1-dung-thu: chỉ chạy trên DB thử oneinvest_*, không phải «${db}»`);
    await c.query(readFileSync(path.join(GOC, "db/migrations/083_do_hang_ngay.sql"), "utf8"));
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('do1-dung-thu__s03', 'hanoi', 'zalo-agent', '{}') ON CONFLICT DO NOTHING`);
    const homNay = new Date();
    const ngays = [7, 1].map((n) => ngayVn(new Date(homNay.getTime() - n * 86400e3)));
    const o = (pn, dt, gia, yd = "offer") => ({ listing_intent: { v: yd, cc: "chu_bai", trich: "bán", trich_ok: true }, kind: { v: "sale" },
      property_type: { v: "apartment" }, bedrooms: { v: pn }, bathrooms: { v: 2 }, area_m2: { v: dt }, price_min_vnd: { v: gia }, price_max_vnd: { v: gia },
      project: { v: "Vinhomes Ocean Park" } });
    for (const [k, ngay] of ngays.entries()) {
      for (let i = 0; i < 22; i++) {
        const id = `do1dt${k}${String(i).padStart(2, "0")}`, text = `[thử DO1] bán căn ${i} 2pn ${60 + i}m2 giá 3,${i} tỷ Ocean Park`;
        await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, captured_at, text) VALUES ($1, 'do1-dung-thu__s03', 'Nhóm thử DO1', $2, $2, $3) ON CONFLICT DO NOTHING`,
          [id, `${ngay}T03:00:00Z`, text]);
        if (i < 17) await c.query(`INSERT INTO sale_offer_records (offer_id, kind, price_vnd, area_m2, first_seen, last_seen, post_ids, source) VALUES ($1, 'sale', $2, $3, now(), now(), ARRAY[$4], 'S03') ON CONFLICT DO NOTHING`,
          [`offer_${id}`, 3e9 + i * 1e8, 60 + i, id]);
      }
      const goi = async (ids) => {
        for (const id of ids) {
          const i = Number(id.slice(-2));
          await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, cost_usd, run_id, probabilities, labeled_at)
                         VALUES ('S03', $1, $2, $3, 'dg3-s03-v3', $4, 'sale', $5, 0.0017, 'do1-dung-thu', $6, $7) ON CONFLICT DO NOTHING`,
            [id, textHash(id), MODEL, i % 9 === 0 ? "inquiry" : "offer", i % 11 !== 5,
              { nguon: "doc-gop", o_duoc_giao: Object.keys(o(2, 60, 3e9)), o: o(2, 60 + i + (i % 4 === 0 ? 3 : 0), 3e9 + i * 1e8, i % 9 === 0 ? "inquiry" : "offer") }, `${ngay}T05:00:00Z`]);
        }
        return { goi: ids.length, cham_tran: false };
      };
      const kq = await rutMau(c, { ngay, goiDocGop: goi, log: console.log });
      // Mạnh giả: soát 15/20 thẻ, giữ phần lớn nháp, sửa diện tích ở mỗi thẻ thứ tư.
      for (const [j, t] of kq.the.slice(0, 15).entries()) {
        const n = t.draft.cach_doc[t.draft.hien];
        const nhan = { listing_intent: n.trang_thai === "co" ? "offer" : "not_listing", ...(n.trang_thai === "co" ? n.o : {}) };
        if (j % 4 === 0 && nhan.area_m2) nhan.area_m2 = String(Number(nhan.area_m2) + 5);
        for (const [f, v] of Object.entries(nhan)) {
          if (!["listing_intent", "kind", "property_type", "bedrooms", "area_m2", "price_min_vnd", "price_max_vnd", "project"].includes(f)) continue;
          await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) VALUES ($1, 'do1-dung-thu', $2, $3, $4) ON CONFLICT DO NOTHING", [t.item_id, f, v, v === null]);
        }
      }
    }
    await c.query("DELETE FROM data_level_unit");
    await doHangNgay(c, { ngay: ngayVn(homNay), write: true });
    await c.query("UPDATE sale_offer_records SET area_m2 = NULL WHERE offer_id LIKE 'offer_do1dt1%' AND offer_id < 'offer_do1dt105'");
    const kq = await doHangNgay(c, { ngay: ngayVn(homNay), write: true });
    const ss = await soSanh(c, { cu: `doc-gop:${MODEL}:dg3-s03-v3`, moi: `doc-gop:${MODEL}:dg3-s03-v3`, ngay: ngayVn(homNay), goiDocGop: async () => ({ goi: 0, cham_tran: false }), log: console.log });
    await c.query("INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)", [ss.dong.check_name, ss.dong.entity, ss.dong.status, JSON.stringify(ss.dong.detail)]);
    console.log(`do1-dung-thu: ${db} — ${kq.chuyen} đơn vị đổi bậc; ${kq.dq.map((r) => `${r.check_name}=${r.status}`).join(" ")}`);
  } finally { await c.end(); }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
