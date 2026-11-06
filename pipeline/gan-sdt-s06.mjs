// gan-sdt-s06.mjs — hàng sdt-s06-ghep-tai-khoan: SĐT người bán S06 từ stg_chotot_ads lên sale_offer_records.
//
// Một tin nhận số khi chính nó có số, hoặc tài khoản của nó có đúng một số trong stg. Tin ẩn số không bao giờ nhận số ghép.
// Bảng luật L1–L9 ở docs/superpowers/specs/2026-11-02-sdt-s06-ghep-tai-khoan-design.md. Ghi thẳng cột như S03, S05 vì SĐT
// thuộc Member, không đi đường phát biểu; xuất xứ nằm ở field_provenance.seller_phone, 068 giữ nó qua phân xử. Tài khoản về
// 0 số trong stg không xoá gì: importer ở main ghi đè seller ở lượt thu thường và làm mất số ở stg.
// Tin có số mà mất khoá xuất xứ (hàm phân xử từng bị ghi đè) được dựng lại bằng cách so số trên tin với stg hiện tại: trùng số
// riêng là trực tiếp, thuộc số của tài khoản là ghép, không khớp thì giữ nguyên và đếm là không rõ gốc. Khoá có sẵn không bị suy lại.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { inKhongSo } from "./lib/in-khong-so.mjs";
import { daCoPhanGiu068, nap068 } from "./lib/nap-068.mjs";
import { daCoNhan070, nap070 } from "./lib/nap-070.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Trục dung: mã tài khoản trống không gom nhóm; số sai dạng không vào tin, không tính vào tài khoản, chỉ được đếm.
// $1: view đã có cột nhãn (070) chưa. Chưa có thì không ghi số ghép mới, vì số đó sẽ lên trang mà không có nhãn.
export const SQL_GAN = String.raw`
WITH dung AS (
  SELECT list_id, tk, an, tho,
         CASE WHEN tho ~ '^\+84[35789][0-9]{8}$' THEN tho END AS so
    FROM (SELECT s.list_id,
                 nullif(btrim(s.payload ->> 'account_id'), '') AS tk,
                 coalesce(s.payload ->> 'phone_hidden', '') = 'true' AS an,
                 nullif(btrim(s.seller ->> 'phone'), '') AS tho
            FROM stg_chotot_ads s) x
), tk_so AS (
  SELECT d.tk, count(DISTINCT d.so) AS n, min(d.so) AS so_tk, min(d.list_id) AS tu_tin, array_agg(DISTINCT d.so) AS cac_so
    FROM dung d
   WHERE d.tk IS NOT NULL AND d.so IS NOT NULL
   GROUP BY d.tk
), muc AS (
  SELECT r.offer_id, d.so AS rieng, d.an, t.n, t.so_tk, t.tu_tin,
         nullif(r.seller_phone, '') IS NOT NULL AS con_so, r.field_provenance ? 'seller_phone' AS co_khoa,
         CASE WHEN nullif(r.seller_phone, '') IS NULL THEN 'trong'
              WHEN r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-so-tren-tin' THEN 'truc_tiep'
              WHEN r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan' THEN 'ghep'
              WHEN NOT r.field_provenance ? 'seller_phone' AND r.seller_phone = d.so THEN 'truc_tiep'
              WHEN NOT r.field_provenance ? 'seller_phone' AND r.seller_phone = ANY (t.cac_so) THEN 'ghep'
              ELSE 'khong_ro' END AS lop
    FROM sale_offer_records r
    JOIN dung d ON r.source = 'S06' AND r.originating_system_key = d.list_id::text
    LEFT JOIN tk_so t ON t.tk = d.tk
), quyet AS (
  SELECT m.*, CASE
           WHEN m.rieng IS NOT NULL AND m.lop <> 'khong_ro' THEN 'truc_tiep'
           WHEN m.rieng IS NOT NULL THEN 'giu'
           WHEN m.an AND m.lop = 'ghep' THEN 'rut'
           WHEN m.an THEN 'giu'
           WHEN m.n = 1 AND m.lop IN ('trong', 'ghep') AND NOT $1::boolean THEN 'giu'
           WHEN m.n = 1 AND m.lop IN ('trong', 'ghep') THEN 'ghep'
           WHEN m.n >= 2 AND m.lop = 'ghep' THEN 'rut'
           ELSE 'giu' END AS viec
    FROM muc m
), moi AS (
  SELECT q.offer_id, q.viec,
         CASE q.viec WHEN 'truc_tiep' THEN q.rieng WHEN 'ghep' THEN q.so_tk END AS so,
         CASE q.viec
           WHEN 'truc_tiep' THEN jsonb_build_object('tier', 'fact', 'method', 'source_field',
             'rule_id', 's06-so-tren-tin', 'measured', false)
           WHEN 'ghep' THEN jsonb_build_object('tier', 'observed', 'method', 'e1_rule',
             'rule_id', 's06-cung-tai-khoan', 'tu_tin', q.tu_tin, 'measured', false)
         END AS prov
    FROM quyet q
   WHERE q.viec <> 'giu'
), upd AS (
  UPDATE sale_offer_records r SET
         seller_phone = m.so,
         seller_phone_hash = left(encode(sha256(convert_to(m.so, 'UTF8')), 'hex'), 32),
         field_provenance = CASE WHEN m.prov IS NULL THEN r.field_provenance - 'seller_phone'
                                 ELSE r.field_provenance || jsonb_build_object('seller_phone', m.prov) END
    FROM moi m
   WHERE r.offer_id = m.offer_id
     AND (r.seller_phone, r.seller_phone_hash, r.field_provenance -> 'seller_phone')
         IS DISTINCT FROM (m.so, left(encode(sha256(convert_to(m.so, 'UTF8')), 'hex'), 32), m.prov)
  RETURNING m.viec
)
SELECT (SELECT count(*) FROM upd)::int AS doi,
       (SELECT count(*) FROM upd WHERE viec = 'truc_tiep')::int AS truc_tiep,
       (SELECT count(*) FROM upd WHERE viec = 'ghep')::int AS ghep,
       (SELECT count(*) FROM upd WHERE viec = 'rut')::int AS rut,
       (SELECT count(*) FROM quyet WHERE con_so AND NOT co_khoa AND lop <> 'khong_ro' AND viec <> 'giu')::int AS khoi_phuc,
       (SELECT count(*) FROM muc WHERE lop = 'khong_ro')::int AS khong_ro,
       (SELECT count(*) FROM tk_so WHERE n >= 2)::int AS tai_khoan_hai_so,
       (SELECT count(*) FROM dung WHERE tho IS NOT NULL AND so IS NULL)::int AS sai_e164
`;

