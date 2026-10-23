/**
 * freshness.mjs — định nghĩa DUY NHẤT của độ tươi từng nguồn (AU4 `freshness-theo-nguon-that`).
 * Nhận một pg client đã kết nối (không tự kết nối) để CLI `scripts/check-freshness.mjs`, phép đo và
 * về sau `/ops` (AU6) dùng chung một con số.
 *
 * Mỗi mã đọc bảng NẠP THẬT của nó, lọc bằng `source_ids` đọc từ `source_registry` (SPL: không literal
 * nguồn trong mã, không đọc `real_name`):
 *   S01  airbnb_snapshots.collected_at (mọi source_id của S01 gộp max)
 *   S02  airdna_markets.captured_at theo country_code
 *   S03  stg_zalo_posts.captured_at — hàng có agent_id không thuộc mã khác, snapshot thuộc S03
 *   S05  stg_zalo_posts.captured_at — hàng có agent_id ∈ source_ids của S05 (đi chung snapshot với S03)
 *   S06  stg_chotot_ads.captured_at, thành phố lấy từ snapshot của chính hàng
 * Thành phố = nơi mã đó có dữ liệu (không ghép chéo). Mã `completed` (S04) không đo.
 */

/** SLO theo giờ. S01/S02/S03 = 8/35/3 ngày (ADR-0007; Mạnh chốt Hỏi-1 AU4 23/10); S05/S06 theo nhịp thu. */
export const SLO_HOURS = { S01: 192, S02: 840, S03: 72, S05: 12, S06: 36 };

const ZALO_POSTS = `
  SELECT s.city, max(p.captured_at) AS last
  FROM stg_zalo_posts p JOIN airbnb_snapshots s USING (snapshot_id)
  WHERE p.agent_id = ANY($1)
     OR (s.source = ANY($1) AND (p.agent_id IS NULL OR NOT p.agent_id = ANY($2)))
  GROUP BY s.city`;

/** Truy vấn bảng thật theo mã; `args(ids, others)` = source_ids của mã và của mọi mã active khác. */
const PROBES = {
  S01: {
    sql: `SELECT city, max(collected_at) AS last FROM airbnb_snapshots
          WHERE source = ANY($1) GROUP BY city`,
    args: (ids) => [ids],
  },
  S02: {
    sql: `SELECT country_code AS city, max(captured_at) AS last FROM airdna_markets
          GROUP BY country_code`,
    args: () => [],
  },
  S03: { sql: ZALO_POSTS, args: (ids, others) => [ids, others] },
  S05: { sql: ZALO_POSTS, args: (ids, others) => [ids, others] },
  S06: {
    sql: `SELECT s.city, max(c.captured_at) AS last
          FROM stg_chotot_ads c JOIN airbnb_snapshots s USING (snapshot_id)
          WHERE s.source = ANY($1) GROUP BY s.city`,
    args: (ids) => [ids],
  },
};

/**
 * @returns {Promise<Array<{code: string, city: string|null, last: string|null, ageHours: number|null,
 *   sloHours: number|null, status: "fresh"|"stale"|"none"|"no-slo"}>>}
 */
export async function readFreshness(client, { now = new Date() } = {}) {
  const { rows: reg } = await client.query(
    `SELECT code, source_ids FROM source_registry WHERE status = 'active' ORDER BY code`,
  );
  const out = [];
  for (const { code, source_ids: ids } of reg) {
    const sloHours = SLO_HOURS[code] ?? null;
    if (sloHours === null) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours: null, status: "no-slo" });
      continue;
    }
    const probe = PROBES[code];
    const others = reg.filter((r) => r.code !== code).flatMap((r) => r.source_ids);
    const rows = probe ? (await client.query(probe.sql, probe.args(ids, others))).rows : [];
    const seen = rows.filter((r) => r.last !== null);
    if (seen.length === 0) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours, status: "none" });
      continue;
    }
    for (const r of seen) {
      const last = new Date(r.last);
      const ageHours = Math.floor((now.getTime() - last.getTime()) / 3.6e6);
      out.push({
        code,
        city: r.city,
        last: last.toISOString(),
        ageHours,
        sloHours,
        status: ageHours <= sloHours ? "fresh" : "stale",
      });
    }
  }
  return out.sort((a, b) => a.code.localeCompare(b.code) || String(a.city).localeCompare(String(b.city)));
}

/** Một dòng chữ cho hàng lỗi — chỉ mã S0x, thành phố, tuổi, SLO của CHÍNH hàng. */
export function describe(row) {
  const where = row.city ? `${row.code}/${row.city}` : row.code;
  if (row.status === "stale") return `${where}: quá hạn — ${row.ageHours} giờ (SLO ${row.sloHours} giờ)`;
  if (row.status === "none") return `${where}: chưa có dữ liệu ở bảng nạp của nguồn`;
  if (row.status === "no-slo") return `${where}: nguồn active chưa khai SLO`;
  return `${where}: tươi — ${row.ageHours} giờ (SLO ${row.sloHours} giờ)`;
}

export const isBad = (row) => row.status !== "fresh";
