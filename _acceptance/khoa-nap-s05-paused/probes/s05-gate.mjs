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
  const schema = spawnSync("docker", ["exec", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "pg_dump", "-U", "oneinvest", "-h", "localhost", "-s", "-t", "source_registry", "-t", "collection_units", "-t", "source_groups", "oneinvest"], { encoding: "utf8" }).stdout;
  psql(DB, schema); // pg_dump -t không mang hàm trigger của 048 → psql báo lỗi ở CREATE TRIGGER; kiểm theo quan hệ đã có
  check(psql(DB, "SELECT to_regclass('source_registry') IS NOT NULL AND to_regclass('collection_units') IS NOT NULL AND to_regclass('source_groups') IS NOT NULL").stdout.trim() === "t", "dựng source_registry + collection_units/view source_groups trên DB tạm (pg_dump -s, chỉ đọc :5433)");
  // 047 (TV2a) thêm CHECK paused phải có reason — thiếu reason thì INSERT hỏng lặng lẽ và ca (a)(b) đo nhầm «không có dòng»
  check(psql(DB, `INSERT INTO source_registry (code, real_name, label_vi, status, reason, source_ids) VALUES ('S05','acc-canh','x','paused','acc: thử cổng','{acc-s05}');`).status === 0, "chèn dòng S05 paused (kèm reason theo 047)");
  // (a) paused → bỏ qua thu, exit 0, 0 lời gọi mạng
  let r = run(url(DB));
  check(r.code === 0, `(a) S05 paused: collector thoát 0 (được ${r.code})`);
  // TV2b (cong-tac-that) đổi chữ log sang lý do của vong-doi: «S05 nguon-paused — bỏ qua thu»
  check(/S05 (nguon-)?paused — bỏ qua thu/.test(r.out), "(a) log 'S05 nguon-paused — bỏ qua thu'");
  check(r.fetches.length === 0, `(a) should-NOT-fire: 0 lời gọi mạng (được ${r.fetches.length}: ${r.fetches.join(" ")})`);
  check(!/acc-canh/.test(r.out), "(a) không in real_name ra log");
  // (b) active → qua cổng, tới bước creds (HOME giả không có token → lỗi) — vẫn 0 lời gọi Apify
  psql(DB, `UPDATE source_registry SET status='active' WHERE code='S05';`);
  // một nhóm S05 active (bảng gốc collection_units của 048, mã đơn vị ghi tay vì pg_dump -t không mang trigger cấp mã) để (b) đi qua cổng nguồn + nhóm tới bước creds (TV2b: 0 nhóm active thì cũng «bỏ qua thu»)
  check(psql(DB, `INSERT INTO collection_units (source_code, group_key, name, status, unit_code, unit_type) VALUES ('S05','acc-nhom','acc','active','S05-N999','nhom');`).status === 0, "chèn một nhóm S05 active");
  r = run(url(DB));
  check(!/bỏ qua thu/.test(r.out) && !/fail-closed/.test(r.out), "(b) S05 active: should-NOT-fire — không 'bỏ qua thu', không dừng fail-closed");
  check(r.code !== 0, `(b) active + HOME giả không token: collector đi tiếp tới creds và thoát khác 0 (được ${r.code})`);
  check(!r.fetches.some((u) => /apify\.com/.test(u)), "(b) không gọi Apify thật");
  // (c) DB không tới → DỪNG (fail-closed, Mạnh duyệt 27/10 ở cong-tac-that, đảo fail-open của 2510-4): thoát ≠0, 0 lời gọi
  const chet = new URL("postgres://placeholder/acc"); chet.hostname = "127.0.0.1"; chet.port = "1"; chet.username = "acc";
  r = run(chet.toString());
  check(r.code !== 0 && /fail-closed/.test(r.out), `(c) DB không tới: thoát khác 0, log fail-closed (được ${r.code})`);
  check(r.fetches.length === 0, `(c) should-NOT-fire: 0 lời gọi mạng khi DB không tới (được ${r.fetches.length})`);
  // (d) thiếu dòng S05 → bỏ qua như paused
  psql(DB, `DELETE FROM source_registry WHERE code='S05';`);
  r = run(url(DB));
  check(r.code === 0 && /S05 (nguon-khong-co|paused) — bỏ qua thu/.test(r.out) && r.fetches.length === 0, `(d) thiếu dòng S05: bỏ qua thu, exit 0, 0 lời gọi mạng (code ${r.code})`);
} finally {
  psql("oneinvest", `DROP DATABASE IF EXISTS ${DB};`);
}
check(psql("oneinvest", `SELECT count(*) FROM pg_database WHERE datname='${DB}'`).stdout.trim() === "0", "DB tạm đã xoá");
if (fail) { console.log(`S05-GATE FAIL (${fail} mục)`); process.exit(1); }
console.log("S05-GATE PASS");
