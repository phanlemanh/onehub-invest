// dung-lai-canonical.mjs — PL15 thước bật: «xoá cột canonical rồi dựng lại: kết quả trùng từng ô» (AC-7) và kiểm nguồn
// gốc (AC-4). Mọi chế độ tự chứa trong MỘT giao dịch ROLLBACK: nạp 045 khi DB chưa áp, chụp mốc TRƯỚC cắt chuyển, cắt
// chuyển, rồi đo — không phụ thuộc job đêm (đang chạy mã main) đã để DB ở trạng thái nào.
//
//   node pipeline/scripts/dung-lai-canonical.mjs                       xoá năm cột + nguồn gốc → dựng lại → so từng ô
//   node pipeline/scripts/dung-lai-canonical.mjs --nguon-goc           mọi ô khác mặc định có nguồn gốc trỏ phát biểu sống
//   node pipeline/scripts/dung-lai-canonical.mjs --doi-chung=<ca>      ghi-thang | rut | legacy-khac — phải thấy lệch (exit 1)
//
// Ghi thẳng năm cột ở đây là CỐ Ý (đặt về mặc định trong giao dịch đo) — chỗ duy nhất được miễn bộ quét
// (lib/scan-canonical-write.mjs CHO_PHEP).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { VOCAB } from "../lib/vocab.generated.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { catChuyen, chupMoc, soMoc } from "../phat-bieu-cat-chuyen.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const NAM_COT = VOCAB.enrich_field;

/**
 * Ô khác mặc định thiếu nguồn gốc hợp lệ: thiếu mục, thiếu tier/method/ids, id không phải phát biểu sống của chính tin
 * (đúng trường), hoặc giá trị nguồn gốc khác giá trị ô.
 */
export async function kiemNguonGoc(client) {
  const { rows } = await client.query(
    `WITH o AS (
       SELECT offer_id, field_provenance AS p, offer_subject_keys(source, originating_system_key, post_ids) AS subj,
              NULLIF(property_type, 'unknown') AS property_type, bedrooms::text AS bedrooms, bathrooms::text AS bathrooms,
              street_raw, block_raw
         FROM sale_offer_records
     ), cells AS (
       SELECT o.offer_id, x.f, x.v, o.p -> x.f AS pr, o.subj
         FROM o, LATERAL (VALUES ('property_type', o.property_type), ('bedrooms', o.bedrooms), ('bathrooms', o.bathrooms),
                                 ('street_raw', o.street_raw), ('block_raw', o.block_raw)) x(f, v)
        WHERE x.v IS NOT NULL
     )
     SELECT offer_id, f AS field,
            CASE WHEN pr IS NULL THEN 'thiếu nguồn gốc'
                 WHEN pr ->> 'tier' IS NULL OR pr ->> 'method' IS NULL OR jsonb_array_length(coalesce(pr -> 'ids', '[]')) = 0
                   THEN 'thiếu tier/method/ids'
                 WHEN pr ->> 'v' IS DISTINCT FROM v THEN 'giá trị nguồn gốc khác ô'
                 WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(pr -> 'ids') i
                               WHERE NOT EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.id = i::bigint
                                                   AND fa.retracted_at IS NULL AND fa.field = cells.f
                                                   AND fa.subject_key = ANY (cells.subj)))
                   THEN 'id không phải phát biểu sống của tin'
            END AS ly_do,
            count(*) OVER () AS n
       FROM cells`);
  return { nO: rows.length ? Number(rows[0].n) : 0, moCoi: rows.filter((r) => r.ly_do).map(({ n, ...r }) => r) };
}

const DOI_CHUNG = ["ghi-thang", "rut", "legacy-khac"];

/**
 * Trong giao dịch của người gọi: mốc (trước cắt chuyển) → [legacy-khac] → cắt chuyển → [ghi-thang | rut] → chụp trước xoá
 * → đặt năm cột về mặc định → dựng lại → so (a) với trạng thái trước xoá, (b) với mốc → lượt dựng thứ hai.
 */
