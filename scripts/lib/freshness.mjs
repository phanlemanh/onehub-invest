/**
 * freshness.mjs — định nghĩa DUY NHẤT của độ tươi từng nguồn (AU4 `freshness-theo-nguon-that`).
 * Nhận một pg client đã kết nối (không tự kết nối) để CLI `scripts/check-freshness.mjs`, phép đo và
 * về sau `/ops` (AU6) dùng chung một con số.
 *
 * Mỗi mã đọc bảng NẠP THẬT của nó, lọc bằng `source_ids` đọc từ `source_registry` (SPL: không literal
 * nguồn trong mã, không đọc `real_name`), và tính tuổi theo GIỜ THU — không theo giờ nạp: `captured_at` của
 * stg_zalo_posts / stg_chotot_ads bị importer ghi `now()` mỗi lần upsert, nên nạp lại bản cũ trông như mới.
 *   S01  airbnb_snapshots.collected_at (mọi source_id của S01 gộp max)
 *   S02  airdna_markets.captured_at theo country_code (transform-airdna gán fetchedAt của lần tải)
 *   S03  airbnb_snapshots.collected_at của snapshot chứa bài S03 (agent_id không thuộc mã khác)
 *   S05  airbnb_snapshots.collected_at của snapshot chứa bài S05 (agent_id ∈ source_ids của S05)
 *   S06  airbnb_snapshots.collected_at của snapshot chứa tin stg_chotot_ads
 *   S08  airbnb_snapshots.collected_at của snapshot chứa dòng stg_s08_inventory
 *   S10, S11  airbnb_snapshots.collected_at của bản thu nguồn (chưa có bảng stg)
 *   mã khác  airbnb_snapshots.collected_at của snapshot có dòng ở một bảng trong `stg_tables` của chính mã (S09, S16)
 * Thành phố = nơi mã đó có dữ liệu (không ghép chéo), lọc theo `measured_markets` khi sổ khai. Chỉ đo dòng `active`
 * (S04 completed, S05/S11 paused không đo).
 *
 * Nhịp (SLO) đọc từ `source_registry.cadence_hours` (migration 122, NK1 so-nguon-kho-khai-bao) — không còn hằng trong mã;
 * NULL = «chưa khai SLO». Sổ chưa có cột (chưa áp 122) → ném lỗi gọi tên migration, không rơi về số cũ.
 */

/** Cột thời gian (giờ thu) mà probe của từng mã lấy max — phép đo đối chiếu khai báo này với SQL thật. */
export const TIME_SOURCE = {
  S01: "airbnb_snapshots.collected_at",
  S02: "airdna_markets.captured_at",
  S03: "airbnb_snapshots.collected_at",
  S05: "airbnb_snapshots.collected_at",
  S06: "airbnb_snapshots.collected_at",
  S08: "airbnb_snapshots.collected_at",
  S10: "airbnb_snapshots.collected_at",
  S11: "airbnb_snapshots.collected_at",
};

/** Cột thời gian của câu đo chung qua bảng nạp (mã không có câu riêng, đo theo `stg_tables`). */
export const STG_TIME_SOURCE = "airbnb_snapshots.collected_at";

const ZALO_POSTS = `
  SELECT s.city, max(s.collected_at) AS last
  FROM stg_zalo_posts p JOIN airbnb_snapshots s USING (snapshot_id)
  WHERE p.agent_id = ANY($1)
     OR (s.source = ANY($1) AND (p.agent_id IS NULL OR NOT p.agent_id = ANY($2)))
  GROUP BY s.city`;

/** Truy vấn bảng thật theo mã; `args(ids, others)` = source_ids của mã và của mọi mã active khác. */
export const PROBES = {
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
    sql: `SELECT s.city, max(s.collected_at) AS last
          FROM stg_chotot_ads c JOIN airbnb_snapshots s USING (snapshot_id)
          WHERE s.source = ANY($1) GROUP BY s.city`,
    args: (ids) => [ids],
  },
  S08: {
    sql: `SELECT s.city, max(s.collected_at) AS last
          FROM stg_s08_inventory i JOIN airbnb_snapshots s USING (snapshot_id)
          WHERE s.source = ANY($1) GROUP BY s.city`,
    args: (ids) => [ids],
  },
  // S10, S11 chưa có bảng stg (bộ nạp làn ZCode chưa có): đo ở mức bản thu, như S01 — bản thu nào của nguồn
  // cũng là một lần thu. Có bảng stg thì siết về join như S06, S08.
  S10: {
    sql: `SELECT city, max(collected_at) AS last FROM airbnb_snapshots
          WHERE source = ANY($1) GROUP BY city`,
    args: (ids) => [ids],
  },
  S11: {
    sql: `SELECT city, max(collected_at) AS last FROM airbnb_snapshots
          WHERE source = ANY($1) GROUP BY city`,
    args: (ids) => [ids],
  },
};