/**
 * Gán số cho mọi tin S06, kể cả tin đã nghỉ. Chạy lại không đổi stg thì đổi 0 dòng. Trả số đếm, không trả số điện thoại.
 * Hàm phân xử chưa giữ khoá (chưa áp 068, hoặc migration sau ghi đè) thì không ghi: ghi lúc đó sẽ mất xuất xứ ở lượt phân xử kế.
 * View chưa có cột nhãn (chưa áp 070, hoặc migration sau ghi đè) thì số trực tiếp vẫn ghi, số ghép mới thì không, in CHUA-AP-070.
 * @param {import("pg").Client} client
 * @param {{ sql?: string }} [o] `sql` chỉ để test đột biến chạy trên đúng fixture.
 * @returns {Promise<{doi: number, truc_tiep: number, ghep: number, rut: number, khoi_phuc: number, khong_ro: number, tai_khoan_hai_so: number, sai_e164: number, bo_qua: null|"CHUA-AP-068"}>}
 */
export async function ganSdtS06(client, { sql = SQL_GAN } = {}) {
  if (!(await daCoPhanGiu068(client))) {
    console.log("gán SĐT S06: CHUA-AP-068 — hàm phân xử chưa giữ khoá seller_phone, lượt này không ghi");
    return { doi: 0, truc_tiep: 0, ghep: 0, rut: 0, khoi_phuc: 0, khong_ro: 0, tai_khoan_hai_so: 0, sai_e164: 0, bo_qua: "CHUA-AP-068" };
  }
  const coNhan = await daCoNhan070(client);
  if (!coNhan) console.log("gán SĐT S06: CHUA-AP-070 — view sale_offers chưa có cột nhãn, lượt này không ghi số ghép mới");
  const { rows } = await client.query(sql, [coNhan]);
  return { ...rows[0], bo_qua: null };
}

const RE_E164 = String.raw`^\+84[35789][0-9]{8}$`;

/**
 * Đo độ phủ SĐT tin S06 theo bán và thuê, tách tin sống với tin nghỉ, kèm các bất biến. Chỉ đọc, không trả số điện thoại.
 * `sai_e164` ở đây là số TRÊN TIN (phải 0); số sai dạng còn nằm ở stg đi riêng trong `sai_e164_stg`.
 * @param {import("pg").Client} client
 */
