// du-an-tren-tin-s03.mjs — ghi dự án (project_node_id) lên bài S03 từ sổ nhóm một-dự-án và tên bài tự nêu
// (_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten). Không gọi model: dùng nhãn bạc đã có.
//   node scripts/du-an-tren-tin-s03.mjs                         # chạy thử: chỉ đếm, không ghi
//   node scripts/du-an-tren-tin-s03.mjs --json                  # như trên, số dạng máy đọc
//   node scripts/du-an-tren-tin-s03.mjs --ghi                   # ghi + rút phần hết căn cứ, một giao dịch — chờ lời Mạnh
//   node scripts/du-an-tren-tin-s03.mjs --bang-mau-thuan <tệp>  # bảng tin mâu thuẫn để người duyệt (không chữ bài)
// Chạy lại sau khi sổ nhóm hay danh bạ đổi = xét lại: bài mất căn cứ bị rút, bài đổi dự án được thay.
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { ASSERTION_FIELD } from "../lib/vocab.generated.mjs";
import { LY_DO_RUT, RULE, docDuLieu, tinhDuAn } from "../lib/du-an-tren-tin-s03.mjs";

function loi(msg, code) {
  return Object.assign(new Error(msg), { code });
}

async function kiemDb(client) {
  const { rows: [r] } = await client.query(
    `SELECT to_regclass('field_assertions') IS NOT NULL AS bang,
            coalesce((SELECT bool_or(pg_get_constraintdef(oid) LIKE '%' || $1 || '%') FROM pg_constraint
                       WHERE conname = 'field_assertions_field_chk'), false) AS o`, [ASSERTION_FIELD.project_node_id]);
  if (!r.bang) throw loi("du-an-tren-tin-s03: chưa có field_assertions — DB chưa áp 045", "THIEU_DB");
  if (!r.o) throw loi(`du-an-tren-tin-s03: CHECK field_assertions_field_chk chưa có ${ASSERTION_FIELD.project_node_id} — DB chưa áp 096`, "THIEU_DB");
}

/**
 * Ghi tập phát biểu mong muốn của hai luật trong giao dịch của người gọi: thay dòng sống cùng (bài, luật) mà giá trị khác,
 * chèn dòng mới, rút dòng sống của hai luật ở bài không còn trong tập. Không chạm luật hay phương pháp khác.
 * @returns {Promise<{chen: number, rut: number}>}
 */
export async function ghiPhatBieu(client, dong) {
  const f = ASSERTION_FIELD.project_node_id;
  const rules = Object.values(RULE);
  const sk = dong.map((d) => d.subject_key);
  const ru = dong.map((d) => d.rule_id);
  const va = dong.map((d) => String(d.value));
  // Dòng sống của hai luật không còn trong tập mong muốn (bài mất căn cứ, hay đổi giá trị).
  const rut = await client.query(
    `UPDATE field_assertions fa SET retracted_at = clock_timestamp(), retract_reason = $4
      WHERE fa.retracted_at IS NULL AND fa.field = $1 AND fa.rule_id = ANY ($2::text[])
        AND NOT EXISTS (SELECT 1 FROM unnest($3::text[], $5::text[], $6::text[]) AS m(s, r, v)
                         WHERE m.s = fa.subject_key AND m.r = fa.rule_id AND m.v = fa.value)`,
    [f, rules, sk, LY_DO_RUT, ru, va]);
  if (process.env.DAT_LOI_SAU_LO) throw new Error("du-an-tren-tin-s03: lỗi tiêm sau lô đầu (chỉ test)");
  let chen = 0;
  for (let i = 0; i < dong.length; i += 2000) {
    const lo = dong.slice(i, i + 2000);
    const cot = (k) => lo.map((d) => (k === "evidence" ? JSON.stringify(d[k] ?? {}) : d[k] == null ? null : String(d[k])));
    const r = await client.query(
      `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
       SELECT s, f, v, t, m, mv, r, e, clock_timestamp()
         FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::jsonb[])
              AS x(s, f, v, t, m, mv, r, e)
        WHERE NOT EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.retracted_at IS NULL AND fa.subject_key = x.s
                            AND fa.field = x.f AND fa.rule_id = x.r AND fa.value = x.v)
       ON CONFLICT DO NOTHING`,
      ["subject_key", "field", "value", "evidence_tier", "method", "method_version", "rule_id", "evidence"].map(cot));
    chen += r.rowCount;
  }
  return { chen, rut: rut.rowCount };
}

/** Bảng tin mâu thuẫn (TSV): mã tin · dự án ứng viên · nguồn (luật:dự án) · lý do. Không chữ bài. */
export function veBangMauThuan(mauThuan) {
  return ["offer_id\tung_vien\tnguon\tly_do",
    ...mauThuan.map((m) => `${m.offer_id}\t${m.ung_vien.join(",")}\t${m.nguon.join(",")}\t${m.ly_do}`)].join("\n") + "\n";
}

/**
 * @param {import("pg").Client} client
 * @param {{ghi?: boolean, bangMauThuan?: string|null, json?: boolean, log?: (s: string) => void}} opts
 */
export async function chay(client, { ghi = false, bangMauThuan = null, json = false, log = console.log } = {}) {
  await kiemDb(client);
  const kq = tinhDuAn(await docDuLieu(client));
  if (bangMauThuan) writeFileSync(bangMauThuan, veBangMauThuan(kq.mauThuan));
  if (json) log(JSON.stringify(kq.dem));
  else {
    const d = kq.dem;
    log(`tin S03 ${d.tin_s03} · tin (i) sổ nhóm ${d.tin_i} · tin (ii) tên bài ${d.tin_ii} · trùng ${d.trung}`);
    log(`tin có dự án ${d.tin_co_du_an} · mâu thuẫn ${d.mau_thuan} · còn lại ${d.con_lai}`);
    log(`bài (i) ${d.bai_i} · bài (ii) ${d.bai_ii} · bỏ tầng cao ${d.bo_tang_cao} · nhãn ngoài căn cứ ${d.ngoai_can_cu} · tên mơ hồ ${d.ten_mo_ho} · nhóm lệch ${d.nhom_lech}`);
  }
  if (!ghi) {
    if (!json) log("chạy thử — không ghi (thêm --ghi để ghi)");
    return { ...kq, chen: 0, rut: 0 };
  }
  await client.query("BEGIN");
  try {
    const k = await ghiPhatBieu(client, kq.dong);
    await client.query("COMMIT");
    if (!json) log(`đã ghi ${k.chen} phát biểu, rút ${k.rut}`);
    return { ...kq, ...k };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}

async function main(argv) {
  const iBang = argv.indexOf("--bang-mau-thuan");
  const bangMauThuan = iBang >= 0 ? argv[iBang + 1] : null;
  if (iBang >= 0 && !bangMauThuan) throw loi("du-an-tren-tin-s03: --bang-mau-thuan cần đường tệp", "DOI_SO");
  if (!process.env.DATABASE_URL) throw loi("du-an-tren-tin-s03: thiếu DATABASE_URL", "DOI_SO");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await chay(client, { ghi: argv.includes("--ghi"), json: argv.includes("--json"), bangMauThuan });
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
