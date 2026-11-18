// phuong-tu-du-an.mjs — DA9: ghi phát biểu phường kế thừa từ dự án lên bài, rồi phân xử lại tin bị chạm
// (_acceptance/phuong-tu-du-an). Cột area_id của tin chỉ do resolve_offer_fields ghi (migration 099).
//   node scripts/phuong-tu-du-an.mjs          # chạy thử: chỉ đếm, không ghi
//   node scripts/phuong-tu-du-an.mjs --json   # như trên, số dạng máy đọc
//   node scripts/phuong-tu-du-an.mjs --ghi    # ghi + rút phần hết căn cứ + phân xử tin bị chạm, một giao dịch — chờ lời Mạnh
// Chạy lại sau khi dự án trên bài hay phường của nút đổi = xét lại: phát biểu hết căn cứ bị rút (xet-lai-du-an).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { resolveOffers } from "../lib/assert.mjs";
import { ASSERTION_FIELD } from "../lib/vocab.generated.mjs";
import { LY_DO_RUT, RULE, docDuLieu, tinhPhuong } from "../lib/phuong-tu-du-an.mjs";

function loi(msg, code) {
  return Object.assign(new Error(msg), { code });
}

async function kiemDb(client) {
  const { rows: [r] } = await client.query(
    `SELECT to_regclass('field_assertions') IS NOT NULL AS bang,
            coalesce((SELECT bool_or(pg_get_constraintdef(oid) LIKE '%' || $1 || '%') FROM pg_constraint
                       WHERE conname = 'field_assertions_field_chk'), false) AS o,
            to_regprocedure('resolve_offer_area_du_an(text[])') IS NOT NULL AS h`, [ASSERTION_FIELD.project_node_id]);
  if (!r.bang) throw loi("phuong-tu-du-an: chưa có field_assertions — DB chưa áp 045", "THIEU_DB");
  if (!r.o) throw loi(`phuong-tu-du-an: CHECK field_assertions_field_chk chưa có ${ASSERTION_FIELD.project_node_id} — DB chưa áp 096`, "THIEU_DB");
  if (!r.h) throw loi("phuong-tu-du-an: chưa có hàm resolve_offer_area_du_an — DB chưa áp 099", "THIEU_DB");
}

/**
 * Ghi tập phát biểu mong muốn của luật trong giao dịch của người gọi: rút dòng sống của luật không còn trong tập (bài mất
 * dự án, dự án đổi, nút đổi phường), chèn dòng mới. Không chạm luật khác.
 * @returns {Promise<{chen: number, rut: number, cham: string[]}>} cham = chủ thể có dòng bị rút hay được chèn
 */
export async function ghiPhatBieu(client, dong) {
  const f = ASSERTION_FIELD.area_id;
  const sk = dong.map((d) => d.subject_key);
  const va = dong.map((d) => String(d.value));
  const rut = await client.query(
    `UPDATE field_assertions fa SET retracted_at = clock_timestamp(), retract_reason = $3
      WHERE fa.retracted_at IS NULL AND fa.field = $1 AND fa.rule_id = $2
        AND NOT EXISTS (SELECT 1 FROM unnest($4::text[], $5::text[]) AS m(s, v) WHERE m.s = fa.subject_key AND m.v = fa.value)
      RETURNING fa.subject_key`,
    [f, RULE, LY_DO_RUT, sk, va]);
  if (process.env.PTD_LOI_SAU_LO) throw new Error("phuong-tu-du-an: lỗi tiêm sau lô đầu (chỉ test)");
  const cham = new Set(rut.rows.map((r) => r.subject_key));
  let chen = 0;
  for (let i = 0; i < dong.length; i += 2000) {
    const lo = dong.slice(i, i + 2000);
    const cot = (k) => lo.map((d) => (k === "evidence" ? JSON.stringify(d[k] ?? {}) : d[k] == null ? null : String(d[k])));
    const r = await client.query(
      `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, rule_id,
                                     evidence, observed_at)
       SELECT 'Property', s, f, v, t, m, mv, r, e, clock_timestamp()
         FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::jsonb[])
              AS x(s, f, v, t, m, mv, r, e)
        WHERE NOT EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.retracted_at IS NULL AND fa.subject_key = x.s
                            AND fa.field = x.f AND fa.rule_id = x.r AND fa.value = x.v)
       ON CONFLICT DO NOTHING
       RETURNING subject_key`,
      ["subject_key", "field", "value", "evidence_tier", "method", "method_version", "rule_id", "evidence"].map(cot));
    chen += r.rowCount;
    for (const x of r.rows) cham.add(x.subject_key);
  }
  return { chen, rut: rut.rowCount, cham: [...cham] };
}

/** Tin có chủ thể thuộc tập bị chạm — để phân xử lại. */
async function tinBiCham(client, cham) {
  if (!cham.length) return [];
  const { rows } = await client.query(
    `SELECT offer_id FROM sale_offer_records
      WHERE offer_subject_keys(source, originating_system_key, post_ids) && $1::text[] ORDER BY offer_id`, [cham]);
  return rows.map((r) => r.offer_id);
}

/**
 * @param {import("pg").Client} client
 * @param {{ghi?: boolean, json?: boolean, log?: (s: string) => void}} opts
 */
export async function chay(client, { ghi = false, json = false, log = console.log } = {}) {
  await kiemDb(client);
  const kq = tinhPhuong(await docDuLieu(client));
  const d = kq.dem;
  if (json) log(JSON.stringify(d));
  else {
    log(`bài có dự án ${d.bai_co_du_an} · nhận phường ${d.bai_nhan_phuong} · dự án mâu thuẫn ${d.du_an_mau_thuan}`);
    log(`nút nhiều phường ${d.nut_nhieu_phuong} · nút không phường ${d.nut_khong_phuong} · vùng không rõ ${d.vung_khong_ro} · không có nút ${d.khong_co_nut}`);
  }
  if (!ghi) {
    if (!json) log("chạy thử — không ghi (thêm --ghi để ghi)");
    return { ...kq, chen: 0, rut: 0, tin: 0 };
  }
  await client.query("BEGIN");
  try {
    const k = await ghiPhatBieu(client, kq.dong);
    const tin = await tinBiCham(client, k.cham);
    if (tin.length) await resolveOffers(client, tin);
    await client.query("COMMIT");
    if (!json) log(`đã ghi ${k.chen} phát biểu, rút ${k.rut}, phân xử lại ${tin.length} tin`);
    return { ...kq, chen: k.chen, rut: k.rut, tin: tin.length };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}

async function main(argv) {
  if (!process.env.DATABASE_URL) throw loi("phuong-tu-du-an: thiếu DATABASE_URL", "DOI_SO");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await chay(client, { ghi: argv.includes("--ghi"), json: argv.includes("--json") });
    return 0;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
    console.error(e.message);
    process.exit(e.code === "THIEU_DB" || e.code === "DOI_SO" ? 2 : 1);
  });
}
