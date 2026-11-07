#!/usr/bin/env node
// do1-dung-thu.mjs — DO1: dựng số trên một DB thử để chụp hai màn ở S4 (E9 /ops/quality, E11 /ops/labels). Không gọi model:
// kết quả đọc gộp là bản giả ghi thẳng silver_labels. Chỉ chạy trên DB tên oneinvest_* (khác oneinvest). Chạy lại được: dọn
// dữ liệu mẫu do1dt* cũ trước (không dựng lại DB, nên phiên đăng nhập Ops trên DB thử còn nguyên).
//   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_do1 node pipeline/scripts/do1-dung-thu.mjs
// Hai ngày mẫu soát cố định: 2025-06-01 (có đọc gộp) và 2025-06-06 (chỉ bộ đọc luật), đo ngày 2025-06-07 — /ops/labels?lat=s03-cuon-chieu&nhom=<ngày>.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { doHangNgay } from "../do-hang-ngay.mjs";
import { resolveOffers, writeAssertions } from "../lib/assert.mjs";
import { textHash } from "../lib/eval-labels.mjs";
import { LISTING_INTENT as YD } from "../lib/vocab.generated.mjs";
import { rutMau } from "../mau-soat-cuon-chieu.mjs";
import { soSanh } from "../so-sanh-cach-doc.mjs";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MODEL = "gateway:anthropic/claude-haiku-5.5";
const NGAY_GOP = "2025-06-01", NGAY_LUAT = "2025-06-06", NGAY_DO = "2025-06-07"; // tháng không có bài thật trong bản sao

async function don(c) {
  // DB thử: lát mẫu soát chỉ có thẻ của script này (kể cả thẻ rút từ bài thật của bản sao) — dọn cả lát.
  await c.query("DELETE FROM eval_labels WHERE item_id IN (SELECT item_id FROM eval_label_items WHERE lat = 's03-cuon-chieu')");
  await c.query("DELETE FROM eval_label_items WHERE lat = 's03-cuon-chieu'");
  await c.query("DELETE FROM silver_labels WHERE post_id LIKE 'do1dt%' OR run_id = 'do1-dung-thu'");
  await c.query("DELETE FROM property_offers WHERE offer_id LIKE 'offer_do1dt%'");
  await c.query("DELETE FROM properties WHERE stable_key LIKE 'do1dt%'");
  await c.query("DELETE FROM sale_offer_records WHERE offer_id LIKE 'offer_do1dt%'");
  await c.query("DELETE FROM stg_zalo_posts WHERE post_id LIKE 'do1dt%'");
  await c.query("DELETE FROM data_level_change; DELETE FROM data_level_unit; DELETE FROM dq_check_results WHERE check_name LIKE 'do1-%'");
}

