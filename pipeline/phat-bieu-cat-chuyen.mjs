// phat-bieu-cat-chuyen.mjs — PL15 bước chuyển: mọi ô năm cột phân loại đang có giá trị mà chưa có phát biểu nào đỡ được
// ghi thành phát biểu «giá trị có trước» (legacy, lớp quan sát, hạng thấp nhất — Mạnh chọn lối (a), PL15 Hỏi-2), rồi mở
// cổng phân xử (ops_audit 'phat-bieu:cat-chuyen') và dựng lại năm cột. Cột y nguyên từng ô; sai khác duy nhất được khai
// trước: loại hình NULL → 'unknown' (quy tắc «không NULL vì chưa chạy»). Mỗi phát biểu legacy mang rule_id 'offer:<offer_id>'
// và evidence.offer_id: nó là giá trị của chính bản ghi, chỉ đỡ đúng tin ấy (tin cũ đổi khoá chung post với tin kế).
//
//   node pipeline/phat-bieu-cat-chuyen.mjs --thu   một giao dịch ROLLBACK: đo trước/sau, chạy hai lượt (lượt hai 0 legacy)
//   node pipeline/phat-bieu-cat-chuyen.mjs         chạy thật (sau merge, trước lượt nạp đêm đầu tiên) — COMMIT khi 0 lệch
//
// Spec: docs/superpowers/specs/2026-10-26-phat-bieu-va-phan-xu-design.md §3.3. Chỉ DB local (không sync cloud).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { VOCAB } from "./lib/vocab.generated.mjs";
import { napPhatBieu } from "./lib/nap-045.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const NAM_COT = VOCAB.enrich_field;
const MAC_DINH = { property_type: "unknown" };

/** Năm cột của mọi bản ghi tin dạng văn bản (số → chuỗi). */
const SQL_O = `SELECT offer_id, source, property_type, bedrooms::text AS bedrooms, bathrooms::text AS bathrooms,
                      street_raw, block_raw FROM sale_offer_records`;

/** Mốc từng ô: Map '<offer_id>|<trường>' → giá trị (null = trống). Kèm nguồn của từng tin. */
export async function chupMoc(client) {
  const { rows } = await client.query(SQL_O);
  const moc = new Map();
  const nguon = new Map();
  for (const r of rows) {
    nguon.set(r.offer_id, r.source);
    // chuỗi trắng là ô trống (bộ phân xử không dựng lại chuỗi rỗng) — cùng một nghĩa, không tính là lệch
    for (const f of NAM_COT) moc.set(`${r.offer_id}|${f}`, r[f] === null || r[f] === undefined || String(r[f]).trim() === "" ? null : r[f]);
  }
  return { moc, nguon };
}

/** Bảng đếm ô khác mặc định theo nguồn × trường. */
export function demO({ moc, nguon }) {
  const out = {};
  for (const [k, v] of moc) {
    const [id, f] = k.split("|");
    if (v === null || v === MAC_DINH[f]) continue;
    const s = nguon.get(id);
    out[s] ??= Object.fromEntries(NAM_COT.map((x) => [x, 0]));
    out[s][f]++;
  }
  return out;
}

/**
 * So từng ô hai mốc. Sai khác được phép duy nhất: property_type NULL → 'unknown'.
 * @returns {{ lech: Array<{offer_id, field, truoc, sau}>, nullUnknown: string[] }}
 */
export function soMoc(a, b) {
  const lech = [];
  const nullUnknown = [];
  for (const [k, va] of a.moc) {
    const vb = b.moc.has(k) ? b.moc.get(k) : null;
    if (va === vb) continue;
    const [offer_id, field] = k.split("|");
    if (field === "property_type" && va === null && vb === "unknown") { nullUnknown.push(offer_id); continue; }
    lech.push({ offer_id, field, truoc: va, sau: vb });
  }
  return { lech, nullUnknown };
}

/**
 * Cắt chuyển trong giao dịch của người gọi.
 * @returns {Promise<{truoc, sau, legacyMoi: number, nullUnknown: string[], lech: Array}>}
 */
