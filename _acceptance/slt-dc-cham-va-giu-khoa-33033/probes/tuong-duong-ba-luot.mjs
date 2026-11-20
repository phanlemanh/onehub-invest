// tuong-duong-ba-luot.mjs — AC-2: chạy đúng chuỗi transform của SLT-DC-7/9 (suy loại tắt → bật → tắt), rồi một lượt S06
// (transform-chotot) và một lượt S05 (transform-fb), trong một giao dịch ROLLBACK trên DB của lượt (db-thu.sh --chay).
// Ở MỖI lần câu rút (writeAssertions replaceOwn) được gọi: so tập id câu cũ rút (ép enable_nestloop=off cho nó chạy xong) với
// tập id câu mới rút trên cùng trạng thái (SAVEPOINT) — hai lần: mảng thật, và mảng nhiễu (1/20 giá trị đổi) để tập rút
// không rỗng (đối chứng dương). Câu mới phải xong dưới 60 s mỗi lần. In «TUONG DUONG OK»; lệch → «LECH». Chỉ in số.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const P = path.join(ROOT, "pipeline");
const pg = createRequire(path.join(P, "package.json"))("pg");
const imp = (rel) => import(pathToFileURL(path.join(P, rel)).href);
const { napPhatBieu } = await imp("lib/nap-045.mjs");
const { runTransformZalo } = await imp("transform-zalo.mjs");
const { runTransformChotot } = await imp("transform-chotot.mjs");
const { runTransformFb } = await imp("transform-fb.mjs");
const { SQL_RUT_THAY } = await imp("lib/assert.mjs");
// Câu cũ trước hồ sơ (main a60adccb8, pipeline/lib/assert.mjs:42) — chép nguyên văn; không import tệp test (import là chạy ca).
const SQL_GOC =
  `WITH moi AS (SELECT DISTINCT s, f, m, assertion_value_key(v) AS vk
                  FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(s, f, m, v))
   UPDATE field_assertions fa SET retracted_at = clock_timestamp(), retract_reason = 'thay-boi-luot'
     FROM (SELECT s, f, m FROM moi GROUP BY s, f, m) k
    WHERE fa.retracted_at IS NULL AND fa.subject_key = k.s AND fa.field = k.f AND fa.method = k.m
      AND NOT EXISTS (SELECT 1 FROM moi x WHERE x.s = k.s AND x.f = k.f AND x.m = k.m AND x.vk = fa.value_key)`;

const URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(URL)) { console.error("tuong-duong: chỉ chạy trên DB của lượt (db-thu.sh --chay)"); process.exit(2); }

const c = new pg.Client({ connectionString: URL });
await c.connect();
const goc = c.query.bind(c);
const tapRut = async (sql, params, pre) => {
  await goc("SAVEPOINT p");
  try {
    for (const s of pre) await goc(s);
    return (await goc(`${sql} RETURNING fa.id`, params)).rows.map((r) => String(r.id)).sort();
  } finally { await goc("ROLLBACK TO SAVEPOINT p"); }
};
let lan = 0, lech = 0, tongRut = 0, tongRutNhieu = 0, cham = 0, nhan = "";
const so = (cu, moi) => { const a = new Set(cu), b = new Set(moi); return cu.filter((x) => !b.has(x)).length + moi.filter((x) => !a.has(x)).length; };
c.query = async (text, params) => {
  if (text === SQL_RUT_THAY) {
    lan++;
    const nhieu = [params[0], params[1], params[2], params[3].map((v, i) => (i % 20 === 0 ? `${v}-nhieu` : v))];
    const cu = await tapRut(SQL_GOC, params, ["SET LOCAL enable_nestloop = off"]);
    const t0 = Date.now();
    const moi = await tapRut(SQL_RUT_THAY, params, []);
    const giay = (Date.now() - t0) / 1000;
    const cuN = await tapRut(SQL_GOC, nhieu, ["SET LOCAL enable_nestloop = off"]);
    const moiN = await tapRut(SQL_RUT_THAY, nhieu, []);
    const l = so(cu, moi) + so(cuN, moiN);
    lech += l; tongRut += cu.length; tongRutNhieu += cuN.length;
    if (giay > 60) cham++;
    process.stdout.write(`lần gọi ${lan} (${nhan}): mảng ${params[0].length} · cũ rút ${cu.length} · mới rút ${moi.length} · nhiễu: cũ ${cuN.length} mới ${moiN.length} · lệch ${l} · câu mới ${giay.toFixed(1)} s\n`); // transform tắt console.log trong lúc chạy
  }
  return goc(text, params);
};
const im = async (opts) => { const l = console.log; console.log = () => {}; try { await runTransformZalo(c, opts); } finally { console.log = l; } };
try {
  await goc("BEGIN");
  await goc("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(c);
  await goc(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hanoi__zalo-agent__2099-03-03T000000','hanoi','zalo-agent','{}') ON CONFLICT (snapshot_id) DO NOTHING`);
  for (const suyLoaiTin of [false, true, false]) { nhan = `S03 suy loại ${suyLoaiTin ? "bật" : "tắt"}`; await im({ suyLoaiTin }); }
  const imF = async (fn) => { const l = console.log; console.log = () => {}; try { await fn(c); } finally { console.log = l; } };
  nhan = "S06 transform-chotot"; await imF(runTransformChotot);
  nhan = "S05 transform-fb"; await imF(runTransformFb);
} finally {
  await goc("ROLLBACK").catch(() => {});
  await c.end();
}
if (lan < 5) { console.log(`LECH: chỉ ${lan} lần gọi câu rút, cần ≥ 5 (ba lượt S03, một S06, một S05)`); process.exit(1); }
if (!tongRutNhieu) { console.log("LECH: mảng nhiễu không rút dòng nào — đối chứng dương hỏng"); process.exit(1); }
if (lech) { console.log(`LECH: ${lech} id lệch qua ${lan} lần gọi`); process.exit(1); }
if (cham) { console.log(`LECH: ${cham} lần câu mới quá 60 s`); process.exit(1); }
console.log(`TUONG DUONG OK — ${lan} lần gọi, rút thật ${tongRut} id, rút nhiễu ${tongRutNhieu} id, lệch 0`);
