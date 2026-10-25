#!/usr/bin/env node
// Smoke đọc log ở checkout chính khi chạy từ worktree (ON16 `audit-all-doc-log-o-checkout` AC-6, AC-7). Phải chạy TỪ
// một worktree của kho. Hai vế:
//  (1) lệnh thật: `scripts/audit-all.sh` của worktree này và của checkout chính chạy đồng thời, cùng HOME tạm (không
//      token cloud, không CLI OpenClaw, không keychain — an toàn Zalo), so TOÀN BỘ đầu ra. Chiều đỏ: bản sao script
//      main 9e3bb9f đặt ngoài checkout chính → dòng A1 khác.
//  (2) trang thật: app chạy từ worktree (`next dev`, DB local, phiên admin tạm), Chromium 1280×800, `/ops/collections`:
//      «Bộ canh chạy cuối», nhãn lớp 1–4 và «Chạy cuối» của job S02 khớp log ở checkout chính. Chiều đỏ: kỳ vọng tính
//      từ thư mục log của worktree → phép so báo lệch.
// Chạy: node scripts/smoke-doc-log-o-checkout.mjs
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { batApp, batTrinhDuyet, dbUrl, phienAdminTam, timPlaywright } from "./lib/ops-app.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
const SLUG = "audit-all-doc-log-o-checkout";
const RUN = path.join(ROOT, ".acceptance-runs", SLUG);
const MAIN_SHA = "9e3bb9f";
const WATCHDOG_FRESH_MS = 15 * 60_000; // cùng ngưỡng app/src/lib/ops-queries.ts

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

