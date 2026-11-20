// tuong-duong-ba-luot.mjs — AC-2: chạy đúng chuỗi transform của SLT-DC-7/9 (suy loại tắt → bật → tắt) trong một giao dịch
// ROLLBACK trên DB của lượt (db-thu.sh --chay đặt DATABASE_URL). Ở MỖI lần writeAssertions(replaceOwn): tập id câu cũ rút
// (ép enable_nestloop=off để nó chạy xong) so với tập id câu mới rút, trên cùng trạng thái (SAVEPOINT), rồi mới chạy thật.
// In «TUONG DUONG OK» khi mọi lần gọi lệch 0; «LECH» kèm số khi không. Chỉ in số, không in chữ bài.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const P = path.join(ROOT, "pipeline");
const pg = createRequire(path.join(P, "package.json"))("pg");
const imp = (rel) => import(pathToFileURL(path.join(P, rel)).href);
const { napPhatBieu } = await imp("lib/nap-045.mjs");
const { runTransformZalo } = await imp("transform-zalo.mjs");
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
let lan = 0, lech = 0, tongRut = 0;
c.query = async (text, params) => {
  if (text === SQL_RUT_THAY) {
    lan++;
    const cu = await tapRut(SQL_GOC, params, ["SET LOCAL enable_nestloop = off"]);
    const moi = await tapRut(SQL_RUT_THAY, params, []);
    const a = new Set(cu), b = new Set(moi);
    const chiCu = cu.filter((x) => !b.has(x)).length, chiMoi = moi.filter((x) => !a.has(x)).length;
    lech += chiCu + chiMoi; tongRut += cu.length;
    console.log(`lần gọi ${lan}: mảng ${params[0].length} · cũ rút ${cu.length} · mới rút ${moi.length} · lệch ${chiCu + chiMoi}`);
  }
  return goc(text, params);
};
const im = async (opts) => { const l = console.log; console.log = () => {}; try { await runTransformZalo(c, opts); } finally { console.log = l; } };
try {
  await goc("BEGIN");
  await goc("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(c);
  await goc(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hanoi__zalo-agent__2099-03-03T000000','hanoi','zalo-agent','{}') ON CONFLICT (snapshot_id) DO NOTHING`);
  for (const suyLoaiTin of [false, true, false]) await im({ suyLoaiTin });
} finally {
  await goc("ROLLBACK").catch(() => {});
  await c.end();
}
if (lan < 3) { console.log(`LECH: chỉ ${lan} lần gọi câu rút, cần ≥ 3 (một lần mỗi lượt transform)`); process.exit(1); }
if (lech) { console.log(`LECH: ${lech} id lệch qua ${lan} lần gọi`); process.exit(1); }
console.log(`TUONG DUONG OK — ${lan} lần gọi, ${tongRut} id rút, lệch 0`);
