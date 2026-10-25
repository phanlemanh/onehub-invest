#!/usr/bin/env node
// Smoke trang Thu thập ở máy thu không có số S02 (ON6 `collections-khong-so-s02` AC-7, luật 5): app chạy thật từ worktree
// (`next dev`, DB local), phiên admin tạm tạo/xoá cùng lượt, Chromium 1280×800. Đo DOM: bảng luồng không cột S02, tab
// Listing của biểu đồ chỉ một chuỗi cột, panel vòng thu S02 không huy hiệu tên thị trường, hàng S02 của lưới nguồn hiện
// «Xem Chất lượng». Ảnh chụp vào .acceptance-runs/collections-khong-so-s02/. Chạy: node scripts/smoke-collections-khong-so-s02.mjs
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { batApp, batTrinhDuyet, dbUrl, phienAdminTam, timPlaywright } from "./lib/ops-app.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
const ANH = path.join(ROOT, ".acceptance-runs/collections-khong-so-s02");

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

/** Chạy trong trình duyệt: bốn vùng của trang. */
function doTrang() {
  const bang = [...document.querySelectorAll('table[data-slot="data-grid-table"]')];
  const luong = bang.find((t) => t.querySelector('thead th[data-col-id="zaloOffers"]'));
  const nguon = bang.find((t) => t.querySelector('thead th[data-col-id="offers"]'));
  // ô «Nguồn» = <span font-mono>S02</span><span>vai trò</span> — đọc đúng phần mã
  const hangS02 = nguon ? [...nguon.querySelectorAll("tbody tr")].find((tr) => tr.children[0]?.querySelector(".font-mono")?.textContent?.trim() === "S02") : null;
  const frames = [...document.querySelectorAll('[data-slot="frame"]')];
  const vong = frames.find((f) => /Vòng thu S02/.test(f.querySelector('[role="heading"], h2, h3')?.textContent ?? f.textContent.slice(0, 80)));
  const bieuDo = document.querySelector("#luong");
  return {
    cotLuong: luong ? [...luong.querySelectorAll("thead th")].map((th) => th.getAttribute("data-col-id")) : null,
    chuoi: bieuDo ? bieuDo.querySelectorAll(".recharts-bar").length : -1,
    tab: bieuDo?.querySelector('[aria-pressed="true"], [data-pressed]')?.textContent?.trim() ?? null,
    vong: vong ? { huyHieu: vong.querySelectorAll('[data-slot="badge"]').length, chu: vong.textContent.replace(/\s+/g, " ").trim().slice(0, 200) } : null,
    s02: hangS02
      ? { xem: [...hangS02.querySelectorAll('a[href="/ops/quality"]')].filter((a) => a.textContent.trim() === "Xem Chất lượng").length, chu: hangS02.textContent.replace(/\s+/g, " ").trim() }
      : null,
  };
}

/** Lỗi theo bốn vế của AC-7. */
function loi(m) {
  const out = [];
  if (!m.cotLuong) out.push("bảng luồng vắng");
  else if (m.cotLuong.some((c) => /airdna/i.test(c))) out.push(`bảng luồng còn cột S02: ${m.cotLuong.join(",")}`);
  if (m.chuoi !== 1) out.push(`tab Listing có ${m.chuoi} chuỗi cột`);
  if (!m.vong) out.push("panel vòng thu S02 vắng");
  else if (m.vong.huyHieu > 0) out.push(`Rotation còn ${m.vong.huyHieu} huy hiệu tên thị trường`);
  if (!m.s02) out.push("hàng S02 lưới nguồn vắng");
  else if (m.s02.xem !== 3) out.push(`hàng S02: ${m.s02.xem}/3 ô «Xem Chất lượng» — «${m.s02.chu}»`);
  return out;
}

const tim = timPlaywright(ROOT);
if (!tim) {
  console.log("FAIL không tìm thấy playwright-core (app/, collector/ của cây, collector/ của checkout chính)");
  process.exit(1);
}
mkdirSync(ANH, { recursive: true });

let db, phien, app, browser;
try {
  db = new pg.Client({ connectionString: dbUrl() });
  await db.connect();
  phien = await phienAdminTam(db, "on6");
  app = await batApp(ROOT);
  browser = await batTrinhDuyet(tim.pw.chromium);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "oi_session", value: phien.token, url: app.base }]);
  const p = await ctx.newPage();
  await p.goto(`${app.base}/ops/collections`, { waitUntil: "networkidle", timeout: 180_000 });
  const m = await p.evaluate(doTrang);
  const l = loi(m);
  const co = (s) => !l.some((x) => x.startsWith(s));
  check(co("bảng luồng"), co("bảng luồng") ? `bảng luồng không cột S02 (${m.cotLuong.join(", ")})` : l.filter((x) => x.startsWith("bảng luồng")).join(" | "));
  check(co("tab Listing"), co("tab Listing") ? `tab Listing một mục chú giải (1 chuỗi cột, tab «${m.tab}»)` : l.filter((x) => x.startsWith("tab Listing")).join(" | "));
  check(co("Rotation") && co("panel vòng thu"), co("Rotation") && co("panel vòng thu") ? `Rotation không huy hiệu tên («${m.vong.chu}»)` : l.filter((x) => /Rotation|panel vòng thu/.test(x)).join(" | "));
  check(co("hàng S02"), co("hàng S02") ? `hàng S02 lưới nguồn theo Hỏi-1 (3 ô «Xem Chất lượng»)` : l.filter((x) => x.startsWith("hàng S02")).join(" | "));
  await p.screenshot({ path: path.join(ANH, "thu-thap-1280.png"), fullPage: true });
  for (const [sel, ten] of [["#luong", "bieu-do"], ["#nguon", "luoi-nguon"]]) await p.locator(sel).first().screenshot({ path: path.join(ANH, `${ten}-1280.png`) }).catch(() => {});
  await p.locator('[data-slot="frame"]', { hasText: "Vòng thu S02" }).last().screenshot({ path: path.join(ANH, "vong-thu-1280.png") }).catch(() => {});
  console.log("ảnh chụp: .acceptance-runs/collections-khong-so-s02/{thu-thap,bieu-do,luoi-nguon,vong-thu}-1280.png");

  // chiều đỏ: chèn lại một huy hiệu tên thị trường vào panel vòng thu
  await p.evaluate(() => {
    const f = [...document.querySelectorAll('[data-slot="frame"]')].find((x) => /Vòng thu S02/.test(x.textContent.slice(0, 80)));
    const b = document.createElement("span");
    b.setAttribute("data-slot", "badge");
    b.textContent = "Thị trường thử";
    f?.appendChild(b);
  });
  const ld = loi(await p.evaluate(doTrang)).filter((x) => x.startsWith("Rotation"));
  check(ld.length > 0, ld.length > 0 ? `chiều đỏ: chèn huy hiệu tên vào Rotation → báo «${ld[0]}»` : "chiều đỏ: huy hiệu chèn vào Rotation KHÔNG bị báo");
  await ctx.close();
} catch (e) {
  check(false, `smoke dừng giữa chừng: ${e.message}`);
} finally {
  await browser?.close().catch(() => {});
  await app?.tat();
  const con = phien ? await phien.xoa() : 0;
  await db?.end().catch(() => {});
  check(con === 0, `dọn: ${con} phiên tạm còn lại`);
}

console.log(fails.length === 0 ? "\nsmoke-collections-khong-so-s02: PASS" : `\nsmoke-collections-khong-so-s02: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
