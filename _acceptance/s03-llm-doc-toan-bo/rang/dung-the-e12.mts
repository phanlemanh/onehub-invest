// dung-the-e12.mts — bàn đo E12 của hồ sơ s03-llm-doc-toan-bo: chạy lõi thật với model giả trên DB thử, sinh đúng một thẻ E1 trái model + ý định + giá.
// Chỉ chạy trên DB thử (bash db/db-thu.sh oneinvest_p2_ls1_e12); xoá thẻ cũ của DB thử để ảnh chỉ có fixture. 0 USD, không gọi mạng.
// Chạy: cd agent && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_ls1_e12 node --import tsx ../_acceptance/s03-llm-doc-toan-bo/rang/dung-the-e12.mts
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chayLuot, docTraLoi } from "../../../agent/src/enrich/doc-toan-bo.js";
import { insertOffer } from "../../../agent/tests/helpers/db.js";

const url = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(url)) { console.error("dung-the-e12: chỉ chạy trên DB thử oneinvest_<dãy>_<việc>"); process.exit(2); }
const pg = createRequire(join(process.cwd(), "package.json"))("pg");
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  await c.query(await readFile(join(import.meta.dirname, "../../../db/migrations/065_silver_labels.sql"), "utf8"));
  await c.query(`DELETE FROM review_queue`);
  const SNAP = "hanoi__zalo-agent__2099-05-05T000000", ID = "t_ls1_e12", POST = "t_ls1_e12_p";
  const CHU = "Khách cần mua căn hộ giá 5 tỷ khu Minh Khai rộng rãi";
  // Chạy lại được: gỡ fixture của lần trước.
  await c.query(`DELETE FROM enrichment_proposals WHERE offer_id = $1`, [ID]);
  await c.query(`DELETE FROM ops_audit WHERE detail->>'offer_id' = $1`, [ID]);
  await c.query(`DELETE FROM sale_offers WHERE offer_id = $1`, [ID]);
  await c.query(`DELETE FROM silver_labels WHERE run_id = 'e12-ban-do'`);
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id = $1`, [POST]);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
    VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi LS1', 'ls1', $3, now()) ON CONFLICT DO NOTHING`, [POST, SNAP, CHU]);
  await insertOffer(c, { offer_id: ID, source: "S03", property_type: "unknown", street_raw: null, post_ids: [POST] });
  await c.query(`UPDATE sale_offers SET price_vnd = 3000000000, area_m2 = 70, kind = 'sale', confidence = 'high' WHERE offer_id = $1`, [ID]);
  const tra = JSON.stringify({ intent: "inquiry", kind: null, confidence: 0.9, quote: "cần mua căn hộ", property_type: "apartment", quote_loai: "cần mua căn hộ",
    price_vnd: 5e9, quote_gia: "giá 5 tỷ", area_m2: null, quote_dt: "", bedrooms: null, bathrooms: null, street: null, block: null });
  const hoi = async (chu: string) => { const p = docTraLoi(tra, chu); return { model: "gateway:anthropic/claude-haiku-5.5", ...p, error_kind: null, latency_ms: 1, cost_usd: 0 }; };
  const resolve = async () => ({ projectSlug: null, projectName: null, projectCandidates: [], propertyType: "land", typeBasis: "luật mồi", buildingHint: null, areaHint: null, matchedBy: "" });
  // Cùng cách lệnh thật mở giao dịch mỗi tin (agent/scripts/doc-toan-bo-s03.ts).
  const giaoDich = async (fn: () => Promise<unknown>) => {
    await c.query("BEGIN");
    try { const r = await fn(); await c.query("COMMIT"); return r; } catch (e) { await c.query("ROLLBACK"); throw e; }
  };
  const kq = await chayLuot({ client: c, giaoDich, runId: "e12-ban-do", tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin: [ID], hoi, resolve } as Parameters<typeof chayLuot>[0]);
  console.log(JSON.stringify(kq));
  const { rows } = await c.query(`SELECT item_id, status, evidence->'doi_chieu' AS dc, jsonb_array_length(evidence->'fields') AS f FROM review_queue`);
  console.log(JSON.stringify(rows));
  if (rows.length !== 1 || JSON.stringify(rows[0].dc.map((d: { loai: string; ai: unknown; bo_doc: unknown; trich: string }) => [d.loai, d.ai, d.bo_doc, d.trich])) !== JSON.stringify([["y_dinh", "inquiry", "offer", "cần mua căn hộ"], ["gia", 5e9, 3e9, "giá 5 tỷ"]])) { console.error("dung-the-e12: phải đúng một thẻ, hai đối chiếu đúng bên"); process.exitCode = 1; }
} finally { await c.end(); }
