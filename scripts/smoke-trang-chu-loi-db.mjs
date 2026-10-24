#!/usr/bin/env node
// smoke-trang-chu-loi-db.mjs — _acceptance/trang-chu-methodology (UI2, AC-8): DB sập thì khách thấy trang lỗi toàn cục tiếng Việt.
// Chạy `next start` trên BẢN BUILD có sẵn (executor gọi `next build` ngay trước) ở cổng 3462 với DATABASE_URL trỏ một
// cổng chết: layout marketing đọc DB (phiên + chỉ mục tìm kiếm) nên hỏng trước trang → app/global-error.tsx phải bắt.
// Bản build trả tài liệu lỗi tối thiểu (<html id="__next_error__">, mã 500) rồi TRÌNH DUYỆT vẽ global-error (client
// component) — nên phần nhìn thấy đo bằng trình duyệt thật (playwright-cli), không đo HTML server (đo S3 25/10).
// Đối chứng dương: bản dev của dãy (BASE_URL, mặc định :3460, DB sống) KHÔNG hiện trang lỗi ấy. Chỉ đọc; server tạm tắt ở finally.
// Dùng: (cd app && npx next build) && node scripts/smoke-trang-chu-loi-db.mjs  (exit 0 = đạt)
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(root, "app");
const PORT = Number(process.env.SMOKE_PORT ?? 3462);
const DEAD_DB = process.env.SMOKE_DEAD_DATABASE_URL ?? "postgres://127.0.0.1:1/x";
const DEV = process.env.BASE_URL ?? "http://localhost:3460";
const CRASH = "One Invest không mở được";

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ");

// Trình duyệt thật: playwright-cli (cùng công cụ chụp design-pass). Kết quả eval là một chuỗi JSON dưới dòng «### Result».
const S = `loidb-${process.pid}`;
const cli = (...a) => execFileSync("playwright-cli", [`-s=${S}`, ...a], { encoding: "utf8" });
const SEEN = `async () => {
  const t0 = Date.now();
  while (Date.now() - t0 < 15000 && !document.querySelector('[role="alert"]')) await new Promise((r) => setTimeout(r, 300));
  const home = [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Về trang chủ"));
  return JSON.stringify({
    lang: document.documentElement.lang,
    title: document.title,
    alert: document.querySelector('[role="alert"]')?.textContent ?? "",
    retry: [...document.querySelectorAll("button")].some((b) => b.textContent.includes("Thử lại")),
    home: home?.getAttribute("href") ?? null,
    nav: !!document.querySelector("header nav"),
  });
}`;
function seen(url) {
  cli("goto", url);
  const out = cli("eval", SEEN);
  const line = out.split("\n")[out.split("\n").indexOf("### Result") + 1];
  return JSON.parse(JSON.parse(line));
}

async function waitUp(url, ms) {
  const t0 = Date.now();
  do {
    try {
      await fetch(url, { redirect: "manual" });
      return true;
    } catch {
      if (ms > 1) await new Promise((r) => setTimeout(r, 500));
    }
  } while (Date.now() - t0 < ms);
  return false;
}

// Cổng phải trống: một server tạm sót lại từ lượt trước sẽ trả lời thay bản build vừa dựng (đã gặp ở S3).
if (await waitUp(`http://localhost:${PORT}/`, 1)) {
  console.error(`FAIL cổng ${PORT} đang có tiến trình khác — tắt nó rồi chạy lại`);
  process.exit(1);
}

const server = spawn(process.execPath, [path.join(APP, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], {
  cwd: APP,
  env: { ...process.env, DATABASE_URL: DEAD_DB, NODE_ENV: "production" },
  detached: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));

try {
  const base = `http://localhost:${PORT}`;
  check(await waitUp(`${base}/`, 60000), `bản build lên ở :${PORT} với DATABASE_URL trỏ cổng chết`);
  cli("open", `${base}/`);
  for (const p of ["/", "/methodology"]) {
    const res = await fetch(`${base}${p}`, { redirect: "manual" });
    const html = await res.text();
    check(res.status === 500 && !html.includes("Internal Server Error"), `${p} → server trả 500 với tài liệu lỗi của Next, không phải chữ Internal Server Error trần (thật: ${res.status} ${html.trimStart().slice(0, 50)})`);
    const v = seen(`${base}${p}`);
    check(v.lang === "vi", `${p} → trình duyệt: <html lang="vi"> (thật: ${v.lang})`);
    check(v.alert.includes(CRASH) && /Mã lỗi: \d+/.test(v.alert), `${p} → trình duyệt: Alert «${CRASH}» kèm mã lỗi (thật: ${v.alert.slice(0, 60)})`);
    check(v.retry && v.home === "/", `${p} → trình duyệt: nút Thử lại + link Về trang chủ href="/" (thật: retry=${v.retry} home=${v.home})`);
    check(!v.nav && v.title === "Có lỗi · One Invest", `${p} → trình duyệt: trang lỗi toàn cục (không navbar, tiêu đề «Có lỗi · One Invest» — thật: nav=${v.nav} «${v.title}»)`);
  }
  // Đối chứng dương: DB sống → cùng phép đo trình duyệt KHÔNG thấy trang lỗi toàn cục.
  try {
    const live = await fetch(`${DEV}/`);
    check(live.status === 200, `đối chứng: ${DEV}/ (DB sống) 200 (thật: ${live.status})`);
    const v = seen(`${DEV}/`);
    check(!v.alert.includes(CRASH) && v.nav, `đối chứng: trình duyệt ở ${DEV}/ KHÔNG có «${CRASH}», có navbar (thật: nav=${v.nav})`);
  } catch (e) {
    check(false, `đối chứng: không đo được ${DEV}/ — ${e.message}`);
  }
} finally {
  try {
    cli("close");
  } catch {}
  const gone = new Promise((r) => server.once("exit", r));
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
  const t = setTimeout(() => {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {}
  }, 10000);
  await gone;
  clearTimeout(t);
  check(!(await waitUp(`http://localhost:${PORT}/`, 1)), `server tạm ở :${PORT} đã tắt`);
}

if (fails.length) {
  console.error(log.split("\n").slice(-15).join("\n"));
  console.error(`smoke-trang-chu-loi-db: ${fails.length} FAIL`);
  process.exit(1);
}
console.log("smoke-trang-chu-loi-db: đạt");