export async function dungLai(client, { doiChung = null } = {}) {
  const moc = await chupMoc(client);
  if (doiChung === "legacy-khac") {
    const { rows: [o] } = await client.query(
      `SELECT offer_id, source, coalesce(originating_system_key, post_ids[1]) AS neo FROM sale_offer_records
        WHERE street_raw IS NOT NULL AND coalesce(originating_system_key, post_ids[1]) IS NOT NULL ORDER BY offer_id LIMIT 1`);
    // giá trị «!» xếp trước mọi tên đường cùng hạng — bộ phân xử chọn nó, ô lệch mốc
    await client.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, evidence)
      VALUES ($1, 'street_raw', '!', 'observed', 'legacy', 'doi-chung', jsonb_build_object('offer_id', $2::text))`,
    [`${o.source}:${o.neo}`, o.offer_id]);
  }
  await catChuyen(client, { actor: "dung-lai:do" });
  if (doiChung === "ghi-thang") {
    await client.query(`UPDATE sale_offer_records SET bathrooms = 7
      WHERE offer_id = (SELECT offer_id FROM sale_offer_records WHERE bathrooms IS NULL ORDER BY offer_id LIMIT 1)`);
  } else if (doiChung === "rut") {
    await client.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'doi-chung'
      WHERE id = (SELECT min(id) FROM field_assertions WHERE retracted_at IS NULL AND field = 'street_raw')`);
  }
  const truocXoa = await chupMoc(client);
  await client.query(`UPDATE sale_offer_records SET property_type = 'unknown', bedrooms = NULL, bathrooms = NULL,
    street_raw = NULL, block_raw = NULL, field_provenance = '{}'::jsonb`);
  await client.query("SELECT resolve_offer_fields(NULL)");
  const sau = await chupMoc(client);
  const a = soMoc(truocXoa, sau);                     // xoá rồi dựng lại ra y nguyên
  const b = soMoc(moc, sau);                          // y nguyên so với trước cắt chuyển (trừ NULL → unknown)
  const lech = [...a.lech, ...b.lech.filter((x) => !a.lech.some((y) => y.offer_id === x.offer_id && y.field === x.field))];
  const { rows: [r2] } = await client.query("SELECT resolve_offer_fields(NULL) AS r");
  const maTran = {};
  for (const [k, v] of sau.moc) {
    const [id, f] = k.split("|");
    const s = sau.nguon.get(id);
    maTran[s] ??= Object.fromEntries(NAM_COT.map((x) => [x, { o: 0, lech: 0 }]));
    if (v !== null && v !== "unknown") maTran[s][f].o++;
  }
  for (const x of lech) maTran[sau.nguon.get(x.offer_id)][x.field].lech++;
  return { N: sau.nguon.size, maTran, lech, nullUnknown: b.nullUnknown, luotHai: r2.r.offers_changed };
}

/** Băm năm cột (+ nguồn gốc khi DB đã có cột) của mọi bản ghi — chứng DB thật không đổi sau ROLLBACK. */
async function bamCot(client) {
  const { rows: [co] } = await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_offer_records' AND column_name = 'field_provenance') AS co`);
  const { rows } = await client.query(`SELECT md5(string_agg(offer_id || '|' || coalesce(property_type, '∅') || '|' ||
    coalesce(bedrooms::text, '∅') || '|' || coalesce(bathrooms::text, '∅') || '|' || coalesce(street_raw, '∅') || '|' ||
    coalesce(block_raw, '∅') ${co.co ? "|| '|' || field_provenance::text" : ""}, ',' ORDER BY offer_id)) AS h FROM sale_offer_records`);
  return rows[0].h;
}

async function main(argv) {
  const doiChung = argv.find((a) => a.startsWith("--doi-chung="))?.split("=")[1] ?? null;
  if (doiChung && !DOI_CHUNG.includes(doiChung)) { console.error(`dung-lai: đối chứng lạ «${doiChung}» (${DOI_CHUNG.join(" | ")})`); return 2; }
  const nguonGoc = argv.includes("--nguon-goc");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  let code = 0;
  try {
    const h0 = await bamCot(c);
    await c.query("BEGIN");
    try {
      await c.query("SELECT pg_advisory_xact_lock(33033)");
      await napPhatBieu(c, { moCong: false });
      if (nguonGoc) {
        await catChuyen(c, { actor: "dung-lai:nguon-goc" });
        const { nO, moCoi } = await kiemNguonGoc(c);
        for (const x of moCoi.slice(0, 10)) console.log(`  mồ côi ${x.offer_id} · ${x.field}: ${x.ly_do}`);
        console.log(`nguon-goc: ${nO} ô khác mặc định · mồ côi ${moCoi.length}`);
        code = nO === 0 ? 2 : moCoi.length ? 1 : 0;
        if (nO === 0) console.error("nguon-goc: không có ô để kiểm");
      } else {
        const r = await dungLai(c, { doiChung });
        const tong = Object.values(r.maTran).reduce((s, m) => s + NAM_COT.reduce((t, f) => t + m[f].o, 0), 0);
        for (const [s, m] of Object.entries(r.maTran).sort()) {
          console.log(`  ${s}  ${NAM_COT.map((f) => `${f}=${m[f].o}/lệch ${m[f].lech}`).join("  ")}`);
        }
        console.log(`S05 property_type NULL → unknown (khai trước): ${r.nullUnknown.length}`);
        if (doiChung) {
          if (r.lech.length) {
            for (const x of r.lech.slice(0, 3)) console.log(`đối chứng ${doiChung}: lệch ${x.offer_id} · ${x.field} «${x.truoc}» → «${x.sau}»`);
            code = 1;
          } else { console.log(`đối chứng ${doiChung}: KHÔNG thấy lệch — thước hỏng`); code = 4; }
        } else if (r.N === 0 || tong === 0) {
          console.error("dung-lai: không có gì để dựng"); code = 2;
        } else {
          for (const x of r.lech.slice(0, 10)) console.log(`  lệch ${x.offer_id} · ${x.field}: «${x.truoc}» → «${x.sau}»`);
          console.log(`dung-lai: ${r.N} bản ghi · lệch ${r.lech.length} · lượt hai đổi ${r.luotHai} dòng`);
          code = r.lech.length === 0 && r.luotHai === 0 ? 0 : 1;
          if (code === 0) console.log("dung-lai: ĐẠT");
        }
      }
    } finally {
      await c.query("ROLLBACK");
    }
    if ((await bamCot(c)) !== h0) { console.error("dung-lai: DB thật bị đổi sau ROLLBACK"); code = 1; }
    return code;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
