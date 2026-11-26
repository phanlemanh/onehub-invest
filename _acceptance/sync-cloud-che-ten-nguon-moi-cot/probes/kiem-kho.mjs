#!/usr/bin/env node
// Thước E5 (HT26 AC-5) — chạy từ gốc kho, trên máy thu thật, ngoài CI. Mọi quan hệ AC-5 thành mã thoát (vòng 2, GS 26/11):
//   1. lượt khô mã mới `sync-cloud.mjs --kho` với mọi biến đường cloud trỏ cổng chết 127.0.0.1:1, lsof soát socket mỗi 0,3 s;
//   2. mã cũ ở merge-base(origin/main, HEAD) từ worktree tạm tách rời, cloud giả trả catalog của máy thu, đo pha đọc + soát;
//   3. `do-ten-nguon-cloud.mjs --chi-may-thu` cùng môi trường: số ô theo bảng.cột phải bằng số che của lượt khô;
//   4. chiều đỏ đường cloud: cùng lệnh sync KHÔNG `--kho` với cùng môi trường → phải SYNC FAIL [catalog], không qua pha nạp;
//   5. chiều đỏ ô bẩn: lượt khô thật trên hai bảng mang tên nguồn khi bỏ bước che → phải thoát khác 0;
//   6. phán bằng `pipeline/lib/sync-cloud-kho-xet.mjs`; rồi đột biến lượt vừa đo (ô bẩn, che lệch, vượt trần, socket ngoài…) phải đỏ.
// Thứ tự: mã mới trước, mã cũ sau (bộ đệm DB ấm có lợi cho mã cũ — nghiêng về phía chặt). Chỉ in số, tên bảng.cột, không giá trị.
// Mã thoát: 0 xanh · 1 một điều kiện AC-5 đỏ · 2 không chạy được (không phải máy thu, thiếu tệp) · 3 thước không phân biệt.
import { execFile, execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const req = createRequire(path.join(ROOT, "pipeline/package.json"));
const { vaiMay } = await import(pathToFileURL(path.join(ROOT, "scripts/lib/vai-may.mjs")).href);
const xet = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/sync-cloud-kho-xet.mjs")).href);

if (vaiMay() !== "may-thu") {
  console.error("kiem-kho: chỉ chạy trên máy thu (vai máy khác may-thu) — E5 ngoài CI");
  process.exit(2);
}

// Môi trường cổng chết: HOME tạm (không đọc tệp khoá thật), mọi biến cloud và proxy trỏ 127.0.0.1:1, fetch đi qua proxy env.
const CHET = "http://127.0.0.1:1";
const homeTam = mkdtempSync(path.join(tmpdir(), "kiem-kho-home-"));
mkdirSync(path.join(homeTam, ".oneinvest"));
writeFileSync(path.join(homeTam, ".oneinvest/cloud.env"), "SUPABASE_MGMT_TOKEN=cong-chet\n");
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/SUPABASE|SERVICE_ROLE|_PROXY$|_proxy$|^NO_PROXY$|^no_proxy$/.test(k)));
Object.assign(env, {
  HOME: homeTam,
  SUPABASE_MGMT_TOKEN: "cong-chet",
  SUPABASE_URL: CHET,
  NEXT_PUBLIC_SUPABASE_URL: CHET,
  SUPABASE_DB_URL: "postgres://x:x@127.0.0.1:1/x",
  HTTPS_PROXY: CHET, HTTP_PROXY: CHET, https_proxy: CHET, http_proxy: CHET, ALL_PROXY: CHET, all_proxy: CHET,
  NODE_USE_ENV_PROXY: "1",
});

/** Chạy một lệnh, soát socket của tiến trình bằng lsof mỗi 0,3 s; trả { exit, text, sockets[] , giay }. */
function chay(cmd, args, { tranGiay = 3600, cwd = ROOT } = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const p = spawn(cmd, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let text = "";
    p.stdout.on("data", (d) => (text += d));
    p.stderr.on("data", (d) => (text += d));
    const sockets = new Set();
    const soi = setInterval(() => {
      execFile("lsof", ["-nP", "-a", "-p", String(p.pid), "-i", "-F", "n"], (_e, out) => {
        for (const l of String(out ?? "").split("\n")) if (l.startsWith("n")) sockets.add(l.slice(1));
      });
    }, 300);
    const het = setTimeout(() => p.kill("SIGKILL"), tranGiay * 1000);
    p.on("close", (code, sig) => {
      clearInterval(soi);
      clearTimeout(het);
      resolve({ exit: code ?? (sig ? 128 : 1), text, sockets: [...sockets], giay: (Date.now() - t0) / 1000 });
    });
  });
}
const gio = () => new Date().toISOString().slice(11, 19) + "Z";
const inSocket = (r) => (r.sockets.length ? r.sockets.join(", ") : "(không thấy)");

