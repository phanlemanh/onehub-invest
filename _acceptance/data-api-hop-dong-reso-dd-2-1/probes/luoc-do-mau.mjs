#!/usr/bin/env node
// luoc-do-mau.mjs — PB2 AC-9 (eval E9): lược đồ mẫu của data-api bản công khai dựng được trên DB rỗng và mọi đường trả 200.
//  1. data-api/db chỉ còn schema.sql; seed.sql không có câu chèn nào vào bảng S02 (airdna_*, area_sources).
//  2. DB rỗng tạm oneinvest_suite_pb2_<pid> trên PostGIS của máy: áp schema.sql rồi seed.sql — không lỗi.
//  3. Gọi các đường bằng app.request() của data-api (tiến trình con tsx, DATABASE_URL trỏ DB tạm, NODE_ENV=test): đường sống
//     200, /v1/listings mỗi kind ≥ 1, ?minBelowMedianPct=0 ≥ 1; /v1/deals, /v1/asset-stats 410.
//  4. Chiều đỏ cùng lượt: lược đồ mẫu ở nền (data-api/db + seed.sql trước PB2) trên một DB tạm khác phải lỗi — áp lỗi, hoặc
//     đường căn giá tốt hôm nay không 200 trên lược đồ đó.
// DB tạm bị xoá cuối lượt kể cả khi lỗi. Máy chủ: DATABASE_URL (chỉ dùng để CREATE/DROP DB tạm), mặc định PostGIS :5433 local.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const pg = createRequire(path.join(ROOT, "app", "package.json"))("pg");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const gitOk = (...a) => { try { git(...a); return true; } catch { return false; } };
const QUAN = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const urlDb = (db) => { const u = new URL(QUAN); u.pathname = `/${db}`; return u.toString(); };

const DUONG = [
  ["/health", 200], ["/v1/listings?kind=sale", 200, 1], ["/v1/listings?kind=rent_lt", 200, 1], ["/v1/listings?kind=rent_st", 200, 1],
  ["/v1/listings?minBelowMedianPct=0", 200, 1], ["/v1/markets", 200], ["/v1/markets/vn-hanoi", 200], ["/v1/markets/vn-hanoi/submarkets", 200],
  ["/v1/markets/vn-hanoi/insights", 200], ["/v1/price-stats?market=vn-hanoi", 200], ["/v1/coverage", 200], ["/v1/deals", 410], ["/v1/asset-stats", 410],
];

/** Gọi các đường trên một DB; trả [{duong, status, n}]. */
function goiDuong(db, duong) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb2-ld-"));
  try {
    const f = path.join(tam, "goi.mts");
    writeFileSync(f, `process.env.NODE_ENV = "test"; delete process.env.DATA_API_KEYS;
const { default: app } = await import(${JSON.stringify(path.join(ROOT, "data-api", "src", "app.ts"))});
const { pool } = await import(${JSON.stringify(path.join(ROOT, "data-api", "src", "db", "client.ts"))});
const ra = [];
for (const d of ${JSON.stringify(duong)}) {
  const r = await app.request(d); let n = null;
  try { const j = await r.json(); n = Array.isArray(j.data) ? j.data.length : null; } catch {}
  ra.push({ duong: d, status: r.status, n });
}
await pool.end();
console.log("KQ " + JSON.stringify(ra));
`);
    const r = spawnSync("npx", ["tsx", f], {
      cwd: path.join(ROOT, "data-api"), encoding: "utf8", maxBuffer: 64 << 20,
      // NODE_ENV=test trong runner → listingKey dùng khoá thử sẵn có của data-api (src/lib/listing-key.ts), không đặt khoá ở đây.
      env: (() => { const e = { ...process.env, DATABASE_URL: urlDb(db) }; delete e.LISTING_KEY_SECRET; delete e.VERCEL; return e; })(),
    });
    const dong = (r.stdout ?? "").split("\n").find((l) => l.startsWith("KQ "));
    if (!dong) throw new Error(`không gọi được đường: ${(r.stderr ?? "").split("\n").slice(-5).join(" | ")}`);
    return JSON.parse(dong.slice(3));
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}

