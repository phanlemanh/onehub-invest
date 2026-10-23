// collect-chotot.mjs — Adapter nguồn S06 "Chợ Tốt" (gateway API công khai).
//
// Vai trò trong kiến trúc (docs/research/investment-pipeline-4-stages.md):
//   VẢI CÔNG KHAI tầng P2 — thước median giá/m² + trend theo ngày + giá thuê LTR.
//   KHÔNG phải nguồn contact (phone=null ở list API — reveal per-ad là việc khác).
//
// Cách hoạt động: GET gateway.chotot.com/v1/public/ad-listing (không auth),
// ghi raw snapshot ĐÚNG DATA-CONTRACT (schemaVersion 1, gzip + sha256 manifest)
// vào collector/snapshots/<city>/ — cùng format SnapshotWriter để import-chotot
// tiêu thụ. KHÔNG qua /agent-report (đó là luồng tin text Zalo/FB).
//
// CCP: jitter 0,6–1,8s giữa page + xoay User-Agent + cap pages/feed.
// Chạy:  node collect-chotot.mjs [--pages N] [--dry]
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAP_ROOT = process.env.CHOTOT_SNAP_ROOT ?? join(ROOT, "collector", "snapshots");
const API = "https://gateway.chotot.com/v1/public/ad-listing";
const LIMIT = 50; // page nhỏ = request đều nhau theo nhịp người duyệt web

// Regions đọc từ DB (source_groups, quản trị /ops/sources) — thêm tỉnh mới
// (Đà Nẵng, Hải Phòng…) không cần sửa code. Fallback 2 thành phố cũ.
const FALLBACK_REGIONS = [
  { region_v2: 12000, city: "hanoi", cityCode: "vn-hanoi" },
  { region_v2: 13000, city: "hcmc", cityCode: "vn-hcmc" },
];

async function loadRegions() {
  try {
    const pg = (await import("pg")).default;
    const c = new pg.Client({
      connectionString:
        process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
    });
    await c.connect();
    const { rows } = await c.query(
      `SELECT group_key, name, params FROM source_groups
       WHERE source_code = 'S06' AND enabled ORDER BY id`,
    );
    await c.end();
    const regions = rows
      .filter((r) => r.params?.region_v2)
      .map((r) => ({ region_v2: r.params.region_v2, city: r.group_key, cityCode: r.params.cityCode }));
    if (regions.length === 0) throw new Error("0 region bật");
    return regions;
  } catch (e) {
    console.warn(`⚠ source_groups DB fail (${e.message}) — fallback ${FALLBACK_REGIONS.length} region`);
    return FALLBACK_REGIONS;
  }
}
// cg=1000 nhà đất | cg=1010 căn hộ; st=s bán | st=u thuê (type từng ad là
// chân lý — feed chỉ quyết định page nào duyệt).
const FEEDS = [
  { cg: 1000, st: "s", note: "nhà đất bán" },
  { cg: 1010, st: "s", note: "căn hộ bán" },
  { cg: 1000, st: "u", note: "nhà đất thuê" },
  { cg: 1010, st: "u", note: "căn hộ thuê" },
];

const UAS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = () => sleep(600 + Math.random() * 1200);
const ua = () => UAS[Math.floor(Math.random() * UAS.length)];

function argPages() {
  const i = process.argv.indexOf("--pages");
  return i > 0 ? parseInt(process.argv[i + 1]) : parseInt(process.env.CHOTOT_MAX_PAGES ?? "25");
}
const MAX_PAGES = Number.isFinite(argPages()) ? argPages() : 25;
const DRY = process.argv.includes("--dry");

async function fetchPage(regionV2, feed, page) {
  const url = `${API}?region_v2=${regionV2}&cg=${feed.cg}&st=${feed.st}&o=${page * LIMIT}&page=${page}&limit=${LIMIT}&key_param_included=true`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": ua(), accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return body.ads ?? [];
    } catch (e) {
      if (attempt === 3) throw new Error(`page ${page}: ${e.message} (đã thử ${attempt} lần)`);
      await sleep(1500 * attempt);
    }
  }
}

