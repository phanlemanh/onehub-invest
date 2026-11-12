// ma-can-s06-sach.mjs — DA5 (_acceptance/ma-can-s06-sach): dọn mã căn, số nhà rác của tin S06 và đo nghĩa pty_project_type.
// Rác = phát biểu S06 lớp trường nguồn còn hiệu lực đọc từ cờ hiển thị *_display (chỉ 0, 1), hoặc mã căn 0…/1, số nhà 0…
// từ trường thật. Bộ đọc đã thôi sinh rác (lib/dac-trung-s06.mjs); lệnh này rút phần đã ghi trước đó.
//   node scripts/ma-can-s06-sach.mjs                       # chạy thử: chỉ đếm, không ghi
//   node scripts/ma-can-s06-sach.mjs --ghi                 # rút rác rồi phân xử lại tin bị chạm (một giao dịch) — chờ lời Mạnh
//   node scripts/ma-can-s06-sach.mjs --bang-pty <tệp.md>   # bảng nghĩa pty_project_type theo category (chỉ đọc)
// Chỉ in số đếm, không in giá trị thật ngoài giá trị rác.
import { writeFileSync } from "node:fs";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { resolveOffers } from "../lib/assert.mjs";

/** Diện dọn: phát biểu S06 trường nguồn còn hiệu lực, mã căn/số nhà, từ cờ hoặc mang giá trị rác. */
export const DIEN = `subject_key LIKE 'S06:%' AND method = 'source_field' AND retracted_at IS NULL
  AND field IN ('unit_number', 'street_number')
  AND (rule_id IN ('payload.unitnumber_display', 'payload.streetnumber_display')
       OR (field = 'unit_number' AND btrim(value) ~ '^(0+|1)$')
       OR (field = 'street_number' AND btrim(value) ~ '^0+$'))`;

/** Nhãn loại nhà của category S06. */
export const LOAI = { 1010: "căn hộ", 1020: "nhà", 1030: "văn phòng, mặt bằng", 1040: "đất", 1050: "phòng" };
/** Giả thuyết của ZCode (lo-trinh.json, DA5 ghi chú) — đo lại trước khi dùng. */
export const GIA_THUYET = { 1: "căn hộ", 3: "căn hộ", 4: "căn hộ", 7: "căn hộ", 2: "shophouse", 10: "nhà phố", 11: "đất nền" };

async function kiemBang(client) {
  const { rows: [r] } = await client.query(`SELECT to_regclass('field_assertions') IS NOT NULL AS ok`);
  if (!r.ok) {
    const e = new Error("ma-can-s06-sach: chưa có field_assertions — DB chưa áp 045/059");
    e.code = "CHUA_CO_BANG";
    throw e;
  }
}

/** Mã tin (offer_id) của các chủ thể S06. */
async function tinCua(client, subjects) {
  if (!subjects.length) return [];
  const { rows } = await client.query(
    `SELECT DISTINCT offer_id FROM sale_offer_records
      WHERE source = 'S06' AND 'S06:' || originating_system_key = ANY($1::text[])`, [subjects]);
  return rows.map((r) => r.offer_id);
}

/**
 * Chạy thử: đếm rác theo (trường, rule_id, giá trị), số tin sẽ phân xử lại, và độ phủ toà.
 * @returns {Promise<{rac: {field: string, rule_id: string, value: string, n: number}[], tin_cham: number,
 *   toa: {co_block: number, co_toa: number}}>}
 */
export async function demRac(client) {
  await kiemBang(client);
  const { rows } = await client.query(
    `SELECT field, rule_id, btrim(value) AS value, count(*)::int AS n FROM field_assertions WHERE ${DIEN}
      GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`);
  const { rows: s } = await client.query(`SELECT DISTINCT subject_key FROM field_assertions WHERE ${DIEN}`);
  const tin = await tinCua(client, s.map((r) => r.subject_key));
  const { rows: [t] } = await client.query(
    `SELECT count(*)::int AS co_block,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM field_assertions fa
              WHERE fa.subject_key = 'S06:' || a.list_id AND fa.field = 'block_raw' AND fa.method = 'source_field'
                AND fa.rule_id = 'payload.block' AND fa.retracted_at IS NULL))::int AS co_toa
       FROM stg_chotot_ads a
      WHERE a.price > 0 AND a.size_m2 > 0 AND a.ad_type IN ('s', 'u') AND coalesce(btrim(a.payload->>'block'), '') <> ''`);
  return { rac: rows, tin_cham: tin.length, toa: t };
}

/**
 * Rút rác (lý do co-hien-thi-nguon cho rule cờ, gia-tri-rac cho giá trị rác từ trường thật) rồi phân xử lại tin bị chạm.
 * Chạy trong giao dịch của người gọi.
 * @returns {Promise<{rut: number, tin: number}>}
 */
