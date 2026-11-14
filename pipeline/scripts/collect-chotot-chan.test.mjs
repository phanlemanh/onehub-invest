// collect-chotot-chan.test.mjs — test 403/429 DỪNG CẢ LƯỢT của collect-chotot (1411-20 MỞ LẠI).
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_s06_chan --chay node --test pipeline/scripts/collect-chotot-chan.test.mjs
// Server giả ở CHILD PROCESS riêng (spawnSync collect chặn event loop — server cùng process không serve được);
// server ghi số lời xuống tệp (SODEM_TEP) để test khẳng định 429 KHÔNG thử lại. DB suite db-thu cấp (collect cần
// vong-doi đọc vùng S06). Ca: hanoi hết trang tự nhiên (vùng XONG → snapshot); hcmc 429 ở trang 2 → rc 3,
// snapshot phần đã có của vùng đang chạy. CA ĐỎ: bỏ dòng «ch.dungLuot = true» (hoặc nhánh ném qua trong
// fetchPage) → 429 bị thử lại 3 lần + fail-soft bỏ feed → số lời và rc lệch → cả hai ca dưới đây đỏ.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(REPO, "pipeline", "collect-chotot.mjs");
const DB = process.env.DATABASE_URL ?? "";
if (!DB) { console.log("collect-chotot-chan: bỏ qua — thiếu DATABASE_URL (chạy lẻ qua db/db-thu.sh … --chay)"); process.exit(0); }
const tenDb = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb)) {
  console.error(`collect-chotot-chan: từ chối DB '${tenDb || "?"}' — chỉ chạy trên DB thử oneinvest_suite_* (1411-11)`);
  process.exit(2);
}

// CA-ĐỎ tĩnh: hai dòng then chốt phải còn trong mã — ai bỏ thì ca động dưới đây đỏ theo.
const nguon = readFileSync(SCRIPT, "utf8");
test("CA-ĐỎ tĩnh: fetchPage còn gắn dungLuot và còn nhánh ném ngay 403/429", () => {
  assert.match(nguon, /ch\.dungLuot = true;/, "fetchPage phải gắn dungLuot khi 403/429");
  assert.match(nguon, /if \(e\.dungLuot\) throw e;/, "catch trong fetchPage phải ném qua ngay dungLuot");
  assert.match(nguon, /if \(e\.dungLuot\) \{/, "main phải bắt dungLuot để dừng cả lượt");
});

// Server giả: hanoi (region_v2=12000) hết trang sau trang 1; hcmc (region_v2=13000) trả 429 từ trang 2.
// Seed theo (region, cg, st) — mỗi feed một dải list_id để đếm distinct chuẩn. Ghi số lời xuống SODEM_TEP.
const SERVER_CODE = `
const http = require("node:http");
const fs = require("node:fs");
const adsGia = (n, seed) => Array.from({ length: n }, (_, i) => ({ list_id: seed + i + 1 }));
let dem = 0;
const ghiDem = () => { if (process.env.SODEM_TEP) fs.writeFileSync(process.env.SODEM_TEP, String(dem)); };
const server = http.createServer((req, res) => {
  dem++; ghiDem();
  const url = new URL(req.url, "http://x");
  const page = Number(url.searchParams.get("page") ?? 1);
  const hcmc = url.searchParams.get("region_v2") === "13000";
  const cg = url.searchParams.get("cg") ?? "1000";
  const st = url.searchParams.get("st") ?? "s";
  const seed = (hcmc ? 200000 : 100000) + (cg === "1010" ? 50000 : 0) + (st === "u" ? 25000 : 0);
  if (hcmc && page >= 2) { res.writeHead(429); res.end("{}"); return; }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ads: page === 1 ? adsGia(50, seed) : [], total: page === 1 ? 50 : 0 }));
});
server.listen(0, "127.0.0.1", () => console.log("CONG=" + server.address().port));
process.on("SIGTERM", () => process.exit(0));
setInterval(() => {}, 10000);
`;

test("429 ở trang 2 → fetch đúng 10 lời (không thử lại), rc 3, snapshot vùng xong trước + phần đã có của vùng đang chạy", async () => {
  const snapRoot = mkdtempSync(join(tmpdir(), "s06-chan-"));
  mkdirSync(snapRoot, { recursive: true });
  const tepDem = join(snapRoot, "so-dem.txt");
  const serverCon = spawn(process.execPath, ["-e", SERVER_CODE], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, SODEM_TEP: tepDem } });
  try {
    const cong = await new Promise((giai, loi) => {
      const bao = setTimeout(() => loi(new Error("server giả không lên cổng")), 10_000);
      serverCon.stdout.on("data", (d) => {
        const m = String(d).match(/CONG=(\d+)/);
        if (m) { clearTimeout(bao); giai(Number(m[1])); }
      });
    });
    const r = spawnSync("node", [SCRIPT, "--pages", "3"], {
      encoding: "utf8", timeout: 120_000,
      env: {
        ...process.env,
        CHOTOT_API: `http://127.0.0.1:${cong}/v1/public/ad-listing`,
        CHOTOT_REGIONS: "hanoi,hcmc",
        CHOTOT_JITTER: "0",
        CHOTOT_SNAP_ROOT: snapRoot,
      },
    });
    // fetch đếm: hanoi 4 feed × 2 lời (trang 1 + trang 2 hết) = 8; hcmc 2 lời (trang 1 + 429 không thử lại) = 10
    const soLoi = Number(readFileSync(tepDem, "utf8").trim());
    assert.equal(soLoi, 10, `fetch chỉ được gọi 10 lần (429 KHÔNG thử lại) — thực tế ${soLoi}`);
    assert.equal(r.status, 3, `tiến trình thoát mã 3 — thực tế ${r.status}: stderr=${(r.stderr || "").slice(0, 200)}`);
    assert.match(r.stderr, /DỪNG CẢ LƯỢT/, "in lời dừng cả lượt");
    // hai snapshot: hanoi (vùng xong trước chặn — trả lời câu 3 của 1411-20: vùng xong trước ĐƯỢC ghi)
    // + hcmc (phần đã có của vùng đang chạy)
    for (const city of ["hanoi", "hcmc"]) {
      const thuMuc = readdirSync(join(snapRoot, city)).filter((d) => d.startsWith(`${city}__chotot-ads__`));
      assert.equal(thuMuc.length, 1, `${city} có đúng 1 snapshot`);
      const items = JSON.parse(gunzipSync(readFileSync(join(snapRoot, city, thuMuc[0], "items-0001.json.gz"))).toString("utf8"));
      const ky = city === "hanoi" ? 200 : 50;
      assert.equal(items.length, ky, `${city}: snapshot ${ky} ads (hanoi 4 feed × 50; hcmc phần đã có 1 feed × 50)`);
    }
  } finally {
    serverCon.kill("SIGTERM");
    rmSync(snapRoot, { recursive: true, force: true });
  }
});
