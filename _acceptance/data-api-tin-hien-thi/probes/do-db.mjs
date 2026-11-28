#!/usr/bin/env node
// do-db.mjs — PB7 AC-7 (eval E7): trên bản chép DB của máy (db/db-thu.sh), gọi CHÍNH route /v1/listings của ba bản —
// nền (routes/listings.ts ở nền, sha in ra), sau (bản hôm nay), bo-loc (bản hôm nay bỏ điều kiện nguồn) — và đếm khoá tin
// nguồn ẩn trả về. Probe không chứa SQL tập ghép: SQL chỉ để đếm bảng, cấy một dòng, và tra nguồn của khoá route trả.
//  Lượt 1 (dữ liệu thật): nguồn ẩn trong bảng k dòng; route trước a, sau 0; khoá còn lại trước = sau (mẫu: ba khu nhiều tin
//         nhất + khu cấy, mọi kind, phân trang hết). k = 0 → «lỗ tiềm ẩn đã đóng».
//  Lượt 2 (chiều đỏ): cấy một tin S08 thuê dài vào bản chép → trước ≥ 1, sau 0, bo-loc ≥ 1.
// Không có DB máy (db-thu lỗi) → thoát 2; ô không đỏ → thoát 1 «do-db: thước không đỏ ở <ô>».
// Tạo phẩm (ba bản route, tệp chạy) nằm trong một bản chép data-api/ ở thư mục tạm của hệ thống, KHÔNG trong cây nguồn —
// suite và lưới khác (VL-AC-5) quét data-api/src lúc probe chạy song song (sửa thước sau S4 vòng 2, PL36). Cuối lượt soát
// `git status --porcelain data-api` không đổi so đầu lượt, đổi → thoát 1.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const gitOk = (...a) => { try { git(...a); return true; } catch { return false; } };
const ung = [git("merge-base", "HEAD", "origin/main").trim()];
if (gitOk("rev-parse", "--verify", "-q", "origin/feat/data-api-hop-dong-reso-dd-2-1")) ung.push(git("merge-base", "HEAD", "origin/feat/data-api-hop-dong-reso-dd-2-1").trim());
const nen = ung.find((c) => ung.every((d) => d === c || gitOk("merge-base", "--is-ancestor", d, c))) ?? ung[0];
const trangThai = () => git("status", "--porcelain", "--untracked-files=all", "--", "data-api");
const truoc = trangThai();
const hom = readFileSync(path.join(ROOT, "data-api", "src", "routes", "listings.ts"), "utf8");
if (!hom.includes(" AND ${NGUON_HIEN}")) { console.log("do-db: bản hôm nay không có điều kiện nguồn để bỏ"); process.exit(2); }
const BAN = {
  nen: [`__pb7-nen-${process.pid}.ts`, git("show", `${nen}:data-api/src/routes/listings.ts`)],
  boloc: [`__pb7-boloc-${process.pid}.ts`, hom.replace(" AND ${NGUON_HIEN}", "")],
};
const tam = mkdtempSync(path.join(os.tmpdir(), "pb7-db-"));
const BC = path.join(tam, "data-api"); // bản chép data-api/: route tương đối (../db/client.js, ../contract/…) chạy y nguyên
const R = path.join(BC, "src", "routes");
let ma = 0;
try {
  for (const p of ["src", "package.json", "tsconfig.json"]) cpSync(path.join(ROOT, "data-api", p), path.join(BC, p), { recursive: true });
  symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(BC, "node_modules"));
  for (const [f, s] of Object.values(BAN)) writeFileSync(path.join(R, f), s);
  const chay = path.join(BC, "do-db-chay.mts"); // trong bản chép data-api/ để nhập được hono
  writeFileSync(chay, `process.env.NODE_ENV = "test"; delete process.env.DATA_API_KEYS; delete process.env.LISTING_KEY_SECRET;
const { Hono } = await import("hono");
const { pool } = await import(${JSON.stringify(path.join(BC, "src/db/client.ts"))});
const mk = async (f) => new Hono().route("/v1/listings", (await import(${JSON.stringify(R)} + "/" + f)).listingsRoute);
const ban = { nen: await mk(${JSON.stringify(BAN.nen[0])}), sau: await mk("listings.ts"), boloc: await mk(${JSON.stringify(BAN.boloc[0])}) };
const AN = ${JSON.stringify(["S02", "S08"])};
const q = (s, p = []) => pool.query(s, p);
async function khoa(app, area) {
  const ra = [];
  for (let off = 0; ; off += 200) {
    const r = await app.request("/v1/listings?area=" + encodeURIComponent(area) + "&limit=200&offset=" + off);
    if (r.status !== 200) throw new Error("route " + r.status + " ở " + area);
    const d = (await r.json()).data ?? [];
    ra.push(...d.map((x) => x.listingKey));
    if (d.length < 200) break;
  }
  return ra;
}
async function dem(area) {
  const ra = {};
  for (const [ten, app] of Object.entries(ban)) {
    const ks = await khoa(app, area);
    const { rows } = await q("SELECT count(*)::int n FROM sale_offers WHERE offer_id = ANY($1) AND source = ANY($2)", [ks, AN]);
    ra[ten] = { an: rows[0].n, con: ks.length - rows[0].n };
  }
  return ra;
}
const tong = (xs, ban, k) => xs.reduce((s, x) => s + x[ban][k], 0);
const k = (await q("SELECT count(*)::int n FROM sale_offers WHERE source = ANY($1)", [AN])).rows[0].n;
const top = (await q("SELECT area_id FROM sale_offers WHERE area_id IS NOT NULL GROUP BY 1 ORDER BY count(*) DESC LIMIT 3")).rows.map((r) => r.area_id);
const vung = [...top];
const l1 = []; for (const a of vung) l1.push(await dem(a));
// Lượt 2: cấy một tin S08 thuê dài hạn vào khu nhiều tin nhất (bản chép DB, bỏ đi sau lượt).
await q(\`INSERT INTO sale_offer_records (offer_id, kind, area_id, price_vnd, area_m2, price_perm2, bedrooms, bathrooms, confidence,
  first_seen, last_seen, n_reposts, source, property_type, latitude, longitude, offer_status)
  VALUES ('pb7-do-db-s08', 'rent_lt', $1, 12000000, 60, 200000, 2, 1, 'high', now(), now(), 1, 'S08', 'apartment', 21.03, 105.85, 'active')\`, [top[0]]);
const l2 = await dem(top[0]);
await pool.end();
console.log("KQ " + JSON.stringify({ k, vung, l1: { nen_an: tong(l1, "nen", "an"), sau_an: tong(l1, "sau", "an"), nen_con: tong(l1, "nen", "con"), sau_con: tong(l1, "sau", "con") }, l2 }));
`);
  const env = { ...process.env };
  delete env.DATABASE_URL;
  const r = spawnSync("bash", [path.join(ROOT, "db", "db-thu.sh"), "oneinvest_suite_pb7_db", "--chay", "sh", "-c", `cd '${BC}' && npx tsx '${chay}'`],
    { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 << 20 });
  const dong = (r.stdout ?? "").split("\n").find((l) => l.startsWith("KQ "));
  if (!dong) { console.log(`do-db: không chạy được trên bản chép DB:\n${(r.stderr ?? "").split("\n").filter(Boolean).slice(-12).join("\n")}`); ma = 2; }
  else {
  const kq = JSON.parse(dong.slice(3));
  console.log(`do-db: nền ${nen.slice(0, 9)}; nguồn ẩn trong bảng ${kq.k} dòng; route trước ${kq.l1.nen_an}, sau ${kq.l1.sau_an}; khoá còn lại trước ${kq.l1.nen_con} = sau ${kq.l1.sau_con} (mẫu ${kq.vung.length} khu nhiều tin nhất)${kq.k === 0 ? " — lỗ tiềm ẩn đã đóng" : ""}`);
  let sai = 0;
  const o = (ten, dat) => { if (!dat) { console.log(`do-db: thước không đỏ ở ${ten}`); sai++; } };
  if (kq.l1.sau_an !== 0) { console.log(`do-db: bản hôm nay còn trả ${kq.l1.sau_an} tin nguồn ẩn`); sai++; }
  if (kq.l1.nen_con !== kq.l1.sau_con) { console.log("do-db: số khoá còn lại trước khác sau"); sai++; }
  if (kq.l1.nen_con === 0) { console.log("do-db: mẫu không có khoá nào — không so được"); sai++; }
  console.log(`do-db: cấy một tin S08 → trước ${kq.l2.nen.an}, sau ${kq.l2.sau.an}, bo-loc ${kq.l2.boloc.an}`);
  o("cay-truoc", kq.l2.nen.an >= 1);
  o("cay-sau", kq.l2.sau.an === 0);
  o("bo-loc", kq.l2.boloc.an >= 1);
  ma = sai ? 1 : 0;
  }
} finally {
  rmSync(tam, { recursive: true, force: true });
}
const sau = trangThai();
if (sau !== truoc) {
  console.log(`do-db: probe để tạo phẩm trong cây nguồn data-api/:\n${sau}`);
  ma = ma || 1;
} else console.log("do-db: cây nguồn data-api/ không đổi sau probe");
process.exit(ma);
