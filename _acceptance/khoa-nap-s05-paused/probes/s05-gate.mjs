#!/usr/bin/env node
// Cổng S05 paused của pipeline/apify-facebook-collector.mjs (2510-4) — chạy collector THẬT trên DB TẠM
// acc_s05_<pid> (pg_dump -s source_registry từ :5433, chỉ đọc), HOME giả, fetch bị thay bằng bản đếm
// lời gọi và luôn ném lỗi (không gọi mạng thật, không gọi Apify). Xoá DB tạm khi xong.
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DB = `acc_s05_${process.pid}`;
const psql = (db, sql) => spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost", "-d", db, "-v", "ON_ERROR_STOP=1", "-qAt"], { input: sql, encoding: "utf8" });
let fail = 0;
const check = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) fail++; };
const T = mkdtempSync(join(tmpdir(), "acc-s05-"));
const home = join(T, "home"); mkdirSync(home);
const preload = join(T, "chan-fetch.mjs");
const fetchLog = join(T, "fetch.log");
writeFileSync(preload, `import { appendFileSync } from "node:fs";
globalThis.fetch = async (u) => { appendFileSync(${JSON.stringify(fetchLog)}, String(u) + "\\n"); throw new Error("acc: mạng bị chặn"); };`);
const url = (db) => { const u = new URL("postgres://placeholder/x"); u.username = "oneinvest"; u.password = "oneinvest"; u.hostname = "localhost"; u.port = "5433"; u.pathname = "/" + db; return u.toString(); };
const run = (dbUrl) => {
  writeFileSync(fetchLog, "");
  const r = spawnSync(process.execPath, ["--import", preload, join(ROOT, "pipeline/apify-facebook-collector.mjs")], {
    cwd: join(ROOT, "pipeline"), encoding: "utf8", timeout: 60_000,
    env: { PATH: process.env.PATH, HOME: home, DATABASE_URL: dbUrl },
  });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), fetches: readFileSync(fetchLog, "utf8").split("\n").filter(Boolean) };
};
try {
  if (psql("oneinvest", `DROP DATABASE IF EXISTS ${DB}; CREATE DATABASE ${DB};`).status !== 0) throw new Error("không tạo được DB tạm");
  const schema = spawnSync("docker", ["exec", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "pg_dump", "-U", "oneinvest", "-h", "localhost", "-s", "-t", "source_registry", "oneinvest"], { encoding: "utf8" }).stdout;
  check(psql(DB, schema).status === 0, "dựng bảng source_registry trên DB tạm (pg_dump -s, chỉ đọc :5433)");
  psql(DB, `INSERT INTO source_registry (code, real_name, label_vi, status, source_ids) VALUES ('S05','acc-canh','x','paused','{acc-s05}');`);
  // (a) paused → bỏ qua thu, exit 0, 0 lời gọi mạng
  let r = run(url(DB));
  check(r.code === 0, `(a) S05 paused: collector thoát 0 (được ${r.code})`);
  check(/S05 paused — bỏ qua thu/.test(r.out), "(a) log 'S05 paused — bỏ qua thu'");
  check(r.fetches.length === 0, `(a) should-NOT-fire: 0 lời gọi mạng (được ${r.fetches.length}: ${r.fetches.join(" ")})`);
  check(!/acc-canh/.test(r.out), "(a) không in real_name ra log");
  // (b) active → qua cổng, tới bước creds (HOME giả không có token → lỗi) — vẫn 0 lời gọi Apify
  psql(DB, `UPDATE source_registry SET status='active' WHERE code='S05';`);
  r = run(url(DB));
  check(!/S05 paused/.test(r.out), "(b) S05 active: should-NOT-fire — không có dòng 'S05 paused'");
  check(r.code !== 0, `(b) active + HOME giả không token: collector đi tiếp tới creds và thoát khác 0 (được ${r.code})`);
  check(!r.fetches.some((u) => /apify\.com/.test(u)), "(b) không gọi Apify thật");
  // (c) DB không tới → fail-open (coi như active), có cảnh báo
  const chet = new URL("postgres://placeholder/acc"); chet.hostname = "127.0.0.1"; chet.port = "1"; chet.username = "acc";
  r = run(chet.toString());
  check(/coi như active/.test(r.out), "(c) DB không tới: log cảnh báo 'coi như active' (fail-open)");
  check(!/S05 paused/.test(r.out), "(c) DB không tới: không coi là paused");
  // (d) thiếu dòng S05 → bỏ qua như paused
  psql(DB, `DELETE FROM source_registry WHERE code='S05';`);
  r = run(url(DB));
  check(r.code === 0 && /S05 paused — bỏ qua thu/.test(r.out) && r.fetches.length === 0, `(d) thiếu dòng S05: bỏ qua thu, exit 0, 0 lời gọi mạng (code ${r.code})`);
} finally {
  psql("oneinvest", `DROP DATABASE IF EXISTS ${DB};`);
}
check(psql("oneinvest", `SELECT count(*) FROM pg_database WHERE datname='${DB}'`).stdout.trim() === "0", "DB tạm đã xoá");
if (fail) { console.log(`S05-GATE FAIL (${fail} mục)`); process.exit(1); }
console.log("S05-GATE PASS");