async function can(c, key, oids) {
  const { rows: [{ id }] } = await c.query(
    "INSERT INTO properties (kind, property_type, first_seen, last_seen, stable_key) VALUES ('sale', 'apartment', now(), now(), $1) RETURNING id", [key]);
  for (const o of oids) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [id, o]);
  return id;
}

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (!/^oneinvest_/.test(db)) throw new Error(`do1-dung-thu: chỉ chạy trên DB thử oneinvest_*, không phải «${db}»`);
    await c.query(readFileSync(path.join(GOC, "db/migrations/083_do_hang_ngay.sql"), "utf8"));
    await don(c);
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('do1-dung-thu__s03', 'hanoi', 'zalo-agent', '{}') ON CONFLICT DO NOTHING`);
    const { rows: [{ phuong }] } = await c.query("SELECT id AS phuong FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1");
    const o = (pn, dt, gia, yd = YD.offer) => ({ listing_intent: { v: yd, cc: "chu_bai", trich: "bán", trich_ok: true }, kind: { v: "sale" },
      property_type: { v: "apartment" }, bedrooms: { v: pn }, bathrooms: { v: 2 }, area_m2: { v: dt }, price_min_vnd: { v: gia }, price_max_vnd: { v: gia },
      project: { v: "Vinhomes Ocean Park" }, building: { v: "S8.02" } });
    for (const [k, ngay] of [NGAY_GOP, NGAY_LUAT].entries()) {
      const ids = [];
      for (let i = 0; i < 22; i++) {
        const id = `do1dt${k}${String(i).padStart(2, "0")}`, text = `[thử DO1 ${ngay}] bán căn ${i} 2pn ${60 + i}m2 giá 3,${i} tỷ Ocean Park toà S8.02`;
        await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, captured_at, text) VALUES ($1, 'do1-dung-thu__s03', 'Nhóm thử DO1', $2, $2, $3)`,
          [id, `${ngay}T03:00:00Z`, text]);
        if (i < 17) {
          await c.query(`INSERT INTO sale_offer_records (offer_id, originating_system_key, kind, price_vnd, area_m2, area_id, first_seen, last_seen, post_ids, source)
                         VALUES ($1, $2, 'sale', $3, $4, $5, now(), now(), ARRAY[$2], 'S03')`, [`offer_${id}`, id, 3e9 + i * 1e8, 60 + i, phuong]);
          ids.push(`offer_${id}`);
        }
      }
      // Loại hình qua phát biểu + phân xử (năm cột phân loại không ghi thẳng); ba tin đầu nêu toà S8.02 (chưa có trong danh bạ).
      await writeAssertions(c, ids.map((oid) => ({ subject_key: `S03:${oid.slice(6)}`, field: "property_type", value: "apartment", evidence_tier: "observed", method: "e1_rule", method_version: "do1-dung-thu", rule_id: "do1" })));
      await writeAssertions(c, ids.slice(0, 3).map((oid) => ({ subject_key: `S03:${oid.slice(6)}`, field: "block_raw", value: "S8.02", evidence_tier: "observed", method: "e1_rule", method_version: "do1-dung-thu", rule_id: "do1" })));
      await resolveOffers(c, ids);
      // Ngày 1 có đọc gộp (giả); ngày 2 đọc gộp không trả gì → thẻ hiện nháp bộ đọc luật.
      const goi = async (pids) => {
        if (k === 1) return { goi: pids.length, cham_tran: false };
        for (const id of pids) {
          const i = Number(id.slice(-2));
          await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, cost_usd, run_id, probabilities)
                         VALUES ('S03', $1, $2, $3, 'dg3-s03-v3', $4, 'sale', $5, 0.0017, 'do1-dung-thu', $6)`,
            [id, textHash(id), MODEL, i % 9 === 0 ? YD.inquiry : YD.offer, i % 11 !== 5,
              { nguon: "doc-gop", o_duoc_giao: Object.keys(o(2, 60, 3e9)), o: o(2, 60 + i + (i % 4 === 0 ? 3 : 0), 3e9 + i * 1e8, i % 9 === 0 ? YD.inquiry : YD.offer) }]);
        }
        return { goi: pids.length, cham_tran: false };
      };
      const kq = await rutMau(c, { ngay, goiDocGop: goi, log: console.log });
      if (k === 1) {
        // Ngày «bộ đọc luật»: bỏ thẻ rút từ bài thật của bản sao (thường không thành tin, không có nháp) để thẻ mẫu đứng đầu hàng.
        await c.query("DELETE FROM eval_label_items WHERE lat = 's03-cuon-chieu' AND stratum = $1 AND ref_id NOT LIKE 'do1dt%'", [ngay]);
        kq.the = kq.the.filter((t) => t.post_id.startsWith("do1dt"));
      }
      // Người giả soát 15/20 thẻ: giữ phần lớn nháp, sửa diện tích ở mỗi thẻ thứ tư.
      // Gắn trước thẻ không có nháp hiện được (khong-tin/vang), để thẻ CÓ nháp còn lại đứng đầu hàng chờ (ảnh E11).
      const coNhap = (t) => t.draft.cach_doc[t.draft.hien]?.trang_thai === "co" && (k === 1 || t.draft.hien !== "bo-doc-luat");
      const thuTu = [...kq.the].sort((a, b) => Number(coNhap(a)) - Number(coNhap(b)));
      for (const [j, t] of thuTu.slice(0, k === 1 ? 5 : 15).entries()) {
        const n = t.draft.cach_doc[t.draft.hien];
        const nhan = { listing_intent: n.trang_thai === "co" ? YD.offer : YD.not_listing, ...(n.trang_thai === "co" ? n.o : {}) };
        if (j % 4 === 0 && nhan.area_m2) nhan.area_m2 = String(Number(nhan.area_m2) + 5);
        for (const [f, v] of Object.entries(nhan)) {
          if (!["listing_intent", "kind", "property_type", "bedrooms", "area_m2", "price_min_vnd", "price_max_vnd", "project", "building"].includes(f)) continue;
          await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) VALUES ($1, 'do1-dung-thu', $2, $3, $4) ON CONFLICT DO NOTHING", [t.item_id, f, v, v === null]);
        }
      }
    }
    // Căn P giữ tin do1dt010 trước lần đo đầu; sau đó tin chuyển sang căn Q (khoá căn đổi) → «đổi khoá».
    await can(c, "do1dt-P", ["offer_do1dt010"]);
    const homNay = NGAY_DO;
    await doHangNgay(c, { ngay: homNay, write: true });
    await c.query("UPDATE sale_offer_records SET price_vnd = NULL WHERE offer_id IN ('offer_do1dt000', 'offer_do1dt001', 'offer_do1dt005')");
    await c.query("DELETE FROM property_offers WHERE offer_id = 'offer_do1dt010'; DELETE FROM properties WHERE stable_key = 'do1dt-P'");
    await can(c, "do1dt-Q", ["offer_do1dt010"]);
    // Một lời đọc trong ngày để có tín hiệu hôm nay.
    await c.query("UPDATE silver_labels SET labeled_at = '2025-06-07T05:00:00Z' WHERE post_id IN ('do1dt003', 'do1dt004', 'do1dt005') AND run_id = 'do1-dung-thu'");
    const kq = await doHangNgay(c, { ngay: homNay, write: true });
    const k = `doc-gop:${MODEL}:dg3-s03-v3`;
    const ss = await soSanh(c, { cu: k, moi: k, ngay: homNay, goiDocGop: async () => ({ goi: 0, cham_tran: false }), log: console.log });
    await c.query("INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)", [ss.dong.check_name, ss.dong.entity, ss.dong.status, JSON.stringify(ss.dong.detail)]);
    console.log(`do1-dung-thu: ${db} — ${kq.chuyen} đơn vị đổi bậc; ${kq.dq.map((r) => `${r.check_name}=${r.status}`).join(" ")}; mẫu soát ${NGAY_GOP} (đọc gộp), ${NGAY_LUAT} (bộ đọc luật)`);
  } finally { await c.end(); }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
