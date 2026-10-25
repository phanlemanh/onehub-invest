#!/usr/bin/env node
// Smoke «Luồng 7 ngày qua» trên trang Thu thập ở CHẾ ĐỘ MÁY CHỦ (ON5 `luong-7-ngay-dung-so` AC-9; Hỏi-2 theo khuyến nghị).
// App chạy thật từ worktree (`next dev`, VERCEL=1) với DATABASE_URL trỏ một lược đồ tạm: view tới mọi bảng public TRỪ bảng
// chỉ có ở máy thu (source_registry vắng → trang tự nhận là máy chủ), cộng bảng ops_heartbeat RIÊNG — dòng
// public.ops_heartbeat thật không bị đụng (băm trước = sau). Bản tin do bên ghi THẬT dựng trên DB local (chỉ đọc, không
// gửi). Ba trạng thái tươi · cũ · thiếu khối × Chromium 1280 và 390; ảnh vào .acceptance-runs/luong-7-ngay-dung-so/.
// Chạy: node scripts/smoke-luong-7-ngay.mjs
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { captureOpsFacts } from "../pipeline/scripts/capture-ops-facts.mjs";
import { batApp, batTrinhDuyet, dbUrl, phienAdminTam, timPlaywright } from "./lib/ops-app.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
const ANH = path.join(ROOT, ".acceptance-runs/luong-7-ngay-dung-so");
const SCHEMA = `on5_smoke_${process.pid}`;
/** Bảng chỉ có ở máy thu (sync-cloud không đẩy) — lược đồ «máy chủ» không có view tới chúng. */
const CHI_MAY_THU = (t) => /^stg_/.test(t) || ["source_registry", "review_queue", "user_events", "user_profile", "airbnb_snapshots", "ops_heartbeat"].includes(t);

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

/** URL tới lược đồ tạm của DB local (search_path chỉ lược đồ đó). */
function schemaUrl(base, schema) {
  const u = new URL(base);
  u.searchParams.set("options", `-c search_path=${schema}`);
  return u.toString();
}
async function bamHeartbeat(db) {
  const r = await db.query(`SELECT to_regclass('public.ops_heartbeat')::text r`);
  if (!r.rows[0].r) return "vắng";
  const { rows } = await db.query(`SELECT md5(coalesce(string_agg(id || payload::text || coalesce(pushed_at::text, ''), '|' ORDER BY id), '')) h FROM public.ops_heartbeat`);
  return rows[0].h;
}

/** Chạy trong trình duyệt: bảng có cột zaloOffers → ô theo cột × ngày, lớp mờ, canh ô «Chỉ ở máy thu», tràn trang. */
function doBang() {
  const t = [...document.querySelectorAll('table[data-slot="data-grid-table"]')].find((x) => x.querySelector('thead th[data-col-id="zaloOffers"]'));
  const tran = [];
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= innerWidth + 0.5) continue;
    let a = el.parentElement;
    let trongKhung = false;
    while (a && a !== document.body) {
      if (/(auto|scroll)/.test(getComputedStyle(a).overflowX) && a.getBoundingClientRect().right <= innerWidth + 0.5) {
        trongKhung = true;
        break;
      }
      a = a.parentElement;
    }
    if (!trongKhung) tran.push(`<${el.tagName.toLowerCase()}> ${Math.round(r.left)}–${Math.round(r.right)}`);
  }
  const trang = { iw: innerWidth, docRong: document.documentElement.scrollWidth, tran: tran.slice(0, 3), soTran: tran.length };
  if (!t) return { ...trang, bang: null };
  const ids = [...t.querySelectorAll("thead th")].map((th) => th.getAttribute("data-col-id") ?? "");
  const hang = [...t.querySelectorAll("tbody tr")]
    .map((tr) => [...tr.children].filter((c) => c.tagName === "TD"))
    .filter((tds) => tds.length === ids.length)
    .map((tds) => {
      const o = (id) => tds[ids.indexOf(id)];
      const snap = o("airbnbSnapshots");
      const span = snap?.querySelector("span");
      const sr = snap?.getBoundingClientRect();
      const pr = span?.getBoundingClientRect();
      const pad = snap ? parseFloat(getComputedStyle(snap).paddingRight) : 0;
      return {
        day: o("day")?.textContent?.trim() ?? "",
        posts: o("zaloPosts")?.textContent?.trim() ?? "",
        offers: o("zaloOffers")?.textContent?.trim() ?? "",
        moPosts: !!o("zaloPosts")?.querySelector(".text-muted-foreground"),
        moOffers: !!o("zaloOffers")?.querySelector(".text-muted-foreground"),
        snap: snap?.textContent?.trim() ?? "",
        // ô «Chỉ ở máy thu» canh phải như ô số: mép phải chữ sát mép phải nội dung ô (≤ 2px)
        canhPhai: !!(sr && pr) && sr.right - pad - pr.right <= 2,
      };
    });
  return { ...trang, bang: { ids, hang } };
}

