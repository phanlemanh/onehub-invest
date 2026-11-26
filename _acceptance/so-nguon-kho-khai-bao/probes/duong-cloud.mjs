#!/usr/bin/env node
// duong-cloud.mjs — phép đo sau điền của so-nguon-kho-khai-bao (GS 26/11): số ô trên ĐƯỜNG CLOUD mà tên thật S09, S17 trúng
// bằng findSourceNames — sync-cloud (22 bảng FILL, đúng cột qua selectList + bộ lọc dòng localReadSql, kể cả khoá jsonb) và
// bản tin push-ops-facts (captureOpsFacts: HOME tạm, máy chủ thu 127.0.0.1, không lên cloud). Chỉ in mã, bảng.cột, số đếm —
// không in tên, không in giá trị. DB máy thu: phiên READ ONLY. Một luồng, ~133 s (26/11).
// Danh sách tên: hai tệp cục bộ (tam/s0x-mien.txt, cùng luật đọc tang-a: bỏ dòng «/») khi còn, match_whole theo --whole
// (mặc định S09,S17 — đúng cờ bước điền tra-s09-s17.mjs đặt); đã xoá tệp thì đọc dòng S09, S17 của sổ bằng docSourceNameEntries
// (cờ match_whole thật của dòng).
//   node _acceptance/so-nguon-kho-khai-bao/probes/duong-cloud.mjs [--whole=S09,S17|--whole=] [--ops] [--tran S09=0,S17=0]
// Thoát 1 khi số ô của một mã vượt --tran.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TAM = "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam";
const MA = ["S09", "S17"];
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const { findSourceNames } = await import(path.join(REPO, "pipeline/lib/mask-source-names.mjs"));
const sc = await import(path.join(REPO, "pipeline/sync-cloud.mjs"));
const { docSourceNameEntries } = await import(path.join(REPO, "pipeline/lib/source-name-entries.mjs"));
const pg = createRequire(path.join(REPO, "pipeline/package.json"))("pg");
const DB = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

let entries = [];
let nguon;
const tep = (m) => path.join(TAM, `${m.toLowerCase()}-mien.txt`);
if (MA.every((m) => existsSync(tep(m)))) {
  const wArg = process.argv.find((a) => a.startsWith("--whole="));
  const whole = (wArg ? wArg.slice(8) : "S09,S17").split(",");
  for (const m of MA) {
    const ds = readFileSync(tep(m), "utf8").split("\n").map((x) => x.trim()).filter((x) => x && !x.startsWith("/"));
    for (const t of ds) entries.push({ code: m, realName: t, wholeOnly: whole.includes(m) });
  }
  nguon = `tệp cục bộ, match_whole: ${whole.filter(Boolean).join(",") || "không"}`;
} else {
  const c0 = new pg.Client({ connectionString: DB });
  await c0.connect();
  await c0.query("BEGIN READ ONLY");
  entries = (await docSourceNameEntries(c0)).filter((e) => MA.includes(e.code));
  await c0.query("ROLLBACK");
  await c0.end();
  nguon = `sổ máy thu, match_whole: ${MA.filter((m) => entries.some((e) => e.code === m && e.wholeOnly)).join(",") || "không"}`;
}
console.log(`ten: ${nguon}; muc S09=${entries.filter((e) => e.code === "S09").length} S17=${entries.filter((e) => e.code === "S17").length}`);
if (MA.some((m) => !entries.some((e) => e.code === m))) { console.log("THIEU MUC — không đo được"); process.exit(2); }

const khoaLong = (v) => (Array.isArray(v) ? v.flatMap(khoaLong) : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...khoaLong(x)]) : []);
const maTrung = (s) => new Set(findSourceNames(s, entries).map((h) => h.code));

const dem = new Map(); // "S09 bang.cot" → số ô
const cong = (code, k) => dem.set(`${code} ${k}`, (dem.get(`${code} ${k}`) ?? 0) + 1);

const c = new pg.Client({ connectionString: DB });
await c.connect();
await c.query("BEGIN READ ONLY");
const ro = (await c.query("SHOW transaction_read_only")).rows[0].transaction_read_only;
if (ro !== "on") throw new Error("không READ ONLY");
const t0 = Date.now();
let soDong = 0;
for (const t of sc.FILL) {
  const { rows } = await c.query(
    `SELECT column_name AS c, data_type AS d FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t]);
  if (!rows.length) { console.log(`bo-qua ${t}: khong co bang`); continue; }
  const { cols } = sc.selectList(t, rows.map((r) => r.c));
  const kieu = Object.fromEntries(rows.map((r) => [r.c, r.d]));
  const chu = cols.filter((x) => /text|char|json|ARRAY|USER-DEFINED/.test(kieu[x]) && !/geometry|geography/.test(kieu[x]));
  if (!chu.length) continue;
  const list = chu.map((x) => `"${x}"`).join(", ");
  await c.query(`DECLARE cur NO SCROLL CURSOR FOR ${sc.localReadSql(t, list)}`);
  for (;;) {
    const { rows: rs } = await c.query("FETCH 5000 FROM cur");
    if (!rs.length) break;
    for (const { j } of rs) {
      soDong++;
      const row = JSON.parse(j);
      for (const [k, v] of Object.entries(row)) {
        if (v == null) continue;
        const s = typeof v === "string" ? v : JSON.stringify(v);
        const ma = maTrung(s);
        if (typeof v === "object") for (const kk of khoaLong(v)) for (const m of maTrung(String(kk))) ma.add(m);
        for (const m of ma) cong(m, `${sc.RENAME(t)}.${k}`);
      }
    }
  }
  await c.query("CLOSE cur");
}
await c.query("ROLLBACK");
await c.end();
console.log(`sync-cloud: ${soDong} dong, ${((Date.now() - t0) / 1000).toFixed(0)} s`);

if (process.argv.includes("--ops")) {
  const { captureOpsFacts } = await import(path.join(REPO, "pipeline/scripts/capture-ops-facts.mjs"));
  const { guardValues } = await import(path.join(REPO, "pipeline/lib/tier-a-guard.mjs"));
  const r = await captureOpsFacts({ args: ["--kho"] });
  // --kho không POST; nếu không có payload thì chạy lại không --kho tới máy chủ thu cục bộ (127.0.0.1), không lên cloud.
  const r2 = r.payload ? r : await captureOpsFacts();
  if (!r2.payload) console.log(`ops-facts: khong bat duoc payload (exit ${r2.code})`);
  else {
    const hits = guardValues(r2.payload, entries);
    for (const h of hits) cong(h.code, `ops_facts.${h.path.replace(/\[\d+\]/g, "[]")}`);
    console.log(`ops-facts: exit ${r2.code}, posts ${r2.posts}, ${hits.length} cho trung`);
  }
}

const tong = { S09: 0, S17: 0 };
for (const [k, n] of [...dem].sort((a, b) => b[1] - a[1])) { console.log(`${k} ${n}`); tong[k.slice(0, 3)] += n; }
console.log(`TONG S09=${tong.S09} S17=${tong.S17}`);
const tran = Object.fromEntries((arg("--tran") ?? "").split(",").filter(Boolean).map((x) => x.split("=")).map(([m, n]) => [m, Number(n)]));
const vuot = Object.entries(tran).filter(([m, n]) => tong[m] > n);
if (vuot.length) { console.log(`VUOT TRAN: ${vuot.map(([m, n]) => `${m} ${tong[m]} > ${n}`).join(", ")}`); process.exit(1); }
console.log("DUONG-CLOUD OK");