// Mã cũ: harness ghi vào worktree tạm, nạp sync-cloud.mjs của merge-base; exec giả trả catalog từ máy thu, cổng anon/PII rỗng; dừng ở
// câu nạp đầu (hoặc ở pha scan khi bộ chặn cũ gặp tên nguồn — lúc ấy pha đo được là cận dưới của mã cũ).
const HARNESS = `
import pg from "pg";
const m = await import("./sync-cloud.mjs");
const local = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", types: m.localTypes, options: "-c default_transaction_read_only=on" });
await local.connect();
let tBat = null, tXongDoc = null, tDung = null, dung = "?";
const q0 = local.query.bind(local);
local.query = (...a) => { const s = typeof a[0] === "string" ? a[0] : a[0]?.text ?? ""; if (tBat === null && s.startsWith("BEGIN ISOLATION")) tBat = Date.now(); if (tBat !== null && tXongDoc === null && s === "COMMIT") tXongDoc = Date.now(); return q0(...a); };
const names = m.FILL.map(m.RENAME);
const DUNG = new Error("dung-o-cau-nap");
const exec = async (sql) => {
  if (sql.includes("to_regclass('sync_stage.rows')")) return [{ r: "sync_stage.rows", s: "sync_stage.swaps" }];
  if (sql.trimStart().startsWith("WITH rel AS")) return [];
  if (sql.includes("relkind::text AS kind")) return names.map((t) => ({ t, kind: "r" }));
  if (sql.includes("is_generated")) {
    const { rows } = await q0("SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name, ordinal_position", [m.FILL]);
    return rows.map((r) => ({ t: m.RENAME(r.t), c: r.c, gen: false }));
  }
  if (sql.includes("FROM pg_roles")) return [{ n: 1 }];
  if (sql.includes("INSERT INTO sync_stage")) { tDung = Date.now(); dung = "stage"; throw DUNG; }
  return [];
};
try { await m.syncOnce({ local, exec, log: () => {} }); dung = "het"; }
catch (e) { if (e !== DUNG && !(e.message ?? "").includes("dung-o-cau-nap")) { tDung = Date.now(); dung = e.phase ?? "?"; } }
await local.end();
if (tBat === null || tDung === null) { console.log("cu: không đo được (" + dung + ")"); process.exit(1); }
console.log("cu: doc " + ((tXongDoc - tBat) / 1000).toFixed(1) + "s; pha " + ((tDung - tBat) / 1000).toFixed(1) + "s; dung " + dung);
`;

/** Worktree tạm của lượt trước bị ngắt giữa chừng (kiem-kho-cu-*) — gỡ trước khi dựng cái mới. */
function donWorktreeCu() {
  const ds = execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
  for (const [, p] of ds.matchAll(/^worktree (.*kiem-kho-cu-[^/\n]*)$/gm)) {
    execFileSync("git", ["worktree", "remove", "--force", p], { cwd: ROOT, stdio: "ignore" });
  }
  execFileSync("git", ["worktree", "prune"], { cwd: ROOT, stdio: "ignore" });
}