/** Lỗi theo trạng thái: `mong` = { s03: Map(day→{posts, offers}) | "gach", mo: boolean }. */
function loiTrangThai(m, mong, kho) {
  const loi = [];
  if (m.docRong > kho) loi.push(`trang: cuộn ngang — scrollWidth ${m.docRong} > ${kho}`);
  if (m.soTran > 0) loi.push(`trang: ${m.soTran} phần tử tràn mép phải ${kho} ngoài khung cuộn — ${m.tran.join(", ")}`);
  if (!m.bang) return [...loi, "bảng Luồng 7 ngày vắng"];
  if (m.bang.hang.length !== 7) loi.push(`bảng: ${m.bang.hang.length} hàng ≠ 7`);
  for (const c of ["airdnaMarkets", "airdnaListings"]) if (m.bang.ids.includes(c)) loi.push(`bảng: cột S02 ${c} có mặt`);
  for (const h of m.bang.hang) {
    const w = mong.s03 === "gach" ? { posts: "—", offers: "—" } : (mong.s03.get(h.day) ?? { posts: "?", offers: "?" });
    if (h.posts !== String(w.posts)) loi.push(`${h.day}: bài thô «${h.posts}» ≠ «${w.posts}»`);
    if (h.offers !== String(w.offers)) loi.push(`${h.day}: tin rao «${h.offers}» ≠ «${w.offers}»`);
    if (mong.s03 !== "gach" && (h.moPosts !== mong.mo || h.moOffers !== mong.mo)) loi.push(`${h.day}: ô S03 ${mong.mo ? "không mờ" : "mờ"}`);
    if (h.snap !== "Chỉ ở máy thu") loi.push(`${h.day}: snapshot «${h.snap}» ≠ «Chỉ ở máy thu»`);
    else if (!h.canhPhai) loi.push(`${h.day}: ô «Chỉ ở máy thu» không canh phải`);
  }
  return loi;
}

const tim = timPlaywright(ROOT);
if (!tim) {
  console.log("FAIL không tìm thấy playwright-core (app/, collector/ của cây, collector/ của checkout chính)");
  process.exit(1);
}
mkdirSync(ANH, { recursive: true });

