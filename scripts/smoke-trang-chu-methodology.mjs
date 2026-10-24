#!/usr/bin/env node
// smoke-trang-chu-methodology.mjs — _acceptance/trang-chu-methodology (UI2): / và /methodology (301 từ /phuong-phap) qua HTTP.
// Đo HTML server trả về: redirect 301 giữ query, /methodology mở sẵn mọi định nghĩa (id từng ô, không nút mở/đóng), link
// nội bộ trỏ /methodology ở trang chủ, trang đăng nhập, chân trang. Chỉ GET, không ghi gì.
// Cần app chạy TỪ worktree đang kiểm (BASE_URL, mặc định :3460 — cổng riêng của dãy U1) + DB local (trang chủ đọc số thật).
// Hash (#revpar) không đi qua server — trình duyệt giữ nó qua 301; script chỉ đo phần server.
// Dùng: BASE_URL=http://localhost:3460 node scripts/smoke-trang-chu-methodology.mjs  (exit 0 = đạt)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3460";

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

async function get(pathname) {
  const res = await fetch(`${BASE}${pathname}`, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

/** Phần đánh dấu HTML, bỏ <script> (gói RSC lặp lại chuỗi) để đếm phần tử thật. */
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ");
/** Location tương đối, đã giải mã (%2C…). */
const rel = (loc) => (loc ? decodeURIComponent(loc.replace(/^https?:\/\/[^/]+/, "")) : String(loc));
const count = (s, re) => (s.match(re) ?? []).length;

// Id của 15 ô rút từ chính tệp nội dung trang (bên ghi), không viết tay.
const defsSrc = readFileSync(path.join(root, "app/src/components/marketing/methodology-definitions.tsx"), "utf8");
const IDS = [...defsSrc.matchAll(/^\s+id: "([a-z0-9-]+)",$/gm)].map((m) => m[1]);

try {
  // AC-1: 301 giữ query; /methodology không bị chuyển hướng.
  for (const [from, to] of [
    ["/phuong-phap", "/methodology"],
    ["/phuong-phap?x=1", "/methodology?x=1"],
  ]) {
    const r = await get(from);
    check(r.status === 301 && rel(r.location) === to, `${from} → 301 ${to} (thật: ${r.status} ${rel(r.location)})`);
  }
  const m = await get("/methodology");
  check(m.status === 200, `/methodology 200 (thật: ${m.status}${m.location ? ` → ${rel(m.location)}` : ""})`);

  // AC-3: định nghĩa mở sẵn trong HTML lúc tải.
  const mk = markup(m.html);
  check(count(mk, /<h1[\s>]/g) === 1, `/methodology 1 h1 (thật: ${count(mk, /<h1[\s>]/g)})`);
  for (const id of ["chi-so", "loi-suat", "nguon"]) check(mk.includes(`<section id="${id}"`), `/methodology id ${id}`);
  check(IDS.length === 15, `methodology-definitions.tsx có 15 ô (thật: ${IDS.length})`);
  const missing = IDS.filter((id) => !mk.includes(`<div id="${id}"`));
  check(missing.length === 0, `/methodology 15 ô định nghĩa có id (${IDS.slice(0, 3).join(", ")}, …)${missing.length ? ` — thiếu ${missing.join(", ")}` : ""}`);
  // Chỉ đếm trong <main>: navbar có menu (Sản phẩm, tài khoản, ☰) mang aria-expanded hợp lệ.
  const main = mk.slice(mk.indexOf("<main"), mk.indexOf("</main>"));
  check(main.length > 0 && count(main, /\saria-expanded="/g) === 0, `/methodology 0 aria-expanded trong <main> (thật: ${count(main, /\saria-expanded="/g)}; cả trang ${count(mk, /\saria-expanded="/g)} — của navbar)`);
  check(mk.includes("Doanh thu ÷ tổng đêm khả dụng"), "/methodology câu trả lời RevPAR có trong HTML lúc tải");
  check(count(mk, /href="\/methodology"/g) >= 1, "/methodology chân trang có href=\"/methodology\"");

  // AC-2: link nội bộ trỏ /methodology, không còn /phuong-phap ở đâu trong HTML.
  const home = await get("/");
  check(home.status === 200, `/ 200 (thật: ${home.status})`);
  const nHome = count(markup(home.html), /href="\/methodology"/g);
  check(nHome >= 4, `/ có href="/methodology" ≥ 4 chỗ (navbar, Cách dùng, hỏi đáp, chân trang — thật: ${nHome})`);
  check(!home.html.includes("/phuong-phap"), "/ 0 chỗ /phuong-phap");
  const login = await get("/login");
  check(login.status === 200, `/login 200 (thật: ${login.status})`);
  check(count(markup(login.html), /href="\/methodology"/g) >= 1, '/login có href="/methodology"');
  check(!login.html.includes("/phuong-phap"), "/login 0 chỗ /phuong-phap");
  check(!m.html.includes("/phuong-phap"), "/methodology 0 chỗ /phuong-phap");
} catch (e) {
  check(false, `lỗi khi gọi ${BASE}: ${e.message}`);
}

if (fails.length) {
  console.error(`smoke-trang-chu-methodology: ${fails.length} FAIL`);
  process.exit(1);
}
console.log("smoke-trang-chu-methodology: đạt");
