#!/usr/bin/env node
// db-rieng.mjs — răng của hồ sơ wanted-thanh-inquiry (AC-3, E3). Thử migration 050 CHƯA GỘP trên một DB riêng, không trên
// DB `oneinvest` dùng chung (luật đợt 27/10 00:10Z): tạo `oneinvest_u1_inquiry_<pid>` trên cùng máy chủ, dựng lược đồ
// bằng scripts/ci-db-init.mjs (mọi migration theo số, gồm 050), chạy pipeline/scripts/vocab-db.itest.mjs trỏ vào DB đó,
// rồi xoá DB trong `finally` — kể cả khi test lỗi. Hàm xoá chỉ nhận đúng khuôn tên, tên khác → ném, không xoá gì.
//
//   node _acceptance/wanted-thanh-inquiry/rang/db-rieng.mjs            lượt thường
//   node _acceptance/wanted-thanh-inquiry/rang/db-rieng.mjs --ep-loi   test ném giữa chừng — DB tạm vẫn phải biến mất
// Thoát 0 xanh · 1 test đỏ hoặc DB tạm còn sót hoặc DB oneinvest bị chạm · 2 không dựng được DB tạm.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
const GOC = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const KHUON = /^oneinvest_u1_inquiry_\d+$/;
const urlDb = (ten) => { const u = new URL(GOC); u.pathname = `/${ten}`; return u.toString(); };

async function voiDb(ten, fn) {
  const c = new pg.Client({ connectionString: urlDb(ten) });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

/** Xoá DB tạm — chỉ tên đúng khuôn `oneinvest_u1_inquiry_<số>`. */
export async function xoaDbTam(ten) {
  if (!KHUON.test(ten)) throw new Error(`tên DB ngoài khuôn: ${ten}`);
  await voiDb("postgres", (c) => c.query(`DROP DATABASE IF EXISTS "${ten}" WITH (FORCE)`));
}

const conSot = () => voiDb("postgres", async (c) =>
  (await c.query("SELECT datname FROM pg_database WHERE datname LIKE 'oneinvest_u1_inquiry_%'")).rows.map((r) => r.datname));
const dauVetGoc = () => voiDb("oneinvest", async (c) => ({
  bang: (await c.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'")).rows[0].n,
  wanted: (await c.query("SELECT count(*)::int AS n FROM ref_lookup WHERE lookup_value = 'wanted'")).rows[0].n,
}));

async function main() {
  const epLoi = process.argv.includes("--ep-loi");
  const ten = `oneinvest_u1_inquiry_${process.pid}`;
  const truoc = await dauVetGoc();
  let ma = 0;
  try {
    await voiDb("postgres", (c) => c.query(`CREATE DATABASE "${ten}"`));
    const env = { ...process.env, DATABASE_URL: urlDb(ten), ...(epLoi ? { VOCAB_DB_EP_LOI: "1" } : {}) };
    const init = spawnSync(process.execPath, [path.join(ROOT, "scripts/ci-db-init.mjs")], { cwd: ROOT, env, encoding: "utf8" });
    process.stderr.write(init.stdout + init.stderr);
    if (init.status !== 0) { console.error(`db riêng: ci-db-init thoát ${init.status}`); return 2; }
    const soMig = (init.stdout + init.stderr).match(/áp (\d+) migration/)?.[1] ?? "?";
    const t = spawnSync(process.execPath, ["--test", "scripts/vocab-db.itest.mjs"], { cwd: path.join(ROOT, "pipeline"), env, encoding: "utf8" });
    process.stderr.write(t.stdout + t.stderr);
    ma = t.status === 0 ? 0 : 1;
    console.log(`db riêng: dựng · áp ${soMig} migration · test ${ma === 0 ? "xanh" : "ĐỎ"}`);
  } finally {
    await xoaDbTam(ten);
    console.log("db riêng: đã xoá");
  }
  const sot = await conSot();
  if (sot.length) { console.error(`db riêng: còn sót ${sot.join(", ")}`); ma = 1; }
  const sau = await dauVetGoc();
  if (JSON.stringify(sau) !== JSON.stringify(truoc)) {
    console.error(`db riêng: DB oneinvest bị chạm ${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
    ma = 1;
  }
  // đối chứng rào tên: hai tên ngoài khuôn phải bị từ chối, không DROP gì
  for (const sai of ["oneinvest", "oneinvest_u1_inquiry_x"]) {
    try { await xoaDbTam(sai); console.error(`răng hỏng: xoaDbTam nhận «${sai}»`); ma = 1; }
    catch (e) { if (!/tên DB ngoài khuôn/.test(e.message)) { console.error(`răng hỏng: ${e.message}`); ma = 1; } }
  }
  if (ma === 0) console.log("db riêng: rào tên từ chối 2/2 · không còn DB tạm · DB oneinvest không đổi");
  return ma;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => process.exit(m), (e) => { console.error(`db riêng: ${e.message}`); process.exit(2); });
}