/**
 * Gộp nhãn thành phố của bản thu: `vn-<tp>` (dạng mã thị trường, 064) và `<tp>` là cùng một nơi — lấy lần thu mới nhất.
 * Không gộp thì một bản thu lẻ cũ dán `vn-hcmc` thành một ô «quá hạn» riêng, dù vùng thật dán `hcmc` vẫn thu đều
 * (báo nhầm S06/vn-hcmc 07/11, ON17). Nhãn cấp quốc gia (`vn`) giữ nguyên.
 */
export function gopThanhPho(rows) {
  const m = new Map();
  for (const r of rows) {
    const city = typeof r.city === "string" ? r.city.replace(/^vn-(?=.)/, "") : r.city;
    const cur = m.get(city);
    if (!cur || new Date(r.last).getTime() > new Date(cur.last).getTime()) m.set(city, { ...r, city });
  }
  return [...m.values()];
}

export const LOI_122 = "source_registry chưa có cột cadence_hours — áp migration 122";
export const REGISTRY_SQL = `SELECT code, source_ids, cadence_hours, stg_tables, measured_markets
    FROM source_registry WHERE status = 'active' ORDER BY code`;

/** Đọc các dòng `active` của sổ kèm cột của 122. Thiếu cột → lỗi gọi tên 122 (cả với client trả dòng thiếu khoá). */
async function docSo(client) {
  let rows;
  try {
    ({ rows } = await client.query(REGISTRY_SQL));
  } catch (e) {
    if (e?.code === "42703") throw new Error(LOI_122);
    throw e;
  }
  for (const r of rows)
    if (!("cadence_hours" in r) || !("stg_tables" in r) || !("measured_markets" in r)) throw new Error(LOI_122);
  return rows;
}

/** Khuôn tên bảng nạp: chỉ tên này mới được ghép vào câu SQL (sau khi đã chắc bảng có thật và có cột snapshot_id). */
export const STG_TEN = /^stg_[a-z0-9_]+$/;

/** Câu đo chung qua bảng nạp: snapshot có dòng ở một trong các bảng → max(collected_at) theo thành phố. Tên sai khuôn,
 *  bảng không có thật hay không có snapshot_id → không chạy SQL mang tên đó, trả lý do. */
export async function probeStg(client, tables) {
  const sai = tables.filter((t) => typeof t !== "string" || !STG_TEN.test(t));
  if (sai.length) return { rows: [], reason: `bảng nạp sai khuôn tên: ${sai.join(", ")}` };
  if (tables.length === 0) return { rows: [], reason: "sổ không khai bảng nạp" };
  const { rows: co } = await client.query(
    `SELECT t FROM unnest($1::text[]) AS t
      WHERE EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass(t) AND attname = 'snapshot_id' AND NOT attisdropped)`,
    [tables],
  );
  const coSet = new Set(co.map((r) => r.t));
  const thieu = tables.filter((t) => !coSet.has(t));
  if (thieu.length) return { rows: [], reason: `bảng nạp không có (hoặc thiếu snapshot_id): ${thieu.join(", ")}` };
  const u = tables.map((t) => `SELECT snapshot_id FROM ${t}`).join(" UNION ");
  const { rows } = await client.query(
    `SELECT s.city, max(s.collected_at) AS last FROM airbnb_snapshots s JOIN (${u}) u USING (snapshot_id) GROUP BY s.city`,
  );
  return { rows };
}

/**
 * @returns {Promise<Array<{code: string, city: string|null, last: string|null, ageHours: number|null,
 *   sloHours: number|null, status: "fresh"|"stale"|"none"|"no-slo", reason?: string}>>}
 */
export async function readFreshness(client, { now = new Date() } = {}) {
  const reg = await docSo(client);
  const out = [];
  for (const { code, source_ids: ids, cadence_hours: cadence, stg_tables: stg, measured_markets: markets } of reg) {
    const sloHours = cadence ?? null;
    if (sloHours === null) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours: null, status: "no-slo" });
      continue;
    }
    const probe = PROBES[code];
    const others = reg.filter((r) => r.code !== code).flatMap((r) => r.source_ids);
    let rows = [];
    let reason;
    if (probe) rows = (await client.query(probe.sql, probe.args(ids, others))).rows;
    else if (stg?.length) ({ rows, reason } = await probeStg(client, stg));
    const seen = gopThanhPho(rows.filter((r) => r.last !== null)).filter((r) => !markets || markets.includes(r.city));
    if (seen.length === 0) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours, status: "none", ...(reason ? { reason } : {}) });
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
  if (row.status === "none") return `${where}: chưa có dữ liệu ở bảng nạp của nguồn${row.reason ? ` — ${row.reason}` : ""}`;
  if (row.status === "no-slo") return `${where}: nguồn active chưa khai SLO`;
  return `${where}: tươi — ${row.ageHours} giờ (SLO ${row.sloHours} giờ)`;
}

export const isBad = (row) => row.status !== "fresh";
