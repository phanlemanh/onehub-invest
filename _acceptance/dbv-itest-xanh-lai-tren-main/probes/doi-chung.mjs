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
/**
 * Chủ của DB thử: pid là nhóm số đầu tiên sau «oneinvest_dbv_», cho phép tiền tố chữ (oneinvest_dbv_that_<pid>, tệp anh em).
 * Chỉ DB tách được pid MÀ tiến trình đó đã thoát mới là «sót» của probe; tách không được pid, hoặc tiến trình còn sống →
 * của người khác: không tính, không xoá (r1, r2 xoá nhầm DB của lượt chạy song song).
 */
export const pidChu = (ten) => { const m = /^oneinvest_dbv_(?:[a-z]+_)*(\d+)(?:_|$)/.exec(ten); return m ? Number(m[1]) : null; };
const song = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
const laSot = (ten) => { const pid = pidChu(ten); return pid !== null && !song(pid); };
// Hai chiều của luật «còn sống»: DB mang pid của chính probe → còn sống; DB mang pid một tiến trình đã thoát → sót.
const chet = spawnSync(process.execPath, ["-e", "0"]).pid;
// Ma trận viết trước: [tên, là sót?]. Mỗi dạng tên của họ oneinvest_dbv_% đã gặp, cả chiều sống lẫn chiều đã thoát.
const MA_TRAN_SOT = [
  [`oneinvest_dbv_${process.pid}`, false], [`oneinvest_dbv_${process.pid}_082`, false], [`oneinvest_dbv_that_${process.pid}`, false],
  [`oneinvest_dbv_${chet}`, true], [`oneinvest_dbv_${chet}_truoc`, true], [`oneinvest_dbv_that_${chet}`, true],
  ["oneinvest_dbv_khong_so", false], ["oneinvest_dbv_", false],
];
const lech = MA_TRAN_SOT.filter(([t, k]) => laSot(t) !== k).map(([t, k]) => `${t} (kỳ vọng ${k ? "sót" : "không sót"})`);
const okSong = lech.length === 0;
console.log(okSong ? `LUAT CON SONG HAI CHIEU OK (${MA_TRAN_SOT.length} dạng tên)` : `LUAT CON SONG SAI — ${lech.join(" · ")}`);
if (!okSong) sai++;
const moi = [...sau].filter((d) => !truoc.has(d));
const sot = moi.filter(laSot);
const cuaKhac = moi.filter((d) => !laSot(d));
console.log(`DB THU TRUOC ${truoc.size} SAU ${sau.size} · mới không phải của probe (không tính): ${cuaKhac.length}${sot.length ? ` — sót: ${sot.join(", ")}` : ""}`);
if (sot.length) {
  sai++;
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  for (const d of sot) await c.query(`DROP DATABASE IF EXISTS ${d} WITH (FORCE)`);
  await c.end();
}
console.log(sai ? `DBVX-DOI-CHUNG FAIL (${sai})` : "DBVX-DOI-CHUNG PASS");
process.exitCode = sai ? 1 : 0;