/** Dựng DB tạm, áp danh sách tệp SQL (mỗi tệp một lượt query), trả lỗi đầu tiên (hoặc null) rồi gọi fn(db) trước khi xoá DB. */
async function voiDb(nhan, sqls, fn) {
  const db = `oneinvest_suite_pb2_${nhan}_${process.pid}`;
  const quan = new pg.Client({ connectionString: QUAN });
  await quan.connect();
  try {
    await quan.query(`DROP DATABASE IF EXISTS ${db}`);
    await quan.query(`CREATE DATABASE ${db}`);
    const c = new pg.Client({ connectionString: urlDb(db) });
    c.on("error", () => {});
    await c.connect();
    let loi = null;
    try {
      for (const [ten, sql] of sqls) {
        try { await c.query(sql); } catch (e) { loi ??= `${ten}: ${e.code ?? "?"} ${String(e.message).slice(0, 80)}`; }
      }
    } finally {
      await c.end().catch(() => {});
    }
    return await fn(db, loi);
  } finally {
    await quan.query(`DROP DATABASE IF EXISTS ${db}`).catch(() => {});
    await quan.end();
  }
}

let sai = 0;
const bao = (dung, dong) => { console.log(dong); if (!dung) sai++; };

// 1. Tệp
const tepDb = readdirSync(path.join(ROOT, "data-api", "db")).sort();
bao(tepDb.length === 1 && tepDb[0] === "schema.sql", `db: ${tepDb.length === 1 && tepDb[0] === "schema.sql" ? "chỉ schema.sql" : `còn ${tepDb.join(", ")}`}`);
const seed = readFileSync(path.join(ROOT, "data-api", "seed.sql"), "utf8");
const chenS02 = [...seed.matchAll(/INSERT\s+INTO\s+(airdna_[a-z_]+|area_sources)\b/gi)].length;
bao(chenS02 === 0, `seed: ${chenS02} câu chèn vào bảng S02`);

// 2–3. Lược đồ mẫu hôm nay
const schema = readFileSync(path.join(ROOT, "data-api", "db", "schema.sql"), "utf8");
await voiDb("moi", [["schema.sql", schema], ["seed.sql", seed]], async (db, loi) => {
  bao(!loi, `ap: ${loi ? `lỗi ${loi}` : "schema.sql rồi seed.sql không lỗi"}`);
  if (loi) return;
  const kq = goiDuong(db, DUONG.map((d) => d[0]));
  for (const [d, mong, toiThieu] of DUONG) {
    const k = kq.find((x) => x.duong === d);
    const dung = k && k.status === mong && (toiThieu === undefined || (k.n ?? 0) >= toiThieu);
    bao(dung, `${d} ${k?.status}${k?.n === null || k?.n === undefined ? "" : ` (${k.n} phần tử)`}${dung ? "" : ` — mong ${mong}${toiThieu ? `, ≥ ${toiThieu} phần tử` : ""}`}`);
  }
});

// 4. Chiều đỏ: lược đồ mẫu ở nền (trước PB2).
const ung = [git("merge-base", "HEAD", "origin/main").trim()];
if (gitOk("rev-parse", "--verify", "-q", "origin/fix/data-api-don-ten-nguon")) ung.push(git("merge-base", "HEAD", "origin/fix/data-api-don-ten-nguon").trim());
const nen = ung.find((c) => ung.every((d) => d === c || gitOk("merge-base", "--is-ancestor", d, c))) ?? ung[0];
const cu = git("ls-tree", "--name-only", `${nen}:data-api/db`).split("\n").filter((n) => n.endsWith(".sql")).sort()
  .map((n) => [n, git("show", `${nen}:data-api/db/${n}`)]);
cu.push(["seed.sql", git("show", `${nen}:data-api/seed.sql`)]);
await voiDb("cu", cu, async (db, loi) => {
  if (loi) { console.log(`luoc-do: bản cũ đỏ: áp lỗi ${loi}`); return; }
  const k = goiDuong(db, ["/v1/listings?minBelowMedianPct=0"])[0];
  if (k.status !== 200) { console.log(`luoc-do: bản cũ đỏ: /v1/listings?minBelowMedianPct=0 ${k.status}`); return; }
  console.log("luoc-do: thước không đỏ ở ban-cu");
  sai++;
});

if (sai) { console.log(`luoc-do: ${sai} ô sai`); process.exit(1); }
console.log(`luoc-do: nền ${nen.slice(0, 9)}; lược đồ mẫu hôm nay dựng sạch, ${DUONG.length} đường đúng mã; bản cũ đỏ`);
