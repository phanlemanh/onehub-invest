#!/usr/bin/env node
// dbv-itest-xanh-lai-tren-main AC-4: hai đối chứng đỏ của tệp kiểm.
//   (a) bản merge-base (fixture vùng cũ) chạy ca DBV-AC-3 → đỏ và đầu ra có «nhieu-tinh»;
//   (b) bản mới chạy ca DBV-AC-1 với DBV_MIG_THAY = bản chép 082 không lũy đẳng (mỗi lần áp tạo một bảng tên ngẫu nhiên)
//       → đỏ với đúng thông điệp ghim.
// Đếm DB oneinvest_dbv_% trên :5433 trước và sau (pg_database). DB mới mà tiến trình chủ (pid trong tên) đã chết là sót của
// probe → FAIL. DB của tiến trình còn sống (lượt chấm chạy song song, phiên khác) KHÔNG phải của probe: không tính, không xoá
// — r1 xoá nhầm DB của itest đang chạy song song và cắt kết nối của nó.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TEP = "pipeline/scripts/danh-ba-vat-the.itest.mjs";
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const MAY_CHU = process.env.DBV_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const CU = path.join(ROOT, "pipeline/scripts", `.dbv-cu-${process.pid}.itest.mjs`);
const TAM = mkdtempSync(path.join(tmpdir(), "dbvx-"));
const don = () => { rmSync(CU, { force: true }); rmSync(TAM, { recursive: true, force: true }); };
process.on("exit", don);

async function dsDb() {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  try { return new Set((await c.query("SELECT datname FROM pg_database WHERE datname LIKE 'oneinvest_dbv_%'")).rows.map((r) => r.datname)); }
  finally { await c.end(); }
}
function chay(tep, mau, env = {}) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", `--test-name-pattern=${mau}`, tep], {
    cwd: ROOT, encoding: "utf8", env: { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT")), ...env },
  });
  return { ma: r.status, out: `${r.stdout}${r.stderr}`, giay: ((Date.now() - t0) / 1000).toFixed(1) };
}

let sai = 0;
const truoc = await dsDb();
console.log(`HEAD ${execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim()}`);
const goc = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT, encoding: "utf8" }).trim();

// (a) fixture cũ trái luật một tỉnh.
writeFileSync(CU, execFileSync("git", ["show", `${goc}:${TEP}`], { cwd: ROOT, encoding: "utf8" }));
const a = chay(CU, "DBV-AC-3");
const okA = a.ma !== 0 && /nhieu-tinh/.test(a.out);
console.log(okA ? `DOI CHUNG A DO (nhieu-tinh) — mã ${a.ma}, ${a.giay}s` : `DOI CHUNG A KHONG DO DUNG — mã ${a.ma}, có nhieu-tinh: ${/nhieu-tinh/.test(a.out)}`);
if (!okA) sai++;

// (b) 082 không lũy đẳng → phép đo lũy đẳng trên DB dừng ở 082 phải đỏ đúng thông điệp.
const g082 = path.join(TAM, "082_danh_ba_vat_the.sql");
writeFileSync(g082, `${readFileSync(path.join(ROOT, "db/migrations/082_danh_ba_vat_the.sql"), "utf8")}
-- dbvx đối chứng: mỗi lần áp tạo một bảng tên ngẫu nhiên → không lũy đẳng
DO $$ BEGIN EXECUTE format('CREATE TABLE dbvx_doi_chung_%s (x int)', floor(random() * 1e9)::bigint); END $$;
`);
const b = chay(path.join(ROOT, TEP), "DBV-AC-1", { DBV_MIG_THAY: g082 });
const okB = b.ma !== 0 && b.out.includes("DBV-AC-1 áp 082 lần hai đổi lược đồ");
console.log(okB ? `DOI CHUNG B DO (thong diep ghim) — mã ${b.ma}, ${b.giay}s` : `DOI CHUNG B KHONG DO DUNG — mã ${b.ma}`);
if (!okB) { sai++; console.log(b.out.split("\n").filter((l) => /✖|Error/.test(l)).slice(0, 6).join("\n")); }

// Dọn DB: mọi DB thử tệp tạo phải đã bị xoá ở after.
const sau = await dsDb();
/** pid chủ của DB thử oneinvest_dbv_<pid>[_hậu tố]; tiến trình còn sống → không phải sót của probe. */
const conSong = (ten) => {
  const pid = Number(/^oneinvest_dbv_(\d+)/.exec(ten)?.[1]);
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; }
};
// Hai chiều của luật «còn sống»: DB mang pid của chính probe → còn sống; DB mang pid một tiến trình đã thoát → sót.
const chet = spawnSync(process.execPath, ["-e", "0"]).pid;
const okSong = conSong(`oneinvest_dbv_${process.pid}`) && !conSong(`oneinvest_dbv_${chet}_082`);
console.log(okSong ? "LUAT CON SONG HAI CHIEU OK" : "LUAT CON SONG SAI — không phân biệt được tiến trình sống và đã thoát");
if (!okSong) sai++;
const moi = [...sau].filter((d) => !truoc.has(d));
const sot = moi.filter((d) => !conSong(d));
const cuaKhac = moi.filter(conSong);
console.log(`DB THU TRUOC ${truoc.size} SAU ${sau.size} · mới của tiến trình còn sống (không tính): ${cuaKhac.length}${sot.length ? ` — sót: ${sot.join(", ")}` : ""}`);
if (sot.length) {
  sai++;
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  for (const d of sot) await c.query(`DROP DATABASE IF EXISTS ${d} WITH (FORCE)`);
  await c.end();
}
console.log(sai ? `DBVX-DOI-CHUNG FAIL (${sai})` : "DBVX-DOI-CHUNG PASS");
process.exitCode = sai ? 1 : 0;