export async function catChuyen(client, { actor = "cat-chuyen:045" } = {}) {
  const moc = await chupMoc(client);
  const { rowCount: legacyMoi } = await client.query(
    `WITH o AS (
       SELECT offer_id, source, coalesce(originating_system_key, post_ids[1]) AS neo,
              offer_subject_keys(source, originating_system_key, post_ids) AS subj,
              NULLIF(property_type, 'unknown') AS property_type, bedrooms::text AS bedrooms, bathrooms::text AS bathrooms,
              street_raw, block_raw
         FROM sale_offer_records
     ), o_ AS (
       SELECT o.offer_id, o.source, o.neo, o.subj, x.f, x.v
         FROM o, LATERAL (VALUES ('property_type', o.property_type), ('bedrooms', o.bedrooms), ('bathrooms', o.bathrooms),
                                 ('street_raw', o.street_raw), ('block_raw', o.block_raw)) x(f, v)
        WHERE x.v IS NOT NULL AND btrim(x.v) <> '' AND o.neo IS NOT NULL
     ), sk AS (SELECT DISTINCT offer_id, f, unnest(subj) AS subject_key FROM o_)
     INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence)
     SELECT o_.source || ':' || o_.neo, o_.f, o_.v, 'observed', 'legacy', '045', 'offer:' || o_.offer_id,
            jsonb_build_object('note', 'giá trị có trước 045, không căn cứ', 'offer_id', o_.offer_id)
       FROM o_
      WHERE NOT EXISTS (SELECT 1 FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.field = sk.f
                         AND fa.retracted_at IS NULL WHERE sk.offer_id = o_.offer_id AND sk.f = o_.f)
     ON CONFLICT DO NOTHING`);
  const truoc = demO(moc);
  const { rows: [au] } = await client.query(
    `INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'phat-bieu:cat-chuyen', 'local', $2) RETURNING id`,
    [actor, { truoc, legacy_moi: legacyMoi }]);
  await client.query("SELECT resolve_offer_fields(NULL)");
  const sauMoc = await chupMoc(client);
  const sau = demO(sauMoc);
  const { lech, nullUnknown } = soMoc(moc, sauMoc);
  await client.query(`UPDATE ops_audit SET detail = detail || $2::jsonb WHERE id = $1`,
    [au.id, { sau, lech: lech.length, null_thanh_unknown: nullUnknown.length }]);
  return { truoc, sau, legacyMoi, nullUnknown, lech };
}

function inBang(ten, bang, out) {
  out(`${ten}:`);
  for (const [s, cot] of Object.entries(bang).sort()) out(`  ${s}  ${NAM_COT.map((f) => `${f}=${cot[f]}`).join("  ")}`);
}

async function main(argv) {
  const thu = argv.includes("--thu");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const dem = async () => (await c.query(
    `SELECT (SELECT count(*) FROM field_assertions)::int AS fa, (SELECT count(*) FROM ops_audit)::int AS au`)).rows[0];
  try {
    const coBang = (await c.query("SELECT to_regclass('field_assertions') IS NOT NULL AS co")).rows[0].co;
    if (!thu && !coBang) { console.error("cat-chuyen: DB chưa áp migration 045 — áp trước rồi chạy lại"); return 2; }
    const d0 = coBang ? await dem() : null;
    await c.query("BEGIN");
    let ok = false;
    try {
      await c.query("SELECT pg_advisory_xact_lock(33033)");
      if (thu) await napPhatBieu(c, { moCong: false });
      const r = await catChuyen(c, { actor: thu ? "cat-chuyen:thu" : "cat-chuyen:045" });
      inBang("trước", r.truoc, console.log);
      inBang("sau", r.sau, console.log);
      console.log(`property_type NULL → unknown: ${r.nullUnknown.length} (khai trước)${r.nullUnknown.length
        ? ` — ${r.nullUnknown.slice(0, 10).join(", ")}${r.nullUnknown.length > 10 ? " …" : ""}` : ""}`);
      console.log(`legacy mới: ${r.legacyMoi}`);
      for (const x of r.lech.slice(0, 10)) console.log(`  lệch ${x.offer_id} · ${x.field}: «${x.truoc}» → «${x.sau}»`);
      ok = r.lech.length === 0;
      if (thu) {
        const r2 = await catChuyen(c, { actor: "cat-chuyen:thu-2" });
        console.log(`lượt hai — legacy mới: ${r2.legacyMoi}`);
        ok = ok && r2.legacyMoi === 0 && r2.lech.length === 0;
      }
    } finally {
      if (thu || !ok) await c.query("ROLLBACK"); else await c.query("COMMIT");
    }
    if (thu && d0) {
      const d1 = await dem();
      if (d1.fa !== d0.fa || d1.au !== d0.au) { console.error("cat-chuyen --thu: DB thật bị đổi"); return 1; }
    }
    console.log(ok ? (thu ? "cat-chuyen --thu: ĐẠT (ROLLBACK)" : "cat-chuyen: ĐẠT (COMMIT)") : "cat-chuyen: LỆCH — không ghi (ROLLBACK)");
    return ok ? 0 : 1;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
