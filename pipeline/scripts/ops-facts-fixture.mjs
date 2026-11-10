// ops-facts-fixture.mjs — lược đồ tạm cho phép đo ON22 `ops-facts-so-tong-hop` (pipeline/scripts/ops-facts-so-tong-hop.test.mjs
// và app/tests/ops-facts-so-tong-hop.test.tsx). Bảng chép KHUÔN từ public (LIKE, rỗng), source_registry chép cả dòng (DB
// local — tên thật không rời máy), cộng snapshot / thẻ chờ viết trước. `admin` là pg client đã kết nối (bên gọi tự mang pg).
import { localDbUrl } from "./capture-ops-facts.mjs";

const LIKE = ["airbnb_snapshots", "airdna_markets", "stg_zalo_posts", "stg_chotot_ads", "stg_abnb_listings", "stg_s08_inventory", "sale_offers", "review_queue", "ops_audit"]; // 3110-10 MỞ LẠI: probe S08 cần bảng này trong hộp cát

/** Snapshot viết trước theo luồng thu: [source, giờ trước] — trong và ngoài 24 giờ. */
export const SNAPSHOTS = [
  ["airbnb-discovery", 1], ["airbnb-discovery", 2], ["airbnb-discovery", 30],
  ["airbnb-listing", 4],
  ["chotot-ads", 3], ["chotot-ads", 50],
  ["zalo-agent", 5],
  ["airdna-research", 40],
];

/** Thẻ viết trước: [item_type, status]. Đáp án pending theo loại: agent_output 2, entity_match 3. */
// Thẻ Ghép căn đang chờ đóng băng (V7, hồ sơ dong-bang-stage-b-resolve): không vào bản tin. Mồi giữ hai thẻ Ghép căn chờ để
// phép đếm thấy việc loại trừ, và một thẻ data_quality chờ để bản tin vẫn có hai loại.
export const REVIEW = [
  ["agent_output", "pending"], ["agent_output", "pending"],
  ["entity_match", "pending"], ["entity_match", "pending"], ["data_quality", "pending"],
  ["entity_match", "rejected"], ["agent_output", "approved"],
];

/** Chuỗi kết nối tới lược đồ `schema` (search_path) của DB local. */
export function schemaUrl(schema) {
  const u = new URL(localDbUrl());
  u.searchParams.set("options", `-c search_path=${schema}`);
  return u.toString();
}

/** Dựng lược đồ; `omit` = bảng cố ý vắng (ca «không đo được»).
 * @param {{ query: (sql: string, args?: unknown[]) => Promise<unknown> }} admin
 * @param {string} schema
 * @param {{ omit?: string[] }} [opts] */
export async function makeOpsSchema(admin, schema, { omit = [] } = {}) {
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.query(`CREATE TABLE "${schema}".source_registry AS SELECT * FROM public.source_registry`);
  for (const t of LIKE.filter((x) => !omit.includes(x))) {
    await admin.query(`CREATE TABLE "${schema}".${t} (LIKE public.${t} INCLUDING ALL)`);
  }
  await admin.query(`CREATE TABLE "${schema}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`);
  if (!omit.includes("airbnb_snapshots")) {
    for (const [i, [source, h]] of SNAPSHOTS.entries()) {
      await admin.query(
        `INSERT INTO "${schema}".airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
         VALUES ($1, 'hanoi', $2, now() - make_interval(hours => $3), '{}'::jsonb)`,
        [`on22-${i}`, source, h],
      );
    }
  }
  if (!omit.includes("review_queue")) {
    for (const [i, [type, status]] of REVIEW.entries()) {
      await admin.query(
        `INSERT INTO "${schema}".review_queue (item_type, item_id, title, status) VALUES ($1, $2, $3, $4)`,
        [type, `on22-${i}`, `Thẻ thử ${i}`, status],
      );
    }
  }
}

export async function dropOpsSchema(admin, schema) {
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}
