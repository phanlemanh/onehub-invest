// node --test scripts/ui-capture-browser.test.mjs
// Hồ sơ buoc-chup-khong-in-ten-that (AC-3, AC-6): bước chụp chạy trên trình duyệt THẬT (playwright-cli), máy chủ giả
// node:http phục vụ /login (khuôn server action) và /ops/x. Không DB, không app; danh sách tên tiêm qua tham số — không
// biến môi trường nào đổi nguồn tên. Thiếu playwright-cli thì ĐỎ (không bỏ qua — bỏ qua là xanh rỗng).
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { capture } from "./ui-capture-login.mjs";

/** Bộ 3 tên giả của UC-TA-1: có dấu, hoa-thường lẫn, có nháy. */
const TEN = ["Nhóm Thử Đặc Biệt", "nGuOn tHu", `Ng'uồn "Kép"`];
const EMAIL = "ops-test@local.test";
const PASSWORD = "mat-khau-thu-Br42";
const COOKIE = "b".repeat(64);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Thân trang /ops/x theo ca: chu-<i> · title-<i> · tierA · sach. */
function trang(ca) {
  const [loai, i] = ca.split("-");
  const t = TEN[Number(i)] ?? "";
  const than =
    loai === "chu" ? `<p>Bảng nguồn ${esc(t)} hôm nay</p>`
    : loai === "title" ? `<p><span title="${esc(t)}">mục</span></p>`
    : loai === "tierA" ? `<p>Nguồn: <span data-tier-a title="${esc(TEN[0])}">${esc(TEN[0])}</span></p>`
    : `<p>Bảng sạch</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>Chất lượng</h1>${than}</body></html>`;
}

let base;
let server;
let dir;
// Máy chủ giả chạy ở tiến trình CON: capture() gọi playwright-cli bằng execFileSync (chặn vòng sự kiện của tiến trình này),
// nên máy chủ cùng tiến trình sẽ không trả lời được trình duyệt.
const SERVER_SRC = `
const http = require("node:http");
const [PASSWORD, COOKIE, PAGES] = JSON.parse(process.argv[1]);
const s = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/login" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end('<form><input type="hidden" name="$ACTION_ID_abc123"/></form>');
  }
  if (u.pathname === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      if (body.includes(PASSWORD)) res.writeHead(303, { location: "/ops", "set-cookie": "oi_session=" + COOKIE + "; Path=/; HttpOnly; SameSite=Lax" });
      else res.writeHead(200);
      res.end();
    });
    return;
  }
  if (u.pathname.startsWith("/ops")) {
    if (!String(req.headers.cookie || "").includes("oi_session=" + COOKIE)) { res.writeHead(302, { location: "/login" }); return res.end(); }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(PAGES[u.searchParams.get("ca") || "sach"] || PAGES.sach);
  }
  res.writeHead(404); res.end();
});
s.listen(0, "127.0.0.1", () => console.log(s.address().port));
`;
before(async () => {
  execFileSync("playwright-cli", ["--version"], { stdio: "ignore" }); // thiếu → ném, cả tệp đỏ
  dir = mkdtempSync(path.join(tmpdir(), "uc-browser-"));
  const pages = Object.fromEntries(
    ["sach", "tierA", ...[0, 1, 2].flatMap((i) => [`chu-${i}`, `title-${i}`])].map((ca) => [ca, trang(ca)]),
  );
  server = spawn(process.execPath, ["-e", SERVER_SRC, JSON.stringify([PASSWORD, COOKIE, pages])], { stdio: ["ignore", "pipe", "inherit"] });
  const port = await new Promise((resolve, reject) => {
    server.stdout.once("data", (d) => resolve(String(d).trim()));
    server.once("exit", (c) => reject(new Error(`máy chủ giả thoát ${c}`)));
  });
  base = `http://127.0.0.1:${port}`;
});
after(() => {
  server?.kill(); // before() ném khi thiếu playwright-cli thì server chưa có — đừng để hook dọn dẹp tự đỏ (AU11)
  rmSync(dir, { recursive: true, force: true });
});

let n = 0;
/** Chạy capture thật cho một ca; trả mã, đường ảnh và đầu ra gộp. */
async function chup(ca) {
  const session = `uc-browser-${process.pid}-${++n}`;
  const out = path.join(dir, `${ca}.png`);
  const logs = [];
  const code = await capture({
    url: `${base}/ops/x?ca=${ca}`,
    out,
    env: {},
    run: (args) => execFileSync("playwright-cli", [`-s=${session}`, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    ensureAccount: () => {},
    readCred: () => ({ email: EMAIL, password: PASSWORD }),
    tierANames: () => TEN,
    log: (s) => logs.push(String(s)),
    err: (s) => logs.push(String(s)),
  });
  return { code, out, all: logs.join("\n") };
}
const coTen = (s) => TEN.some((t) => s.toLowerCase().includes(t.toLowerCase()));

test("UC-BR-6 tên lộ trong chữ hay thuộc tính → mã 5, không ảnh, đầu ra không có tên", { timeout: 300_000 }, async () => {
  for (const loai of ["chu", "title"]) {
    for (let i = 0; i < TEN.length; i++) {
      const r = await chup(`${loai}-${i}`);
      assert.equal(r.code, 5, `${loai}-${i}: ${r.all}`);
      assert.ok(!existsSync(r.out), `${loai}-${i}: vẫn ghi ảnh`);
      assert.ok(!coTen(r.all) && !r.all.includes(PASSWORD) && !r.all.includes(COOKIE), `${loai}-${i}: đầu ra lộ`);
    }
  }
});

test("UC-BR-6 đối chứng dương: trang không tên → mã 0, có ảnh", { timeout: 120_000 }, async () => {
  const r = await chup("sach");
  assert.equal(r.code, 0, r.all);
  assert.ok(existsSync(r.out) && statSync(r.out).size > 0, "không có ảnh");
});

test("UC-BR-3 tên chỉ trong [data-tier-a] (chữ + title) → được che, mã 0, có ảnh", { timeout: 120_000 }, async () => {
  const r = await chup("tierA");
  assert.equal(r.code, 0, r.all);
  assert.ok(existsSync(r.out) && statSync(r.out).size > 0, "không có ảnh");
  assert.match(r.all, /tầng A: đã che 1/);
  assert.ok(!coTen(r.all), "đầu ra lộ tên");
});