export async function donRac(client) {
  await kiemBang(client);
  const { rows } = await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(),
            retract_reason = CASE WHEN rule_id LIKE 'payload.%_display' THEN 'co-hien-thi-nguon' ELSE 'gia-tri-rac' END
      WHERE ${DIEN} RETURNING subject_key`);
  const tin = await tinCua(client, [...new Set(rows.map((r) => r.subject_key))]);
  if (tin.length) await resolveOffers(client, tin);
  return { rut: rows.length, tin: tin.length };
}

/**
 * Bảng nghĩa pty_project_type: mỗi giá trị — số tin, số tin theo category, loại đa số và tỉ lệ (trên số tin của giá trị),
 * giả thuyết ZCode. Không kết luận khớp/lệch.
 */
export async function bangPty(client) {
  const { rows } = await client.query(
    `SELECT payload->>'pty_project_type' AS v, category, count(*)::int AS n FROM stg_chotot_ads
      WHERE coalesce(payload->>'pty_project_type', '') <> '' GROUP BY 1, 2`);
  const theo = new Map();
  for (const r of rows) {
    const h = theo.get(r.v) ?? { gia_tri: r.v, n: 0, theo_loai: Object.fromEntries(Object.keys(LOAI).map((k) => [k, 0])), khac: 0 };
    if (String(r.category) in LOAI) h.theo_loai[String(r.category)] += r.n; else h.khac += r.n;
    h.n += r.n;
    theo.set(r.v, h);
  }
  const hang = [...theo.values()].sort((a, b) => Number(a.gia_tri) - Number(b.gia_tri) || a.gia_tri.localeCompare(b.gia_tri));
  for (const h of hang) {
    const [k, m] = Object.entries(h.theo_loai).sort((a, b) => b[1] - a[1])[0];
    h.da_so = m > 0 ? LOAI[k] : null;
    h.ti_le = h.n ? m / h.n : 0;
    h.gia_thuyet = GIA_THUYET[Number(h.gia_tri)] ?? null;
  }
  return { hang, tong: hang.reduce((s, h) => s + h.n, 0) };
}

/** Bảng markdown của bangPty. */
export function veBangPty(kq, { sinhBoi, luc }) {
  const k = Object.keys(LOAI);
  const dong = [
    "# Nghĩa `pty_project_type` của tin S06 — đo theo loại nhà người bán chọn (`category`)",
    "",
    `Sinh bởi \`${sinhBoi}\` lúc ${luc}. Nhãn đo là \`category\` của chính tin (người bán chọn, có thể lệch); bảng không tự kết`,
    "luận khớp hay lệch — đặt số cạnh giả thuyết của ZCode để người đọc cân (hàng DA5, `_acceptance/ma-can-s06-sach/`).",
    "",
    `| Giá trị | Số tin | ${k.map((c) => `${LOAI[c]} (${c})`).join(" | ")} | Khác | Loại đa số | Tỉ lệ | Giả thuyết ZCode |`,
    `|---|---|${k.map(() => "---").join("|")}|---|---|---|---|`,
    ...kq.hang.map((h) => `| ${h.gia_tri} | ${h.n} | ${k.map((c) => h.theo_loai[c]).join(" | ")} | ${h.khac} | ${h.da_so ?? "—"} | `
      + `${(h.ti_le * 100).toFixed(1)}% | ${h.gia_thuyet ?? "chưa có"} |`),
    "",
    `Tổng: ${kq.tong} tin có \`pty_project_type\`.`,
    "",
  ];
  return dong.join("\n");
}

async function main(argv) {
  const ghi = argv.includes("--ghi");
  const iBang = argv.indexOf("--bang-pty");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  try {
    if (iBang >= 0) {
      const tep = argv[iBang + 1];
      if (!tep) throw Object.assign(new Error("ma-can-s06-sach: --bang-pty cần đường tệp"), { code: "DOI_SO" });
      const kq = await bangPty(client);
      writeFileSync(tep, veBangPty(kq, { sinhBoi: "node pipeline/scripts/ma-can-s06-sach.mjs --bang-pty", luc: new Date().toISOString() }));
      console.log(`bảng pty: ${kq.hang.length} giá trị, ${kq.tong} tin → ${tep}`);
      return 0;
    }
    const d = await demRac(client);
    for (const r of d.rac) console.log(`rác: ${r.field} · ${r.rule_id} · «${r.value}» · ${r.n}`);
    console.log(`rác: tổng ${d.rac.reduce((s, r) => s + r.n, 0)} phát biểu · ${d.tin_cham} tin sẽ phân xử lại`);
    const tl = d.toa.co_block ? (100 * d.toa.co_toa / d.toa.co_block).toFixed(1) : "—";
    console.log(`toà: ${d.toa.co_block} tin có block trong thô · ${d.toa.co_toa} tin có block_raw hiệu lực · ${tl}%`);
    if (!ghi) { console.log("chạy thử — không ghi (thêm --ghi để rút)"); return 0; }
    await client.query("BEGIN");
    try {
      const k = await donRac(client);
      await client.query("COMMIT");
      console.log(`đã rút ${k.rut} phát biểu, phân xử lại ${k.tin} tin`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
    return 0;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
    console.error(e.message);
    process.exit(e.code === "CHUA_CO_BANG" || e.code === "DOI_SO" ? 2 : 1);
  });
}
