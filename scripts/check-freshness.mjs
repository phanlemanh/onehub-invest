#!/usr/bin/env node
/**
 * check-freshness.mjs — DQO freshness SLO (ADR-0007): exit 1 khi có nguồn quá hạn / chưa có dữ liệu /
 * chưa khai SLO; POST $WEBHOOK_URL khi đặt. Query thẳng DB (không phụ thuộc app server) — chạy được từ
 * cron/launchd độc lập.
 *
 * Định nghĩa độ tươi nằm ở `scripts/lib/freshness.mjs` — mỗi mã đọc bảng nạp thật của nó và tính tuổi theo
 * GIỜ THU (không theo `captured_at` của bảng stg — importer ghi giờ nạp vào cột đó):
 *   S01 ≤ 8 ngày   airbnb_snapshots.collected_at (mọi luồng thu của S01 gộp lần mới nhất)
 *   S02 ≤ 35 ngày  airdna_markets.captured_at (giờ tải của lần thu)
 *   S03 ≤ 3 ngày   airbnb_snapshots.collected_at của snapshot chứa bài S03 (stg_zalo_posts, tách khỏi S05 theo agent_id)
 *   S05 ≤ 12 giờ   airbnb_snapshots.collected_at của snapshot chứa bài S05 (stg_zalo_posts, agent_id của S05)
 *   S06 ≤ 36 giờ   airbnb_snapshots.collected_at của snapshot chứa tin stg_chotot_ads
 *   S04            không đo — địa giới đã thu xong (status completed)
 * Mỗi nguồn chỉ được đo ở thành phố nó thật sự có dữ liệu. Đầu ra chỉ mang mã S0x (SPL).
 *
 * Cờ: --json (in mảng hàng {code, city, last, ageHours, sloHours, status} ra stdout)
 *     --now <ISO> (mốc tính tuổi; mặc định giờ hiện tại) · --schema <tên> (đặt search_path — để soi/đo)
 */
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, isBad, readFreshness } from "./lib/freshness.mjs";

/** Chạy kiểm trên một client đã kết nối. Trả { exitCode, stdout, stderr, bad }. */
export async function runCheck(client, { now = new Date(), json = false } = {}) {
  const rows = await readFreshness(client, { now });
  const bad = rows.filter(isBad);
  const stdout = [];
  const stderr = [];
  if (json) stdout.push(JSON.stringify(rows, null, 2));
  if (bad.length > 0) {
    stderr.push(`⚠️ One Invest freshness SLO: ${bad.length} ô quá hạn/thiếu:`, ...bad.map(describe));
  } else if (!json) {
    stdout.push(`freshness OK — ${rows.length} ô (mã/thành phố) trong SLO`);
  }
  return { exitCode: bad.length > 0 ? 1 : 0, stdout, stderr, bad };
}

function parseArgs(argv) {
  const opt = { json: false, now: new Date(), schema: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") opt.json = true;
    else if (argv[i] === "--now") opt.now = new Date(argv[++i]);
    else if (argv[i] === "--schema") opt.schema = argv[++i];
    else throw new Error(`cờ lạ: ${argv[i]}`);
  }
  if (Number.isNaN(opt.now.getTime())) throw new Error("--now không phải mốc thời gian ISO");
  if (opt.schema !== null && !/^[a-z_][a-z0-9_]*$/.test(opt.schema)) throw new Error("--schema sai khuôn tên");
  return opt;
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  // Root repo không có node_modules — resolve pg từ app/ (CJS interop)
  const require = createRequire(new URL("../app/package.json", import.meta.url));
  const pg = require("pg");
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const client = new pg.Client({ connectionString: url });
  let result;
  try {
    await client.connect();
    if (opt.schema) await client.query(`SET search_path TO "${opt.schema}"`);
    result = await runCheck(client, opt);
  } finally {
    await client.end();
  }
  for (const l of result.stdout) console.log(l);
  for (const l of result.stderr) console.error(l);
  if (result.exitCode !== 0 && process.env.WEBHOOK_URL) {
    await fetch(process.env.WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: result.stderr.join("\n") }),
    }).catch(() => {}); // webhook fail không che mất exit code
  }
  process.exit(result.exitCode);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
