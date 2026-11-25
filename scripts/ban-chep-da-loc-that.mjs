#!/usr/bin/env node
// ban-chep-da-loc-that.mjs — E9 (AC-9) của HT18: ca dữ liệu thật. Ngoài CI, nặng (long_running) — chỉ lượt chấm s4 chạy.
//   node scripts/ban-chep-da-loc-that.mjs
// 1. Chép DB máy thu thật (CHỈ ĐỌC) → oneinvest_m5_<hôm nay>, soát, dump ra state/ban-chep-m5/ (đúng lệnh chính).
// 2. Dựng data-api và app (RENAME_REFCALIB=1, như cloud) trỏ vào bản chép, ở cổng trống riêng; gọi `/v1/listings` của data-api và
//    trang Invest khu Hà Nội (/vn/hanoi); in HTTP, số dòng, cỡ dump, số bảng có dòng, thời gian.
// 3. Dọn: dừng hai tiến trình (cả nhóm), xoá DB đích. Tệp dump + ke.json giữ ở state/ban-chep-m5/ (gitignored).
// Không gọi mạng ngoài: chỉ localhost. Không in giá trị — chỉ số đếm và mã HTTP.
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chayChep, xoaDb, tenDich, NGUON_MAC_DINH, RA_MAC_DINH } from "./ban-chep-da-loc.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const congTrong = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.unref();
  s.on("error", reject);
  s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

/** Tiến trình nền trong nhóm riêng (giết cả nhóm khi dọn); log gom vào bộ nhớ, chỉ in đuôi khi gãy. */
function nen(cmd, args, { cwd, env }) {
  const p = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  const log = [];
  const gom = (b) => { log.push(b.toString("utf8")); if (log.length > 200) log.shift(); };
  p.stdout.on("data", gom);
  p.stderr.on("data", gom);
  return { p, log };
}
const giet = (t) => { try { process.kill(-t.p.pid, "SIGTERM"); } catch { /* đã dừng */ } };

async function choSan(url, { giay = 240 } = {}) {
  const het = Date.now() + giay * 1000;
  while (Date.now() < het) {
    try { const r = await fetch(url, { redirect: "manual" }); if (r.status > 0) return; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`không lên sau ${giay}s: ${url.replace(/\/\/[^/]+/, "//localhost")}`);
}

async function main() {
  const t0 = Date.now();
  const dich = tenDich();
  const nguon = process.env.DATABASE_URL ?? NGUON_MAC_DINH;
  const ma = await chayChep({ nguonUrl: nguon, dich, ra: RA_MAC_DINH });
  if (ma !== 0) { console.error(`E9: bản chép không xanh (mã ${ma})`); return ma; }
  const tChep = Math.round((Date.now() - t0) / 1000);
  const ke = JSON.parse(readFileSync(path.join(RA_MAC_DINH, "ke.json"), "utf8"));
  const coByte = statSync(path.join(RA_MAC_DINH, ke.tep)).size;
  const coDong = Object.values(ke.so_dong).filter((n) => n > 0).length;

  const url = `postgres://oneinvest:oneinvest@localhost:5433/${dich}`;
  const [cApi, cApp] = [await congTrong(), await congTrong()];
  const api = nen(path.join(REPO, "data-api", "node_modules", ".bin", "tsx"), ["src/index.ts"], {
    cwd: path.join(REPO, "data-api"), env: { DATABASE_URL: url, PORT: String(cApi), DATA_API_KEYS: "" },
  });
  const app = nen(path.join(REPO, "app", "node_modules", ".bin", "next"), ["dev", "-p", String(cApp)], {
    cwd: path.join(REPO, "app"), env: { DATABASE_URL: url, RENAME_REFCALIB: "1", NEXT_TELEMETRY_DISABLED: "1" },
  });
  let loi = 0;
  try {
    await choSan(`http://127.0.0.1:${cApi}/health`);
    const r1 = await fetch(`http://127.0.0.1:${cApi}/v1/listings?limit=50`);
    const j1 = r1.ok ? await r1.json() : null;
    const nApi = Array.isArray(j1?.data) ? j1.data.length : 0;
    console.log(`data-api /v1/listings: HTTP ${r1.status}, ${nApi} dòng`);
    if (r1.status !== 200 || nApi <= 0) loi = 1;

    await choSan(`http://127.0.0.1:${cApp}/`);
    const r2 = await fetch(`http://127.0.0.1:${cApp}/vn/hanoi`);
    const html = await r2.text();
    // Câu tóm tắt và dòng chỉ số của trang Invest: «<số> listing» (fmtInt, dấu chấm nghìn).
    const m = html.match(/([0-9][0-9.]*) listing/);
    const nTrang = m ? Number(m[1].replace(/\./g, "")) : 0;
    const thang = Number(html.match(/([0-9]+) tháng dữ liệu/)?.[1] ?? 0);
    console.log(`app /vn/hanoi: HTTP ${r2.status}, ${nTrang} listing, ${thang} tháng dữ liệu, ${html.length} ký tự`);
    if (r2.status !== 200 || nTrang <= 0) loi = 1;
  } catch (e) {
    console.error(`E9: ${String(e?.message ?? e).slice(0, 300)}`);
    loi = 1;
  } finally {
    giet(api);
    giet(app);
    await xoaDb(dich).catch(() => console.error(`E9: chưa xoá được ${dich}`));
  }
  if (loi) {
    // Đuôi log hai tiến trình để soi — log của app/data-api trên bản chép đã soát, không mang tầng A.
    console.error(`--- đuôi log data-api ---\n${api.log.join("").slice(-1500)}`);
    console.error(`--- đuôi log app ---\n${app.log.join("").slice(-1500)}`);
  }
  console.log(`dump ${coByte} byte · ${coDong} bảng có dòng · chép ${tChep}s · tổng ${Math.round((Date.now() - t0) / 1000)}s · DB đích đã xoá`);
  return loi;
}

main().then((c) => { process.exitCode = c; }).catch((e) => {
  console.error(`E9: lỗi — ${String(e?.message ?? e).slice(0, 300)}`);
  process.exit(1);
});