export async function doSdtS06(client) {
  const dem = (await client.query(`
    SELECT kind, count(*)::int AS tin,
           count(*) FILTER (WHERE retired_at IS NULL)::int AS song,
           count(*) FILTER (WHERE retired_at IS NOT NULL)::int AS nghi,
           count(seller_phone)::int AS co_so,
           count(seller_phone) FILTER (WHERE retired_at IS NULL)::int AS co_so_song,
           count(seller_phone) FILTER (WHERE retired_at IS NOT NULL)::int AS co_so_nghi,
           count(*) FILTER (WHERE field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-so-tren-tin')::int AS truc_tiep,
           count(*) FILTER (WHERE field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan')::int AS ghep
      FROM sale_offer_records WHERE source = 'S06' GROUP BY kind`)).rows;
  const theoLoai = (kind) => {
    const { kind: _k, ...r } = dem.find((x) => x.kind === kind)
      ?? { tin: 0, song: 0, nghi: 0, co_so: 0, co_so_song: 0, co_so_nghi: 0, truc_tiep: 0, ghep: 0 };
    return r;
  };
  const bb = (await client.query(`
    SELECT (SELECT count(*) FROM sale_offer_records r JOIN stg_chotot_ads s ON r.originating_system_key = s.list_id::text
             WHERE r.source = 'S06' AND coalesce(s.payload ->> 'phone_hidden', '') = 'true'
               AND r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan')::int AS an_so_bi_ghep,
           (SELECT count(*) FROM sale_offer_records WHERE source = 'S06' AND seller_phone !~ $1)::int AS sai_e164,
           (SELECT count(*) FROM stg_chotot_ads WHERE nullif(btrim(seller ->> 'phone'), '') !~ $1)::int AS sai_e164_stg,
           (SELECT count(*) FROM (
              SELECT payload ->> 'account_id' FROM stg_chotot_ads
               WHERE seller ->> 'phone' ~ $1 AND nullif(btrim(payload ->> 'account_id'), '') IS NOT NULL
               GROUP BY 1 HAVING count(DISTINCT seller ->> 'phone') >= 2) x)::int AS tai_khoan_hai_so,
           -- tu_tin phải là dòng stg cùng tài khoản đang mang đúng số; dòng đã mất số ở stg thì không tính là lệch.
           (SELECT count(*) FROM sale_offer_records r
              JOIN stg_chotot_ads tin ON r.originating_system_key = tin.list_id::text
              LEFT JOIN stg_chotot_ads goc ON goc.list_id = (r.field_provenance -> 'seller_phone' ->> 'tu_tin')::bigint
             WHERE r.source = 'S06' AND r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan'
               AND (goc.list_id IS NULL OR goc.payload ->> 'account_id' IS DISTINCT FROM tin.payload ->> 'account_id'
                    OR (goc.seller ? 'phone' AND goc.seller ->> 'phone' IS DISTINCT FROM r.seller_phone)))::int AS ghep_lech_tu_tin`,
    [RE_E164])).rows[0];
  // Tin tự trỏ về dòng không mang số cũng là lệch: dòng nguồn phải từng mang số, tin ghép thì chính nó không có số riêng.
  const tuTro = (await client.query(`
    SELECT count(*)::int AS n FROM sale_offer_records r
     WHERE r.source = 'S06' AND r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan'
       AND r.originating_system_key = r.field_provenance -> 'seller_phone' ->> 'tu_tin'`)).rows[0].n;
  return { ban: theoLoai("sale"), thue: theoLoai("rent_lt"), ...bb, ghep_lech_tu_tin: bb.ghep_lech_tu_tin + tuTro };
}

/**
 * Đếm số tin mang số ghép SAU một lượt gán, bằng câu riêng trên stg, không qua SQL_GAN. Đối chiếu kết quả của bộ gán: tin đang
 * trống hoặc đang ghép, không ẩn, không có số riêng, thuộc tài khoản đúng một số; cộng tin đang ghép mà tài khoản nay về 0 số
 * (giữ nguyên theo L9). Tin đang có số trực tiếp hoặc không rõ gốc không đếm.
 * @param {import("pg").Client} client
 */
export async function demDocLap(client) {
  const { rows } = await client.query(`
    WITH so_tk AS (
      SELECT payload ->> 'account_id' AS tk, count(DISTINCT seller ->> 'phone') AS n
        FROM stg_chotot_ads
       WHERE seller ->> 'phone' ~ $1 AND btrim(coalesce(payload ->> 'account_id', '')) <> ''
       GROUP BY 1
    )
    SELECT count(*)::int AS n
      FROM sale_offer_records r
      JOIN stg_chotot_ads s ON r.originating_system_key = s.list_id::text
      LEFT JOIN so_tk t ON t.tk = s.payload ->> 'account_id'
     WHERE r.source = 'S06'
       AND coalesce(s.payload ->> 'phone_hidden', '') <> 'true'
       AND coalesce(s.seller ->> 'phone', '') !~ $1
       AND (r.seller_phone IS NULL OR r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan')
       AND (t.n = 1 OR (t.n IS NULL AND r.field_provenance -> 'seller_phone' ->> 'rule_id' = 's06-cung-tai-khoan'))`,
    [RE_E164]);
  return rows[0].n;
}

