#!/usr/bin/env node
// can-gia-tot-ba-vai.mjs — hồ sơ can-gia-tot-biet-can E10 (AC-10): đăng nhập thật ba tài khoản thử vào bản đang chạy, tải HTML
// và RSC của /ops/deals cùng mọi trang một căn, GET mọi ảnh. Đầu ra chỉ có số đếm: không tên, số, chữ bài, mật khẩu.
//   node scripts/can-gia-tot-ba-vai.mjs [base_url]   # mặc định http://localhost:3460
// Thoát: 0 đạt · 1 có vi phạm · 2 chưa đo được (bản chưa chạy, không có căn).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.argv[2] ?? "http://localhost:3460";
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const TEP = { ops: ".claude/ops-role-test-account.json", viewer: ".claude/viewer-test-account.json", admin: ".claude/ops-test-account.json" };

const loi = [];
const dungLai = (s) => { console.error(`CHƯA ĐO: ${s}`); process.exit(2); };

async function dangNhap(vai) {
  execFileSync(process.execPath, [path.join(ROOT, "scripts/dev-ops-account.mjs"), "--vai", vai], { stdio: "ignore" });
  const { email, password } = JSON.parse(readFileSync(path.join(ROOT, TEP[vai]), "utf8"));
  const trang = await fetch(`${BASE}/login`).then((r) => r.text()).catch(() => dungLai(`không mở được ${BASE}/login`));
  const aid = trang.match(/name="(\$ACTION_ID_[0-9a-f]+)"/)?.[1];
  if (!aid) dungLai("không thấy form đăng nhập");
  const f = new FormData();
  f.set(aid, "");
  f.set("email", email);
  f.set("password", password);
  f.set("next", "/ops/deals");
  const r = await fetch(`${BASE}/login`, { method: "POST", body: f, redirect: "manual" });
  const cookie = (r.headers.get("set-cookie") ?? "").match(/oi_session=[0-9a-f]+/)?.[0];
  if (!cookie) dungLai(`vai ${vai} không đăng nhập được (HTTP ${r.status})`);
  return cookie;
}

