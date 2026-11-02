// khai-so-nhom.mjs — hồ sơ _acceptance/s03-len-cong (SL1): khai market_codes và thẻ nhóm (note) của đơn vị S03.
//   node khai-so-nhom.mjs --tep <tệp> [--ghi]   mặc định chỉ in số đếm; --ghi mới ghi, một giao dịch.
// Tệp đã duyệt nằm ở research-local/ (không vào kho): nhom[].{unit_code, market_codes, the, the_ma}. Sai là dừng trước
// khi ghi: đơn vị lạ, thiếu đơn vị của sổ, mã thị trường lạ, thẻ thiếu một vế, hay nhóm cùng tên nơi có thẻ nơi không.
// Không đổi enabled, status. Stdout và nhật ký chỉ mang số đếm, mã đơn vị: không khoá nhóm, không tên nhóm.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

const ACTOR = "machine:khai-so-nhom";

const baoLoi = (loi) => {
  if (loi.length) throw new Error(`khai-so-nhom: ${loi.length} lỗi, không ghi gì\n${loi.join("\n")}`);
};
const cungTap = (a, b) => a.length === b.length && [...a].sort().join("\n") === [...b].sort().join("\n");
export const noteThe = (n) => (n.the ? `[${n.the_ma}] ${n.the}` : null);

export async function khaiSoNhom(client, tep, { ghi = false, out = console.log } = {}) {
  const nhom = JSON.parse(readFileSync(tep, "utf8")).nhom;
  if (!Array.isArray(nhom)) throw new Error("khai-so-nhom: tệp thiếu khoá nhom");
  const { rows: so } = await client.query(
    "SELECT unit_code, group_key, market_codes, note FROM collection_units WHERE source_code = 'S03'");
  const theoMa = new Map(so.map((r) => [r.unit_code, r]));
  // Tên nhóm lấy từ bài đã thu: cột name của sổ còn là tên giữ chỗ, trùng cho nhiều đơn vị.
  const { rows: ten } = await client.query(
    `SELECT DISTINCT ON (conversation_id) conversation_id, group_name FROM stg_zalo_posts
      WHERE conversation_id = ANY ($1) ORDER BY conversation_id, posted_at DESC`, [so.map((r) => r.group_key)]);
  const tenNhom = new Map(ten.map((r) => [r.conversation_id, r.group_name]));
  const tenCua = (r) => tenNhom.get(r.group_key) ?? r.group_key;
  const { rows: tt } = await client.query("SELECT id FROM areas WHERE region_type = 'market'");
  const maTT = new Set(tt.map((r) => r.id));

  const loi = [];
  const daGap = new Set();
  for (const n of nhom) {
    if (!theoMa.has(n.unit_code)) loi.push(`đơn vị không có trong sổ S03: ${n.unit_code}`);
    if (daGap.has(n.unit_code)) loi.push(`đơn vị khai hai lần: ${n.unit_code}`);
    daGap.add(n.unit_code);
    for (const m of n.market_codes ?? []) if (!maTT.has(m)) loi.push(`${n.unit_code}: mã thị trường lạ ${m}`);
    if (!n.the !== !n.the_ma) loi.push(`${n.unit_code}: thẻ thiếu một vế`);
  }
  for (const r of so) if (!daGap.has(r.unit_code)) loi.push(`thiếu đơn vị: ${r.unit_code}`);
  const coThe = new Set(nhom.filter((n) => n.the && theoMa.has(n.unit_code)).map((n) => tenCua(theoMa.get(n.unit_code))));
  for (const n of nhom) {
    const r = theoMa.get(n.unit_code);
    if (r && !n.the && coThe.has(tenCua(r))) loi.push(`thiếu thẻ: ${n.unit_code} (nhóm cùng tên đã có thẻ)`);
  }
  baoLoi(loi);

  const doi = nhom.filter((n) => {
    const r = theoMa.get(n.unit_code);
    return !cungTap(r.market_codes, n.market_codes ?? []) || r.note !== noteThe(n);
  });
  if (ghi) {
    for (const n of doi) {
      await client.query(
        "UPDATE collection_units SET market_codes = $2, note = $3, updated_at = now() WHERE source_code = 'S03' AND unit_code = $1",
        [n.unit_code, n.market_codes ?? [], noteThe(n)]);
      await client.query(
        "INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'unit.update_meta', 'local', $2::jsonb)",
        [ACTOR, JSON.stringify({ thao_tac: "set-meta", unit_code: n.unit_code })]);
    }
  }
  const dem = {
    don_vi: nhom.length,
    don_vi_co_the: nhom.filter((n) => n.the).length,
    ten_nhom_co_the: coThe.size,
    don_vi_co_thi_truong: nhom.filter((n) => n.market_codes?.length).length,
    can_doi: doi.length,
    da_ghi: ghi ? doi.length : 0,
  };
  out(JSON.stringify(dem));
  return dem;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--tep");
  const tep = i > 0 ? process.argv[i + 1] : null;
  if (!tep) {
    console.error("cách dùng: node khai-so-nhom.mjs --tep <tệp> [--ghi]");
    process.exit(2);
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    await khaiSoNhom(client, tep, { ghi: process.argv.includes("--ghi") });
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
