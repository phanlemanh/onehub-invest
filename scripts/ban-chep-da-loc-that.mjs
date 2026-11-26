#!/usr/bin/env node
// ban-chep-da-loc-that.mjs — E9 (AC-9) của HT18: ca dữ liệu thật. Ngoài CI, nặng (long_running).
//   node scripts/ban-chep-da-loc-that.mjs
// 1. Chép DB máy thu thật (CHỈ ĐỌC) → oneinvest_m5_<hôm nay>, che, soát (bộ soát phải 0), dump ra state/ban-chep-m5/ (đúng lệnh chính).
// 2. Dựng data-api trỏ vào bản chép ở cổng trống riêng; gọi `/v1/listings`; in HTTP và số dòng.
// 3. In cỡ dump, số bảng có dòng, số ô che theo bảng.cột, thời gian; dừng data-api, xoá DB đích. Tệp dump + ke.json giữ ở
//    state/ban-chep-m5/ (gitignored).
// Trang Invest KHÔNG đo ở đây: E11 đo qua preview cấu hình app-3467-ban-chep-m5 của .claude/launch.json (GS 25/11 — không chạy
// `next dev` bằng tiến trình nền của lệnh này). Không gọi mạng ngoài: chỉ localhost. Không in giá trị — chỉ số đếm và mã HTTP.
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chayChep, xoaDb, tenDich, dsDbM5, NGUON_MAC_DINH, RA_MAC_DINH } from "./ban-chep-da-loc.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const congTrong = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.unref();
  s.on("error", reject);
  s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

async function choSan(url, { giay = 120 } = {}) {
  const het = Date.now() + giay * 1000;
  while (Date.now() < het) {
    try { const r = await fetch(url); if (r.status > 0) return; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`data-api không lên sau ${giay}s`);
}

/**
 * Bản thật giữ «trần một bản sống»: lượt chép mới xoá bản đang có. E11 (ui-check) dựng bản chép riêng rồi xem qua preview, nên khi E11
 * đang giữ một bản thì E9 chờ tới khi bản đó được dọn (E11 kết thúc bằng --don), tối đa 40′ — không xoá bản người khác đang xem
 * (S4 r2 BLOCKED 26/11: E9 và E11 xoá DB của nhau). Phía E11 chờ tiến trình này kết thúc trước khi chép (bước của E11 trong evals.yaml).
 */
async function choBanKhac({ phut = 40 } = {}) {
  const het = Date.now() + phut * 60_000;
  for (let lan = 0; ; lan++) {
    const ds = await dsDbM5();
    if (!ds.length) return;
    if (Date.now() > het) throw new Error(`còn bản chép khác (${ds.join(", ")}) sau ${phut}′ — không xoá bản người khác đang dùng`);
    if (lan === 0) console.log(`chờ bản chép khác được dọn: ${ds.join(", ")}`);
    await new Promise((r) => setTimeout(r, 20_000));
  }
}

async function main() {
  await choBanKhac();
  const t0 = Date.now();
  const dich = tenDich();
  const nguon = process.env.DATABASE_URL ?? NGUON_MAC_DINH;
  const ma = await chayChep({ nguonUrl: nguon, dich, ra: RA_MAC_DINH });
  if (ma !== 0) { console.error(`E9: bản chép không xanh (mã ${ma})`); return ma; }
  const tChep = Math.round((Date.now() - t0) / 1000);
  const ke = JSON.parse(readFileSync(path.join(RA_MAC_DINH, "ke.json"), "utf8"));
  const coByte = statSync(path.join(RA_MAC_DINH, ke.tep)).size;
  const coDong = Object.values(ke.so_dong).filter((n) => n > 0).length;

  const cong = await congTrong();
  const api = spawn(path.join(REPO, "data-api", "node_modules", ".bin", "tsx"), ["src/index.ts"], {
    cwd: path.join(REPO, "data-api"),
    env: { ...process.env, DATABASE_URL: `postgres://oneinvest:oneinvest@localhost:5433/${dich}`, PORT: String(cong), DATA_API_KEYS: "" },
    detached: true, stdio: ["ignore", "pipe", "pipe"],
  });
  const log = [];
  for (const s of [api.stdout, api.stderr]) s.on("data", (b) => { log.push(b.toString("utf8")); if (log.length > 200) log.shift(); });
  let loi = 0;
  try {
    await choSan(`http://127.0.0.1:${cong}/health`);
    const r = await fetch(`http://127.0.0.1:${cong}/v1/listings?limit=50`);
    const j = r.ok ? await r.json() : null;
    const n = Array.isArray(j?.data) ? j.data.length : 0;
    console.log(`data-api /v1/listings: HTTP ${r.status}, ${n} dòng`);
    if (r.status !== 200 || n <= 0) loi = 1;
  } catch (e) {
    console.error(`E9: ${String(e?.message ?? e).slice(0, 300)}`);
    loi = 1;
  } finally {
    try { process.kill(-api.pid, "SIGTERM"); } catch { /* đã dừng */ }
    await xoaDb(dich).catch(() => console.error(`E9: chưa xoá được ${dich}`));
  }
  if (loi) console.error(`--- đuôi log data-api ---\n${log.join("").slice(-1500)}`);
  const che = Object.entries(ke.o_da_che ?? {}).map(([k, v]) => `${k} ${v}`).join(", ") || "không ô nào";
  console.log(`ô che: ${che}`);
  console.log(`dump ${coByte} byte · ${coDong} bảng có dòng · chép ${tChep}s · tổng ${Math.round((Date.now() - t0) / 1000)}s · DB đích đã xoá`);
  return loi;
}

main().then((c) => { process.exitCode = c; }).catch((e) => {
  console.error(`E9: lỗi — ${String(e?.message ?? e).slice(0, 300)}`);
  process.exit(1);
});
