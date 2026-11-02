// catchup.mjs — hồ sơ sellers-view-len-cloud E4 (AC-4): tệp catch-up cloud của 060 có khối ĐO TRƯỚC phân biệt cloud đúng/sai và
// khối ÁP không DDL, không câu nào của 060. ĐO TRƯỚC chạy trên DB thử (catchup.sh dựng) trong BEGIN … ROLLBACK, ba trạng thái:
// tốt (sellers là bảng theo 022, không registry_aliases) · sellers là view · có registry_aliases. Không chạm Supabase.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const DB_URL = process.env.DB_URL;
assert.match(DB_URL ?? "", /\/oneinvest_p4_svc_catchup$/, "chỉ chạy trên DB thử oneinvest_p4_svc_catchup");

const TEP = path.join(ROOT, "docs/ops/cloud-schema-catchup-2026-10-31-060.sql");
const text = readFileSync(TEP, "utf8");

/** Tách hai khối ở dòng mở đầu «-- ÁP». */
export function tach(t) {
  const m = t.match(/^-- ÁP\b.*$/m);
  if (!m) throw new Error("THIEU KHOI AP");
  return { doTruoc: t.slice(0, m.index), ap: t.slice(m.index) };
}
const boChuThich = (s) => s.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n").trim();
/** Câu lệnh SQL (không chú thích) của một khối, chuẩn hoá khoảng trắng. */
const cauLenh = (s) => boChuThich(s).split(";").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);

const CAU_060 = cauLenh(readFileSync(path.join(ROOT, "db/migrations/060_sdt_e164.sql"), "utf8"));
/** Khối ÁP sạch: không DDL nào, không chạm registry_aliases, không câu nào trùng 060. */
export function kiemAp(ap) {
  const lenh = boChuThich(ap);
  if (/\b(CREATE|DROP|ALTER)\b/i.test(lenh) && /\bsellers\b/i.test(lenh)) throw new Error("AP CO DDL SELLERS");
  if (/\b(CREATE|DROP|ALTER|TRUNCATE)\b/i.test(lenh)) throw new Error("AP CO DDL");
  if (/registry_aliases|seller_phone\s*~/i.test(lenh)) throw new Error("AP CHAM 060");
  const trung = cauLenh(ap).filter((x) => CAU_060.includes(x));
  if (trung.length) throw new Error(`AP CHEP 060: ${trung[0].slice(0, 60)}`);
}

const { doTruoc, ap } = tach(text);
kiemAp(ap);
assert.ok(CAU_060.length > 0, "không đọc được câu lệnh nào của 060");
// Đối chứng đỏ: bản chép khối ÁP thêm câu tạo view sellers → bắt.
assert.throws(() => kiemAp(`${ap}\nCREATE OR REPLACE VIEW sellers AS SELECT 1;\n`), /AP CO DDL SELLERS/);
const sqlDo = boChuThich(doTruoc);
assert.ok(/^SELECT\b/i.test(sqlDo) && !/\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(sqlDo), "ĐO TRƯỚC không chỉ đọc");
const kyVong = text.match(/Kỳ vọng: (\S+?)\./)?.[1];
assert.equal(kyVong, "OK", "tệp không ghi dòng kỳ vọng «Kỳ vọng: OK.»");

const DDL_022 = readFileSync(path.join(ROOT, "db/migrations/022_chotot_source.sql"), "utf8").match(
  /CREATE TABLE IF NOT EXISTS sellers \([\s\S]*?\n\);/,
)?.[0];
assert.ok(DDL_022, "không rút được CREATE TABLE sellers từ 022");

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
const doLuc = async () => (await c.query(sqlDo)).rows[0].kiem;
/** Một trạng thái cloud dựng trong SAVEPOINT; trả dòng kiem. */
async function trangThai(ten, dung) {
  await c.query(`SAVEPOINT ${ten}`);
  try {
    await dung();
    return await doLuc();
  } finally {
    await c.query(`ROLLBACK TO SAVEPOINT ${ten}`);
  }
}
try {
  await c.query("BEGIN");
  // Hình cloud tốt: sellers là bảng theo 022, không registry_aliases.
  await c.query("DROP VIEW IF EXISTS sellers CASCADE");
  await c.query("DROP TABLE IF EXISTS registry_aliases CASCADE");
  await c.query(DDL_022);
  const ket = {
    tot: await doLuc(),
    view: await trangThai("view", async () => {
      await c.query("DROP TABLE sellers CASCADE");
      await c.query("CREATE VIEW sellers AS SELECT 'x'::text AS phone_hash, '{}'::text[] AS sources, 0 AS n_ads, now() AS first_seen, now() AS last_seen, '{}'::jsonb AS flags");
    }),
    alias: await trangThai("alias", () => c.query("CREATE TABLE registry_aliases (object_key text, kind text, value text)")),
  };
  console.log(`# ĐO TRƯỚC: ${JSON.stringify(ket)}`);
  assert.equal(ket.tot, kyVong, `trạng thái tốt ra «${ket.tot}» ≠ kỳ vọng`);
  assert.notEqual(ket.view, kyVong, "sellers là view mà ĐO TRƯỚC vẫn OK");
  assert.match(ket.view, /sellers/, "ĐO TRƯỚC không gọi tên sellers");
  assert.notEqual(ket.alias, kyVong, "có registry_aliases mà ĐO TRƯỚC vẫn OK");
  assert.match(ket.alias, /registry_aliases/, "ĐO TRƯỚC không gọi tên registry_aliases");
  console.log("CATCHUP OK");
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
