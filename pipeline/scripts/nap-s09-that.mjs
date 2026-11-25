#!/usr/bin/env node
// nap-s09-that.mjs — hồ sơ nap-s09 E4 (AC-4): bộ nạp S09 trên dữ liệu thật, không ghi DB máy thu.
// Chép DB máy thu sang DB thử oneinvest_suite_ns09that_<pid> (db/db-thu.sh, xoá khi xong), áp 097 nếu thiếu, rồi chạy
// đúng dòng lệnh triển khai `node pipeline/import-s09.mjs <snapshot>` (tiến trình con, trỏ bản chép) hai lần trên bản thu
// S09 13/11. So: lần một 345/345 bỏ 0/0/0, lần hai 0/345; v_s09_toa hai khu 115 và 61, v_s09_phan_khu 13 và 7. Đếm dòng
// stg_s09_item của DB máy thu trước và sau (chỉ đọc) — phải bằng nhau. Bản chép đã có dòng S09 của snapshot → thoát 3.
// Chỉ in số, không in payload hay tên nguồn.   node pipeline/scripts/nap-s09-that.mjs   (lệch → thoát 1 nêu ô)
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const GOC = join(import.meta.dirname, "../..");
const MAY = "postgres://oneinvest:oneinvest@localhost:5433";
const TEN = `oneinvest_suite_ns09that_${process.pid}`;
const chinh = () => join(spawnSync("git", ["-C", GOC, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).stdout.trim(), "..");
const SNAP_ID = "vn__s09-du-an__2026-11-13T120908161";
const SNAP = join(process.env.S09_SNAPSHOT_GOC ?? join(chinh(), "collector/snapshots"), "vn", SNAP_ID);
const DU_AN = { "cf917354-48bf-11eb-b378-0242ac130002": { toa: 115, phan_khu: 13 }, "e9932857-bf1d-e587-1674-464b129516ed": { toa: 61, phan_khu: 7 } };

async function demMayThu() {
  const c = new pg.Client({ connectionString: `${MAY}/oneinvest` });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    if (!(await c.query("SELECT to_regclass('public.stg_s09_item') AS t")).rows[0].t) return "khong-co-bang";
    return (await c.query("SELECT count(*)::int AS n FROM stg_s09_item")).rows[0].n;
  } finally {
    await c.end();
  }
}

/** Chạy đúng lệnh triển khai, trỏ bản chép; trả {ghi, tong, bo:[a,b,c]} rút từ dòng tổng kết. */
function napMotLan() {
  const r = spawnSync(process.execPath, [join(GOC, "pipeline/import-s09.mjs"), SNAP], {
    encoding: "utf8", env: { ...process.env, DATABASE_URL: `${MAY}/${TEN}` }, timeout: 600_000,
  });
  if (r.status !== 0) throw new Error(`lệnh nạp thoát ${r.status}: ${(r.stderr || "").trim().slice(0, 200)}`);
  const m = r.stdout.match(/S09 nạp: (\d+)\/(\d+) dòng .*bỏ (\d+) thiếu-source-id, (\d+) kind-lạ, (\d+) chi-tiet-lỗi/);
  if (!m) throw new Error(`không đọc được dòng tổng kết: ${r.stdout.trim().slice(0, 200)}`);
  return { ghi: +m[1], tong: +m[2], bo: [+m[3], +m[4], +m[5]] };
}

async function main() {
  const truocMay = await demMayThu();
  execFileSync("bash", [join(GOC, "db/db-thu.sh"), TEN], { stdio: ["ignore", "ignore", "inherit"] });
  const c = new pg.Client({ connectionString: `${MAY}/${TEN}` });
  const loi = [];
  let ma = 0;
  try {
    await c.connect();
    if (!(await c.query("SELECT to_regclass('public.stg_s09_item') AS t")).rows[0].t) {
      execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost",
        "-d", TEN, "-v", "ON_ERROR_STOP=1", "-q"], { input: readFileSync(join(GOC, "db/migrations/097_stg_s09_item.sql")), stdio: ["pipe", "ignore", "inherit"] });
    }
    const coSan = (await c.query("SELECT count(*)::int AS n FROM stg_s09_item WHERE snapshot_id = $1", [SNAP_ID])).rows[0].n;
    if (coSan > 0) {
      console.error(`đã nạp sẵn: bản chép có ${coSan} dòng của snapshot — không phải lệch số`);
      ma = 3;
      process.exitCode = 3;
      return;
    }
    const l1 = napMotLan();
    const l2 = napMotLan();
    console.log(`lần một ${l1.ghi}/${l1.tong} bỏ ${l1.bo.join("/")} · lần hai ${l2.ghi}/${l2.tong}`);
    if (l1.ghi !== 345 || l1.tong !== 345) loi.push(`lần một ${l1.ghi}/${l1.tong}, kỳ vọng 345/345`);
    if (l1.bo.some((x) => x !== 0)) loi.push(`lần một bỏ ${l1.bo.join("/")}, kỳ vọng 0/0/0`);
    if (l2.ghi !== 0 || l2.tong !== 345) loi.push(`lần hai ${l2.ghi}/${l2.tong}, kỳ vọng 0/345`);
    for (const [pid, kv] of Object.entries(DU_AN)) {
      const toa = (await c.query("SELECT count(*)::int AS n FROM v_s09_toa WHERE project_id = $1", [pid])).rows[0].n;
      const pk = (await c.query("SELECT count(*)::int AS n FROM v_s09_phan_khu WHERE project_id = $1", [pid])).rows[0].n;
      console.log(`dự án ${pid.slice(0, 8)}: v_s09_toa ${toa} (kỳ vọng ${kv.toa}) · v_s09_phan_khu ${pk} (kỳ vọng ${kv.phan_khu})`);
      if (toa !== kv.toa) loi.push(`v_s09_toa ${pid.slice(0, 8)} = ${toa}, kỳ vọng ${kv.toa}`);
      if (pk !== kv.phan_khu) loi.push(`v_s09_phan_khu ${pid.slice(0, 8)} = ${pk}, kỳ vọng ${kv.phan_khu}`);
    }
  } finally {
    await c.end().catch(() => {});
    execFileSync("bash", [join(GOC, "db/db-thu.sh"), TEN, "--xoa"], { stdio: ["ignore", "ignore", "inherit"] });
  }
  if (ma) process.exit(ma);
  const sauMay = await demMayThu();
  console.log(`DB máy thu stg_s09_item: trước ${truocMay} · sau ${sauMay}`);
  if (truocMay !== sauMay) loi.push(`DB máy thu đổi: ${truocMay} → ${sauMay}`);
  if (loi.length) {
    for (const l of loi) console.error(`LỆCH ${l}`);
    process.exit(1);
  }
  console.log("E4: mọi ô đạt kỳ vọng");
}

main().catch((e) => {
  console.error(`nap-s09-that: ${e.message}`);
  process.exit(2);
});