async function chayMaCu() {
  donWorktreeCu();
  const mb = execFileSync("git", ["merge-base", "origin/main", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const wt = mkdtempSync(path.join(tmpdir(), "kiem-kho-cu-"));
  rmSync(wt, { recursive: true });
  execFileSync("git", ["worktree", "add", "--detach", wt, mb], { cwd: ROOT, stdio: "ignore" });
  const ngat = () => {
    try { execFileSync("git", ["worktree", "remove", "--force", wt], { cwd: ROOT, stdio: "ignore" }); } catch {}
    process.exit(130);
  };
  process.once("SIGINT", ngat);
  process.once("SIGTERM", ngat);
  try {
    symlinkSync(realpathSync(path.join(ROOT, "pipeline/node_modules")), path.join(wt, "pipeline/node_modules"));
    // Harness đặt trong pipeline/ của worktree tạm: «pg» giải từ pipeline/node_modules (symlink).
    writeFileSync(path.join(wt, "pipeline/kiem-kho-cu.mjs"), HARNESS);
    const r = await chay("nice", ["-n", "10", "node", "kiem-kho-cu.mjs"], { cwd: path.join(wt, "pipeline") });
    const m = r.text.match(/^cu: doc ([\d.]+)s; pha ([\d.]+)s; dung (\S+)$/m);
    const dung = m?.[3] ?? "?";
    // Chỉ dừng ở câu nạp, ở bộ chặn (cận dưới) hay chạy hết mới là pha đọc + soát; dừng ở pha khác = không đo được.
    const doDuoc = m && ["stage", "scan", "het"].includes(dung);
    return { ...r, mb, pha: doDuoc ? Number(m[2]) : NaN, doc: m ? Number(m[1]) : NaN, dung };
  } finally {
    execFileSync("git", ["worktree", "remove", "--force", wt], { cwd: ROOT, stdio: "ignore" });
  }
}

// Chiều đỏ ô bẩn trên đường thật: runKho của mã mới, hai bảng có tên nguồn, bỏ bước che — trong tiến trình này (không exec cloud).
async function cayOBan() {
  const pg = req("pg");
  const m = await import(pathToFileURL(path.join(ROOT, "pipeline/sync-cloud.mjs")).href);
  const local = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", types: m.localTypes, options: "-c default_transaction_read_only=on" });
  await local.connect();
  let text = "";
  const ghi = (s) => (text += s + "\n");
  try {
    const exit = await m.runKho({ local, out: ghi, err: ghi, fill: ["areas", "area_sources"], che: false });
    return { exit, text };
  } finally {
    await local.end();
  }
}

try {
  console.log(`kiem-kho ${gio()}: 1/5 lượt khô mã mới (--kho, cổng chết, lsof)`);
  const kho = await chay("nice", ["-n", "10", "node", "pipeline/sync-cloud.mjs", "--kho"]);
  const k = xet.docKho(kho.text);
  console.log(`  mã thoát ${kho.exit}; ${kho.giay.toFixed(1)}s; socket: ${inSocket(kho)}`);
  for (const [c, n] of k.che) console.log(`  che ${c}: ${n}`);
  console.log(`  đếm thô sau che: ${k.tho}; thời gian: ${JSON.stringify(k.pha)}`);

  console.log(`kiem-kho ${gio()}: 2/5 mã cũ ở merge-base (worktree tạm, cloud giả)`);
  const cu = await chayMaCu();
  console.log(`  merge-base ${cu.mb.slice(0, 9)}; mã thoát ${cu.exit}; ${cu.text.trim().split("\n").filter((l) => l.startsWith("cu:")).join(" ") || "(không in)"}; socket: ${inSocket(cu)}`);
  if (cu.dung === "scan") console.log("  (mã cũ dừng ở bộ chặn khi gặp tên nguồn → pha mã cũ là cận dưới; so sánh nghiêng về phía chặt)");

  console.log(`kiem-kho ${gio()}: 3/5 do-ten-nguon-cloud --chi-may-thu`);
  const chiMayThu = await chay("node", ["scripts/do-ten-nguon-cloud.mjs", "--chi-may-thu"]);
  const c = xet.docChiMayThu(chiMayThu.text);
  console.log(`  mã thoát ${chiMayThu.exit}; tổng ${JSON.stringify(c.tong)}; socket: ${inSocket(chiMayThu)}`);

  console.log(`kiem-kho ${gio()}: 4/5 chiều đỏ đường cloud — cùng lệnh KHÔNG --kho, cùng cổng chết`);
  const khongKho = await chay("node", ["pipeline/sync-cloud.mjs"], { tranGiay: 300 });
  console.log(`  mã thoát ${khongKho.exit}; ${khongKho.text.split("\n").filter((l) => /SYNC FAIL|sync xong/.test(l)).map((l) => l.replace(/: .*/, "")).join(" ") || "(không có dòng kết thúc)"}; socket: ${inSocket(khongKho)}`);

  console.log(`kiem-kho ${gio()}: 5/5 chiều đỏ ô bẩn — lượt khô thật trên areas, area_sources, bỏ che`);
  const cayDo = await cayOBan();
  console.log(`  mã thoát ${cayDo.exit}; ${cayDo.text.split("\n").filter((l) => l.startsWith("KHO FAIL")).map((l) => l.replace(/\]: .*/, "]")).join(" ") || "(không có KHO FAIL)"}`);

  const vao = { kho, chiMayThu, khongKho, cu: { pha: cu.pha, dung: cu.dung }, cayDo };
  const p = k.pha ?? {};
  const moi = (p.read ?? 0) + (p.che ?? 0) + (p.scan ?? 0);
  console.log(`pha đọc+che+soát mã mới ${moi.toFixed(1)}s · mã cũ ${Number.isFinite(cu.pha) ? cu.pha.toFixed(1) : "?"}s · tỉ số ${(moi / cu.pha).toFixed(2)} (trần ${xet.TRAN_TI_SO}) · thêm ${(moi - cu.pha).toFixed(1)}s (trần ${xet.TRAN_THEM_GIAY}s)`);

  const ly = xet.phanXet(vao);
  const khongDo = ly.length ? [] : xet.dotBienKhongDo(vao);
  for (const l of ly) console.log(`ĐỎ: ${l}`);
  if (ly.length) {
    console.log(`kiem-kho: ĐỎ — ${ly.length} điều kiện AC-5 không đạt`);
    process.exitCode = 1;
  } else if (khongDo.length) {
    console.log(`kiem-kho: THƯỚC KHÔNG PHÂN BIỆT — đột biến không làm đỏ: ${khongDo.join("; ")}`);
    process.exitCode = 3;
  } else {
    console.log("kiem-kho: XANH — mọi điều kiện AC-5 đạt; 8 đột biến của lượt vừa đo đều đỏ");
  }
} catch (e) {
  console.error(`kiem-kho: không chạy được — ${e.message}`);
  process.exitCode = 2;
} finally {
  rmSync(homeTam, { recursive: true, force: true });
}