async function writeSnapshot(city, items, coverage) {
  const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 17);
  const snapshotId = `${city}__chotot-ads__${ts}`;
  const dir = join(SNAP_ROOT, city, snapshotId);
  await mkdir(dir, { recursive: true });
  const files = [];
  for (let i = 0; i < items.length; i += 1000) {
    const name = `items-${String(files.length + 1).padStart(4, "0")}.json.gz`;
    const gz = gzipSync(JSON.stringify(items.slice(i, i + 1000)));
    await writeFile(join(dir, name), gz);
    files.push({ name, sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length });
  }
  const manifest = {
    schemaVersion: 1,
    snapshotId,
    city,
    source: "chotot-ads",
    startedAt: coverage.startedAt,
    finishedAt: new Date().toISOString(),
    counts: { items: items.length, failed: coverage.failed },
    coverage: { discovered: coverage.discovered, captured: items.length, failed: coverage.failed, methods: { gatewayApi: items.length }, notes: coverage.notes },
    files,
  };
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  const startedAt = new Date().toISOString();
  let REGIONS = await loadRegions();
  if (process.env.CHOTOT_REGIONS) {
    REGIONS = REGIONS.filter((r) => process.env.CHOTOT_REGIONS.split(",").includes(r.city));
  }
  console.log(`regions (source_groups): ${REGIONS.map((r) => r.city).join(", ")}`);
  const failed = [];
  const notes = [];
  for (const region of REGIONS) {
    const items = [];
    for (const feed of FEEDS) {
      let feedCount = 0;
      for (let page = 1; page <= MAX_PAGES; page++) {
        let ads;
        try {
          ads = await fetchPage(region.region_v2, feed, page);
        } catch (e) {
          failed.push(`${region.city}/${feed.note}: ${e.message}`);
          break; // fail-soft: bỏ dư feed này, sang feed kế
        }
        if (ads.length === 0) break; // hết trang — dừng feed
        for (const ad of ads) {
          if (!ad.list_id) continue;
          items.push({
            source: "chotot-ads",
            sourceId: `ct-${ad.list_id}`,
            kind: "ad",
            fetchedAt: new Date().toISOString(),
            payload: ad,
            meta: { city: region.cityCode, region_v2: region.region_v2, cg: feed.cg, st: feed.st, page },
          });
        }
        feedCount += ads.length;
        await jitter();
      }
      notes.push(`${region.city} ${feed.note}: ${feedCount}`);
      console.log(`  ${region.city} ${feed.note}: ${feedCount} ads`);
    }
    // dedup list_id trong snapshot (cùng ad có thể xuất hiện ở 2 feed page cuối)
    const seen = new Set();
    const unique = items.filter((i) => !seen.has(i.sourceId) && seen.add(i.sourceId));
    if (DRY) {
      console.log(`[dry] ${region.city}: ${unique.length} ads (không ghi snapshot)`);
      continue;
    }
    if (unique.length > 0) {
      const m = await writeSnapshot(region.city, unique, { discovered: unique.length, failed: failed.length, notes, startedAt });
      console.log(`✅ ${region.city}: ${unique.length} ads → ${m.snapshotId}`);
    }
  }
  if (failed.length) {
    console.error(`⚠ ${failed.length} lỗi (đã bỏ qua):`);
    for (const f of failed) console.error(`  - ${f}`);
  }
}

// AggregateError (vd ECONNREFUSED khi DB chết) có message rỗng — in đủ
// code + errors để log đêm tự chẩn đoán được (bài học 22/10: 2 dòng "❌"
// trống làm mù nguyên nhân suốt một đêm).
const errDetail = (e) => {
  const parts = [e?.code, e?.message].filter(Boolean);
  if (e instanceof AggregateError && e.errors?.length) {
    parts.push(e.errors.map(String).join("; "));
  }
  if (parts.length === 0) parts.push(e?.stack ?? String(e));
  return parts.join(" — ");
};

main().catch((e) => { console.error("❌", errDetail(e)); process.exit(1); });