/** Dấu cột SĐT của mọi tin S06, để chứng dữ liệu không đổi sau ROLLBACK. Không lộ số: chỉ trả md5. */
export async function md5Sdt(client) {
  const { rows } = await client.query(`
    SELECT md5(coalesce(string_agg(offer_id || '|' || coalesce(seller_phone, '') || '|' || coalesce(seller_phone_hash, '') || '|'
                 || coalesce(field_provenance ->> 'seller_phone', ''), ',' ORDER BY offer_id), '')) AS m
      FROM sale_offer_records WHERE source = 'S06'`);
  return rows[0].m;
}

/** Dòng kết quả lượt gán, chung cho chạy thật và --thu. */
export function dongGan(g) {
  return inKhongSo(`gan doi=${g.doi} truc_tiep=${g.truc_tiep} ghep=${g.ghep} rut=${g.rut} khoi_phuc=${g.khoi_phuc} khong_ro=${g.khong_ro}`);
}

/** Mã lỗi của lượt đo; rỗng là đạt. @returns {string[]} */
export function kiemBatBien(so) {
  const loi = [];
  const ghep = so.ban.ghep + so.thue.ghep;
  if (!so.da_ap_068) loi.push("CHUA-AP-068");
  if (so.an_so_bi_ghep > 0) loi.push("AN-SO-BI-GHEP");
  if (so.sai_e164 > 0) loi.push("SAI-E164-VAO-TIN");
  if (so.ghep_lech_tu_tin > 0) loi.push("TU-TIN-LECH");
  if (ghep !== so.dem_doc_lap) loi.push("DEM-LECH");
  if (ghep <= 0) loi.push("KHONG-CO-GHEP");
  if (so.md5_truoc !== so.md5_sau) loi.push("DB-DOI");
  return loi;
}

export { inKhongSo };

const dongLoai = (ten, truoc, sau) => inKhongSo(`${ten} tin=${sau.tin} song=${sau.song} nghi=${sau.nghi} truoc=${truoc.co_so} sau=${sau.co_so} `
  + `sau_song=${sau.co_so_song} sau_nghi=${sau.co_so_nghi} truc_tiep=${sau.truc_tiep} ghep=${sau.ghep}`);

/**
 * Đo trong giao dịch rồi ROLLBACK: tự áp 068, 070, gán, in số trước và sau. DB máy thu không đổi. Bất biến sai thì thoát 1.
 * md5 đo bằng client thứ hai, ngoài giao dịch, để chứng ROLLBACK thật.
 */
async function chayThu() {
  const c = new pg.Client({ connectionString: DB_URL });
  const c2 = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  await c2.connect();
  try {
    const md5_truoc = await md5Sdt(c2);
    await c.query("BEGIN");
    // Băm song song của các câu đo vượt /dev/shm 64 MB của container khi planner chọn; lượt đo không cần nhanh.
    await c.query("SET LOCAL max_parallel_workers_per_gather = 0");
    let so;
    try {
      await nap068(c);
      await nap070(c);
      const da_ap_068 = await daCoPhanGiu068(c);
      const truoc = await doSdtS06(c);
      const gan = await ganSdtS06(c);
      const sau = await doSdtS06(c);
      const dem_doc_lap = await demDocLap(c);
      so = { ...sau, da_ap_068, dem_doc_lap, md5_truoc };
      console.log(inKhongSo(`da_ap_068=${da_ap_068}`));
      console.log(dongLoai("ban", truoc.ban, sau.ban));
      console.log(dongLoai("thue", truoc.thue, sau.thue));
      console.log(dongGan(gan));
      console.log(inKhongSo(`tai_khoan_hai_so=${sau.tai_khoan_hai_so} an_so_bi_ghep=${sau.an_so_bi_ghep} sai_e164=${sau.sai_e164} `
        + `sai_e164_stg=${sau.sai_e164_stg} ghep_lech_tu_tin=${sau.ghep_lech_tu_tin} dem_doc_lap=${dem_doc_lap}`));
    } finally {
      await c.query("ROLLBACK");
    }
    so.md5_sau = await md5Sdt(c2);
    console.log(inKhongSo(`md5_khop=${so.md5_truoc === so.md5_sau}`));
    const loi = kiemBatBien(so);
    if (loi.length) {
      console.error(`BẤT BIẾN SAI: ${loi.join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    await c.end();
    await c2.end();
  }
}

/** Chạy tay: ghi thật. Hàm phân xử chưa giữ khoá thì ganSdtS06 tự bỏ qua. */
async function chayThat() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const gan = await ganSdtS06(c);
    console.log(inKhongSo(`${dongGan(gan)} tai_khoan_hai_so=${gan.tai_khoan_hai_so} sai_e164=${gan.sai_e164} bo_qua=${gan.bo_qua}`));
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) (process.argv.includes("--thu") ? chayThu() : chayThat()).catch((e) => { console.error(e.message); process.exit(1); });
