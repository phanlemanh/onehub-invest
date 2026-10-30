// bac-du-lieu.mjs — PL16 `de-xuat-thanh-phat-bieu-bac`: phân bố bậc dữ liệu B0–B5 theo thị trường × loại hình.
//   node bac-du-lieu.mjs --write   chụp ngày hôm nay (sql/610) + ghi hai dòng dq_check_results — bước cuối cloud-sync
//   node bac-du-lieu.mjs           in bảng phân bố của ngày mới nhất
// Dòng kiểm `fail` không đổi mã thoát (Hỏi-3: nhịp tim /ops không đỏ oan); chỉ lỗi chạy (DB, SQL) mới thoát 1.
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SQL_610 = readFileSync(path.join(HERE, "sql/610_data_level.sql"), "utf8");
export const KHOA = 56056;
const BAC = ["B0", "B1", "B2", "B3", "B4", "B5"];

/** Chụp phân bố ngày hôm nay trong giao dịch của client; trả tổng đơn vị và số theo bậc. */
export async function ghiAnhChup(client) {
  await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
  await client.query(SQL_610);
  const { rows } = await client.query(
    "SELECT data_level, sum(n)::int AS n FROM data_level_snapshot WHERE snap_date = current_date GROUP BY 1");
  const byLevel = Object.fromEntries(BAC.map((b) => [b, 0]));
  for (const r of rows) byLevel[r.data_level] = r.n;
  return { units: Object.values(byLevel).reduce((a, b) => a + b, 0), byLevel };
}

/** Đề xuất đã áp mà không có phát biểu sống của chính nó. Khớp như revert_enrichment (045): `proposal_id`, hoặc cùng
 * chủ thể · trường · giá trị · phương pháp — nhưng phát biểu `legacy` không bao giờ được tính là của một đề xuất. */
export const SQL_KIEM_DE_XUAT = `
  SELECT count(*)::int AS applied,
         count(*) FILTER (WHERE NOT EXISTS (
           SELECT 1 FROM field_assertions fa
            WHERE fa.retracted_at IS NULL AND fa.method <> 'legacy'
              AND (fa.evidence ->> 'proposal_id' = ep.id::text
                   OR (fa.subject_key = o.source || ':' || coalesce(o.originating_system_key, o.post_ids[1])
                       AND fa.field = ep.field AND fa.value_key = assertion_value_key(ep.value)
                       AND fa.method = CASE WHEN coalesce(ep.decided_by, '') LIKE 'hitl:%' THEN 'hitl' ELSE ep.source END))
         ))::int AS missing
    FROM enrichment_proposals ep
    LEFT JOIN sale_offer_records o ON o.offer_id = ep.offer_id
   WHERE ep.status = 'applied'`;
export async function kiemDeXuat(client) {
  const { rows: [r] } = await client.query(SQL_KIEM_DE_XUAT);
  return { applied: r.applied, missing: r.missing };
}

async function ghiKiem(client, phanBo, deXuat) {
  await client.query(`INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES
    ('enrich:proposal-assertion', 'enrichment_proposals', $1, $2), ('data-level:distribution', 'all', 'pass', $3)`, [
    deXuat.missing > 0 ? "fail" : "pass",
    `applied=${deXuat.applied} missing=${deXuat.missing}`,
    `units=${phanBo.units} ${BAC.map((b) => `${b}=${phanBo.byLevel[b]}`).join(" ")}`,
  ]);
}

const chu = (s, w) => String(s).padEnd(w);
const so = (s, w) => String(s).padStart(w);

/** Bảng phân bố của ngày mới nhất: mỗi dòng một phân khúc, sáu cột bậc mang nhãn trục, dòng tổng cuối. */
async function inBang(client, out) {
  const { rows } = await client.query(`
    WITH ngay AS (SELECT max(snap_date) AS d FROM data_level_snapshot)
    SELECT s.market_id, coalesce(a.name, 'Chưa rõ thị trường') AS thi_truong,
           coalesce(lt.label_vi, s.property_type) AS loai_hinh, s.data_level, sum(s.n)::int AS n, ngay.d::text AS ngay
      FROM data_level_snapshot s
      JOIN ngay ON s.snap_date = ngay.d
      LEFT JOIN areas a ON a.id = s.market_id
      LEFT JOIN ref_lookup lt ON lt.lookup_name = 'property_type' AND lt.lookup_value = s.property_type
     GROUP BY 1, 2, 3, 4, 6
     ORDER BY 2, 3`);
  if (!rows.length) {
    out("bac-du-lieu: chưa có ảnh chụp nào — chạy `node pipeline/bac-du-lieu.mjs --write`");
    return;
  }
  const { rows: nhan } = await client.query(
    "SELECT lookup_value AS b, label_vi FROM ref_lookup WHERE lookup_name = 'data_level' ORDER BY sort_order");
  const cot = BAC.map((b) => `${b} ${nhan.find((x) => x.b === b)?.label_vi ?? ""}`.trim());
  const dong = new Map();
  for (const r of rows) {
    const k = `${r.thi_truong}\u0000${r.loai_hinh}`;
    if (!dong.has(k)) dong.set(k, { thi_truong: r.thi_truong, loai_hinh: r.loai_hinh, n: Object.fromEntries(BAC.map((b) => [b, 0])) });
    dong.get(k).n[r.data_level] += r.n;
  }
  const tong = Object.fromEntries(BAC.map((b) => [b, 0]));
  const wT = Math.max(12, ...[...dong.values()].map((d) => d.thi_truong.length));
  const wL = Math.max(10, ...[...dong.values()].map((d) => d.loai_hinh.length));
  const wC = cot.map((c) => Math.max(c.length, 7));
  out(`Phân bố bậc dữ liệu — ngày ${rows[0].ngay}`);
  out([chu("Thị trường", wT), chu("Loại hình", wL), ...cot.map((c, i) => so(c, wC[i])), so("Tổng", 8)].join("  "));
  for (const d of dong.values()) {
    let t = 0;
    const o = BAC.map((b, i) => { t += d.n[b]; tong[b] += d.n[b]; return so(d.n[b], wC[i]); });
    out([chu(d.thi_truong, wT), chu(d.loai_hinh, wL), ...o, so(t, 8)].join("  "));
  }
  const tt = BAC.reduce((a, b) => a + tong[b], 0);
  out([chu("Tổng", wT), chu("", wL), ...BAC.map((b, i) => so(tong[b], wC[i])), so(tt, 8)].join("  "));
}

/** `write`: chụp + kiểm + ghi hai dòng kiểm (giao dịch do bên gọi mở); không cờ: in bảng. Trả mã thoát. */
export async function chay(client, { write = false, out = console.log } = {}) {
  if (!write) {
    await inBang(client, out);
    return 0;
  }
  const phanBo = await ghiAnhChup(client);
  const deXuat = await kiemDeXuat(client);
  await ghiKiem(client, phanBo, deXuat);
  out(`bac-du-lieu: ${phanBo.units} đơn vị (${BAC.map((b) => `${b} ${phanBo.byLevel[b]}`).join(" · ")}) · đề xuất đã áp ${
    deXuat.applied}, thiếu phát biểu ${deXuat.missing}${deXuat.missing > 0 ? " — FAIL (dòng kiểm, không đổi mã thoát)" : ""}`);
  return 0;
}

async function main() {
  const write = process.argv.includes("--write");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("BEGIN");
    const ma = await chay(c, { write });
    await c.query("COMMIT");
    return ma;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((ma) => { process.exitCode = ma; }, (e) => { console.error(`bac-du-lieu: ${e.message}`); process.exit(1); });