/** Checkout chính của kho theo luật gốc log (git --git-common-dir). */
function checkoutChinh(root) {
  const common = execFileSync("git", ["-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
  return path.basename(common) === ".git" ? path.dirname(common) : root;
}

/** Giờ hiển thị của trang (fmtVnDateTime): múi Asia/Ho_Chi_Minh, `YYYY-MM-DD HH:mm (GMT+7)`, cắt tới phút. */
function fmtVn(d) {
  if (!d || Number.isNaN(d.getTime())) return "—";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} (GMT+7)`;
}

/** Kỳ vọng trang tính từ một thư mục log: hai dòng cuối watchdog, nhãn lớp 1–4, giờ chạy cuối job S02. */
function kyVong(logs, now) {
  let lines = [];
  try {
    lines = readFileSync(path.join(logs, "zalo-watchdog.log"), "utf8").trim().split("\n").slice(-2);
  } catch {
    /* vắng */
  }
  const watch = lines.map((l) => ({ hien: fmtVn(new Date(l.slice(0, 25))), tuoi: l.includes(" ok ") && now - Date.parse(l.slice(0, 25)) <= WATCHDOG_FRESH_MS }));
  const s02 = existsSync(path.join(logs, "airdna-daily.log")) ? fmtVn(statSync(path.join(logs, "airdna-daily.log")).mtime) : "—";
  return { watch: watch.length ? watch : [{ hien: "—", tuoi: false }], s02 };
}

/** Lỗi khi so trang với kỳ vọng. */
function soTrang(m, kv) {
  const out = [];
  const hit = kv.watch.find((w) => m.boCanh === `Bộ canh chạy cuối: ${w.hien}`);
  if (!hit) out.push(`Bộ canh: trang «${m.boCanh}», log muốn một trong ${kv.watch.map((w) => w.hien).join(" / ")}`);
  const muon = hit?.tuoi ? ["Ổn", "Ổn", "Ổn", "Ổn"] : ["Chưa kiểm được", "Chưa kiểm được", "Chưa kiểm được", "Hỏng"];
  if (JSON.stringify(m.lop) !== JSON.stringify(muon)) out.push(`nhãn lớp 1–4: trang ${JSON.stringify(m.lop)}, log muốn ${JSON.stringify(muon)}`);
  if (m.s02 !== kv.s02) out.push(`job S02 Chạy cuối: trang «${m.s02}», log muốn «${kv.s02}»`);
  return out;
}

/** Chạy trong trình duyệt: hai lưới của trang. */
function doTrang() {
  const cot = (grid) => [...grid.querySelectorAll("thead th")].map((th) => th.getAttribute("data-col-id"));
  const lock = document.querySelector("#lockdown");
  const may = document.querySelector("#may-moc");
  const boCanh = lock ? [...lock.querySelectorAll("*")].map((e) => e.textContent?.trim() ?? "").find((t) => /^Bộ canh chạy cuối: /.test(t)) ?? null : null;
  const hang = (grid) => [...(grid?.querySelectorAll("tbody tr") ?? [])].map((tr) => [...tr.children].map((td) => td.textContent?.replace(/\s+/g, " ").trim() ?? ""));
  const lc = lock ? cot(lock) : [];
  const lop = hang(lock).filter((r) => ["L1", "L2", "L3", "L4"].includes(r[lc.indexOf("layer")])).map((r) => r[lc.indexOf("state")]);
  const mc = may ? cot(may) : [];
  const s02 = hang(may).find((r) => /^S02\b/.test(r[mc.indexOf("label")] ?? ""));
  return { boCanh, lop, s02: s02 ? s02[mc.indexOf("last")] : null };
}

/** Chạy một bản audit-all, trả đầu ra. */
function chayAudit(script, home) {
  return new Promise((done) => {
    const p = spawn("/bin/bash", [script], { env: { ...process.env, HOME: home }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", (code) => done({ code, out }));
  });
}

const MAIN = checkoutChinh(ROOT);
mkdirSync(RUN, { recursive: true });
const home = mkdtempSync(path.join(tmpdir(), "on16-home-"));
let db, phien, app, browser;
try {
  // ---------- (1) lệnh thật ----------
  check(MAIN !== ROOT, MAIN !== ROOT ? `chạy từ worktree ${ROOT} · checkout chính ${MAIN}` : `phải chạy từ một worktree — đang ở checkout chính ${ROOT}`);
  const rieng = path.join(ROOT, "pipeline/logs/airdna-daily.log");
  check(!existsSync(rieng), !existsSync(rieng) ? "worktree không có airdna-daily.log riêng" : `worktree có ${rieng} — phép so mất sức phân biệt`);
  const red = path.join(RUN, "red/scripts/audit-all.sh");
  mkdirSync(path.dirname(red), { recursive: true });
  writeFileSync(red, execFileSync("git", ["-C", ROOT, "show", `${MAIN_SHA}:scripts/audit-all.sh`], { encoding: "utf8" }));
  const [wt, chinh, cu] = await Promise.all([
    chayAudit(path.join(ROOT, "scripts/audit-all.sh"), home),
    chayAudit(path.join(MAIN, "scripts/audit-all.sh"), home),
    chayAudit(red, home),
  ]);
  writeFileSync(path.join(RUN, "audit-worktree.txt"), wt.out);
  writeFileSync(path.join(RUN, "audit-checkout-chinh.txt"), chinh.out);
  const a = wt.out.split("\n");
  const b = chinh.out.split("\n");
  const khac = a.map((l, i) => [i + 1, l, b[i]]).filter(([, x, y]) => x !== y);
  for (const [i, x, y] of khac) console.log(`     dòng ${i}: worktree «${x?.trim()}» · checkout chính «${y?.trim()}»`);
  const a1 = (out) => out.split("\n").find((l) => /AirDNA nightly log/.test(l))?.trim() ?? "(không có dòng A1)";
  console.log(`     A1 worktree: ${a1(wt.out)}\n     A1 checkout chính: ${a1(chinh.out)}`);
  check(
    khac.length === 0 && a.length === b.length && /TỔNG KẾT/.test(wt.out),
    khac.length === 0 && a.length === b.length ? `audit-all worktree và checkout chính trùng toàn bộ đầu ra (${a.length} dòng)` : `audit-all worktree khác checkout chính ${khac.length} dòng`,
  );
  const cb = cu.out.split("\n");
  const lech = b.filter((l, i) => l !== cb[i]).filter((l) => /AirDNA nightly log/.test(l));
  console.log(`     A1 bản main ngoài checkout chính: ${a1(cu.out)}`);
  check(lech.length > 0, lech.length > 0 ? "chiều đỏ: script main ngoài checkout chính → báo lệch ở A1" : "chiều đỏ: script main ngoài checkout chính KHÔNG lệch ở A1");

  // ---------- (2) trang thật ----------
  const tim = timPlaywright(ROOT);
  if (!tim) throw new Error("không tìm thấy playwright-core");
  db = new pg.Client({ connectionString: dbUrl() });
  await db.connect();
  phien = await phienAdminTam(db, "on16");
  app = await batApp(ROOT);
  browser = await batTrinhDuyet(tim.pw.chromium);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "oi_session", value: phien.token, url: app.base }]);
  const p = await ctx.newPage();
  const kvTruoc = kyVong(path.join(MAIN, "pipeline/logs"), Date.now());
  await p.goto(`${app.base}/ops/collections`, { waitUntil: "networkidle", timeout: 180_000 });
  const m = await p.evaluate(doTrang);
  const kvSau = kyVong(path.join(MAIN, "pipeline/logs"), Date.now());
  // bộ canh chạy 5′ một lần: chấp nhận hai dòng cuối đọc trước và sau lượt dựng trang
  const kv = { ...kvSau, watch: [...kvSau.watch, ...kvTruoc.watch] };
  console.log(`     trang: ${JSON.stringify(m)}\n     log ở checkout chính: ${JSON.stringify(kv)}`);
  const loi = soTrang(m, kv);
  check(!loi.some((x) => x.startsWith("Bộ canh")), loi.find((x) => x.startsWith("Bộ canh")) ?? "Bộ canh chạy cuối khớp log watchdog ở checkout chính");
  check(!loi.some((x) => x.startsWith("nhãn lớp")), loi.find((x) => x.startsWith("nhãn lớp")) ?? `nhãn lớp 1–4 khớp trạng thái suy từ log watchdog (${m.lop.join(", ")})`);
  check(!loi.some((x) => x.startsWith("job S02")), loi.find((x) => x.startsWith("job S02")) ?? `job S02 Chạy cuối khớp mtime airdna-daily.log ở checkout chính («${m.s02}»)`);
  await p.screenshot({ path: path.join(RUN, "thu-thap-1280.png"), fullPage: true });
  for (const [sel, ten] of [["#lockdown", "khoa-an-toan"], ["#may-moc", "may-moc"]]) await p.locator(sel).first().screenshot({ path: path.join(RUN, `${ten}-1280.png`) });
  console.log(`ảnh chụp: .acceptance-runs/${SLUG}/{thu-thap,khoa-an-toan,may-moc}-1280.png`);
  // chiều đỏ: kỳ vọng tính từ thư mục log của worktree (cách suy cũ) → phép so phải báo lệch
  const loiDo = soTrang(m, kyVong(path.join(ROOT, "pipeline/logs"), Date.now()));
  check(loiDo.length > 0, loiDo.length > 0 ? `chiều đỏ: kỳ vọng từ log worktree → báo lệch («${loiDo[0]}»)` : "chiều đỏ: kỳ vọng từ log worktree KHÔNG bị báo");
  await ctx.close();
} catch (e) {
  check(false, `smoke dừng giữa chừng: ${e.message}`);
} finally {
  await browser?.close().catch(() => {});
  await app?.tat();
  const con = phien ? await phien.xoa() : 0;
  await db?.end().catch(() => {});
  rmSync(home, { recursive: true, force: true });
  check(con === 0, `dọn: ${con} phiên tạm còn lại`);
}

console.log(fails.length === 0 ? `\nsmoke-doc-log-o-checkout: PASS` : `\nsmoke-doc-log-o-checkout: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