let db, phien, app, browser, bamTruoc;
try {
  db = new pg.Client({ connectionString: dbUrl() });
  await db.connect();
  bamTruoc = await bamHeartbeat(db);

  // ---- lược đồ «máy chủ» ----
  await db.query(`CREATE SCHEMA "${SCHEMA}"`);
  const { rows: rels } = await db.query(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','v','m','p','f')`,
  );
  let soView = 0;
  for (const { relname } of rels) {
    if (CHI_MAY_THU(relname)) continue;
    await db.query(`CREATE VIEW "${SCHEMA}"."${relname}" AS SELECT * FROM public."${relname}"`);
    soView++;
  }
  await db.query(`CREATE TABLE "${SCHEMA}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`);
  console.log(`lược đồ máy chủ tạm ${SCHEMA}: ${soView} view, ops_heartbeat riêng, không source_registry/stg_*/airbnb_snapshots`);

  // ---- bản tin bên ghi thật trên DB local (chỉ đọc) ----
  const cap = await captureOpsFacts({ env: { DATABASE_URL: dbUrl(), OPS_FACTS_NOW: new Date().toISOString() } });
  if (cap.code !== 0 || !cap.payload?.blocks?.luong7?.days) throw new Error(`bên ghi không dựng được bản tin (mã ${cap.code}): ${cap.stderr.slice(0, 300)}`);
  const goc = cap.payload;
  const s03 = new Map(goc.blocks.luong7.days.map((d) => [d.day, { posts: new Intl.NumberFormat("vi-VN").format(d.s03Posts), offers: new Intl.NumberFormat("vi-VN").format(d.s03Offers) }]));
  const lui = (p, phut) => {
    const x = structuredClone(p);
    const sh = (iso) => new Date(Date.parse(iso) - phut * 60_000).toISOString();
    x.pushedAt = sh(x.pushedAt);
    for (const b of Object.values(x.blocks)) if (b?.measured_at) b.measured_at = sh(b.measured_at);
    return x;
  };
  const thieu = structuredClone(goc);
  delete thieu.blocks.luong7;
  const TRANG_THAI = [
    { ten: "tươi", payload: goc, mong: { s03, mo: false } },
    { ten: "cũ", payload: lui(goc, 50), mong: { s03, mo: true } },
    { ten: "thiếu khối", payload: thieu, mong: { s03: "gach", mo: false } },
  ];

  phien = await phienAdminTam(db, "on5");
  app = await batApp(ROOT, { env: { VERCEL: "1", DATABASE_URL: schemaUrl(dbUrl(), SCHEMA) } });
  browser = await batTrinhDuyet(tim.pw.chromium);

  for (const [kho, cao] of [[1280, 800], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: kho, height: cao }, deviceScaleFactor: 2 });
    await ctx.addCookies([{ name: "oi_session", value: phien.token, url: app.base }]);
    const p = await ctx.newPage();
    for (const tt of TRANG_THAI) {
      await db.query(
        `INSERT INTO "${SCHEMA}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, now())
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, pushed_at = EXCLUDED.pushed_at`,
        [tt.payload],
      );
      await p.goto(`${app.base}/ops/collections`, { waitUntil: "networkidle", timeout: 180_000 });
      const m = await p.evaluate(doBang);
      const loi = loiTrangThai(m, tt.mong, kho);
      const so = tt.mong.s03 === "gach" ? "«—»" : "đúng số";
      check(loi.length === 0, loi.length === 0 ? `${tt.ten} ${kho}: 14 ô S03 ${so} · ${tt.mong.mo ? "mờ" : "không mờ"} · 7 ô «Chỉ ở máy thu» canh phải · trang rộng ${m.docRong} ≤ ${kho}` : `${tt.ten} ${kho}: ${loi.slice(0, 6).join(" | ")}`);
      const ten = `${kho}-${tt.ten.replaceAll(" ", "-")}`;
      await p.locator("#luong").screenshot({ path: path.join(ANH, `luong-${ten}.png`) }).catch((e) => check(false, `${tt.ten} ${kho}: không chụp được bảng — ${e.message.split("\n")[0]}`));
      await p.screenshot({ path: path.join(ANH, `trang-${ten}.png`) });
      console.log(`ảnh chụp: .acceptance-runs/luong-7-ngay-dung-so/luong-${ten}.png`);
    }
    // ---- chiều đỏ (khổ đang mở, bản tin tươi) ----
    await db.query(`UPDATE "${SCHEMA}".ops_heartbeat SET payload = $1 WHERE id = 'primary'`, [goc]);
    await p.goto(`${app.base}/ops/collections`, { waitUntil: "networkidle", timeout: 180_000 });
    await p.evaluate(() => {
      const t = [...document.querySelectorAll('table[data-slot="data-grid-table"]')].find((x) => x.querySelector('thead th[data-col-id="zaloOffers"]'));
      const i = [...t.querySelectorAll("thead th")].findIndex((th) => th.getAttribute("data-col-id") === "airbnbSnapshots");
      for (const tr of t.querySelectorAll("tbody tr")) {
        const td = tr.children[i];
        td.style.textAlign = "left";
        for (const c of td.querySelectorAll("*")) {
          c.style.textAlign = "left";
          c.style.justifyContent = "flex-start";
          c.style.marginRight = "auto";
          c.style.width = "auto";
        }
      }
    });
    const ca = loiTrangThai(await p.evaluate(doBang), { s03, mo: false }, kho).filter((l) => l.includes("không canh phải"));
    check(ca.length > 0, ca.length > 0 ? `chiều đỏ ${kho}: ô «Chỉ ở máy thu» canh trái → báo «${ca[0]}»` : `chiều đỏ ${kho}: ô canh trái KHÔNG bị báo`);
    await p.reload({ waitUntil: "networkidle" });
    await p.evaluate(() => {
      const d = document.createElement("div");
      d.style.width = "500px";
      d.style.height = "4px";
      (document.querySelector("main") ?? document.body).appendChild(d);
    });
    const cb = loiTrangThai(await p.evaluate(doBang), { s03, mo: false }, kho).filter((l) => l.startsWith("trang:"));
    if (kho === 390) check(cb.length > 0, cb.length > 0 ? `chiều đỏ ${kho}: phần tử 500px → báo «${cb[0]}»` : `chiều đỏ ${kho}: phần tử 500px KHÔNG bị báo`);
    await ctx.close();
  }
} catch (e) {
  check(false, `smoke dừng giữa chừng: ${e.message}`);
} finally {
  await browser?.close().catch(() => {});
  await app?.tat();
  const con = phien ? await phien.xoa() : 0;
  if (db) {
    await db.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {});
    const bamSau = await bamHeartbeat(db).catch(() => "lỗi đọc");
    if (bamTruoc !== undefined) check(bamSau === bamTruoc, bamSau === bamTruoc ? "ops_heartbeat thật không đổi" : `ops_heartbeat thật ĐỔI: ${bamTruoc} → ${bamSau}`);
    await db.end().catch(() => {});
  }
  check(con === 0, `dọn: ${con} phiên tạm còn lại`);
}

console.log(fails.length === 0 ? "\nsmoke-luong-7-ngay: PASS" : `\nsmoke-luong-7-ngay: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