/** Bỏ thoát HTML và JSON để so chuỗi được trên cả HTML lẫn dữ liệu RSC. */
const chuan = (s) => s.replace(/\\u0026|&amp;/g, "&").replace(/\\u003c|&lt;/g, "<").replace(/\\u003e|&gt;/g, ">").replace(/&quot;|\\"/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/\\n/g, "\n");
async function taiHaiDang(cookie, url) {
  const [html, rsc] = await Promise.all([
    fetch(`${BASE}${url}`, { headers: { cookie } }),
    fetch(`${BASE}${url}`, { headers: { cookie, RSC: "1" } }),
  ]);
  if (html.status !== 200 || rsc.status !== 200) loi.push(`${url} trả ${html.status}/${rsc.status}`);
  return chuan(`${await html.text()}\n${await rsc.text()}`);
}

/** Sáu dạng số quy về một khuôn: chín chữ số cuối, cho phép dấu cách, chấm, gạch giữa các nhóm. */
const khuonSo = (e164) => {
  const d = e164.replace(/\D/g, "").slice(-9);
  return new RegExp(`(?<!\\d)(?:\\+?84|0)?[ .-]?${d.split("").join("[ .-]?")}(?!\\d)`);
};
const ANH = /\/api\/zalo-media\?(?:media|snapshot)=[^"'\s\\<>]+/g;
const dongDau = (s) => s.split("\n").map((x) => x.trim()).find((x) => x.length >= 20)?.slice(0, 40) ?? null;

async function thuAnh(cookie, src) {
  try {
    const r = await fetch(`${BASE}${src}`, { headers: { cookie }, signal: AbortSignal.timeout(30_000) });
    await r.arrayBuffer();
    return { status: r.status, image: (r.headers.get("content-type") ?? "").startsWith("image/") };
  } catch {
    return { status: 0, image: false };
  }
}
async function theoLo(ds, fn, n = 4) {
  const out = [];
  for (let i = 0; i < ds.length; i += n) out.push(...(await Promise.all(ds.slice(i, i + n).map(fn))));
  return out;
}

const c = new pg.Client({ connectionString: DB });
await c.connect();
try {
  const phien = { ops: await dangNhap("ops"), viewer: await dangNhap("viewer"), admin: await dangNhap("admin") };
  const dsOps = await taiHaiDang(phien.ops, "/ops/deals");
  const ids = [...new Set([...dsOps.matchAll(/data-row-id="([^"]+)"|"offerId":"([^"]+)"/g)].map((m) => m[1] ?? m[2]))];
  if (ids.length === 0) dungLai("danh sách không có căn");

  const { rows } = await c.query(
    `SELECT o.offer_id, o.seller_name, o.seller_phone, o.property_type,
            (SELECT z.text FROM stg_zalo_posts z WHERE z.post_id = ANY(o.post_ids) ORDER BY z.captured_at DESC LIMIT 1) AS bai,
            EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = o.offer_id) AS co_anh
       FROM sale_offers o WHERE o.offer_id = ANY($1::text[])`,
    [ids],
  );
  const tenNguon = (await c.query("SELECT real_name FROM source_registry")).rows.map((r) => r.real_name.toLowerCase());
  const coTenNguon = (s) => tenNguon.some((t) => s.toLowerCase().includes(t));
  // Tên người bán trùng đúng nhãn loại hình của căn là rác nguồn, không phải danh tính: chữ đó vai nào cũng thấy ở cột Loại hình.
  const loaiHinh = new Set(rows.map((r) => r.property_type).filter(Boolean));
  const CAM_VIEWER = rows.flatMap((r) => [
    ...(r.seller_phone ? [{ loai: "số", re: khuonSo(r.seller_phone) }] : []),
    ...(r.seller_name && r.seller_name.length >= 4 && !loaiHinh.has(r.seller_name) ? [{ loai: "tên", s: r.seller_name }] : []),
    ...(r.bai && dongDau(r.bai) ? [{ loai: "chữ bài", s: dongDau(r.bai) }] : []),
  ]);
  const quetViewer = (noi, trang) => {
    if (/\/api\/zalo-media\?/.test(trang)) loi.push(`viewer nhận đường ảnh ở ${noi}`);
    if (/tel:\+?\d/.test(trang)) loi.push(`viewer nhận liên kết gọi ở ${noi}`);
    for (const x of CAM_VIEWER) if (x.re ? x.re.test(trang) : trang.includes(x.s)) loi.push(`viewer nhận ${x.loai} ở ${noi}`);
  };

  quetViewer("danh sách", await taiHaiDang(phien.viewer, "/ops/deals"));
  const anhCan = new Map();
  let trangDu = 0;
  for (const r of rows) {
    const url = `/ops/deals/${encodeURIComponent(r.offer_id)}`;
    quetViewer("trang một căn", await taiHaiDang(phien.viewer, url));
    let du = true;
    for (const vai of ["ops", "admin"]) {
      const t = await taiHaiDang(phien[vai], url);
      const anh = [...new Set(t.match(ANH) ?? [])];
      if (vai === "ops") anhCan.set(r.offer_id, anh);
      if (r.seller_phone && !t.includes(`tel:${r.seller_phone}`)) { loi.push(`${vai} thiếu liên kết gọi`); du = false; }
      if (r.seller_name && !coTenNguon(r.seller_name) && !t.includes(r.seller_name)) { loi.push(`${vai} thiếu tên`); du = false; }
      if (r.bai && dongDau(r.bai) && !coTenNguon(r.bai) && !t.includes(dongDau(r.bai))) { loi.push(`${vai} thiếu chữ bài`); du = false; }
      if (r.co_anh && anh.length === 0) { loi.push(`${vai} thiếu ảnh`); du = false; }
    }
    if (du) trangDu++;
  }

  // Mọi ảnh của mọi căn: ops tải, viewer bị từ chối, tách theo đường.
  const tatCa = [...new Set([...anhCan.values()].flat())];
  const ketOps = new Map();
  await theoLo(tatCa, async (s) => ketOps.set(s, await thuAnh(phien.ops, s)));
  const ketViewer = await theoLo(tatCa, async (s) => ({ s, ...(await thuAnh(phien.viewer, s)) }));
  for (const r of rows) {
    if (!r.co_anh) continue;
    if (!(anhCan.get(r.offer_id) ?? []).some((s) => ketOps.get(s)?.status === 200 && ketOps.get(s)?.image)) loi.push("một căn có dòng media mà vai Vận hành không tải được ảnh nào");
  }
  for (const k of ketViewer) if (![401, 403, 404].includes(k.status)) loi.push(`viewer GET ảnh trả ${k.status}`);
  for (const duong of ["media", "snapshot"]) {
    const ds = tatCa.filter((s) => s.includes(`?${duong}=`));
    const dat = ds.filter((s) => ketOps.get(s)?.status === 200 && ketOps.get(s)?.image).length;
    const chan = ketViewer.filter((k) => k.s.includes(`?${duong}=`) && [401, 403, 404].includes(k.status)).length;
    console.log(`ảnh ?${duong}=: ${ds.length} đường · vai Vận hành tải được ${dat}/${ds.length} · vai Người xem bị từ chối ${chan}/${ds.length}`);
  }
  console.log(`n căn = ${rows.length} · trang đủ ở ops và admin ${trangDu}/${rows.length} · căn có dòng media ${rows.filter((r) => r.co_anh).length}`);
  if (rows.length === 0) dungLai("không đọc được căn nào từ DB");
} finally {
  await c.end();
}
if (loi.length) {
  const dem = new Map();
  for (const l of loi) dem.set(l, (dem.get(l) ?? 0) + 1);
  for (const [l, n] of dem) console.error(`VI PHẠM (${n}): ${l}`);
  process.exit(1);
}
console.log("CGT ba vai: ĐẠT");
