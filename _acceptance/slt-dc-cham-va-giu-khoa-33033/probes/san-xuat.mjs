// san-xuat.mjs — AC-7 (đo SAU gộp, chỉ đọc log máy thu): bốn bước transform-zalo liền nhau của lượt nạp 15′ sau mốc gộp.
//   node san-xuat.mjs --tu-dong <số dòng s03-nap-15phut.log lúc kéo main> --chotot-tu-dong <số dòng chotot.log lúc kéo main>
//                     --gop-luc <ISO lúc kéo main>   [--log …] [--log-chotot …]
// Đạt: (1) đủ 4 bước transform-zalo sau mốc, mọi bước mã 0, trung vị ≤ 123 s, không bước nào > 300 s (dấu kế hoạch lật);
// (2) bước transform-chotot đầu sau mốc mã 0, ≤ 400 s; (3) rút «thay-boi-luot» mỗi nguồn 2 giờ sau mốc ≤ 3 × 2 giờ trước + 100
// (DB máy thu, phiên chỉ đọc). In «SAN XUAT OK».
// Tự kiểm hai chiều trên log giả trước khi đọc log thật.
import { readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RE = /^JOB STEP \[zalo-import-daily\] bước transform-zalo mã (\d+) giây (\d+)/;
export function xet(dong) {
  const b = dong.map((l) => RE.exec(l)).filter(Boolean).map((m) => ({ ma: +m[1], giay: +m[2] })).slice(0, 4);
  if (b.length < 4) return { ok: false, ly_do: `chưa đủ 4 bước transform-zalo sau mốc (có ${b.length})` };
  const g = b.map((x) => x.giay).sort((a, c) => a - c), tv = (g[1] + g[2]) / 2;
  if (b.some((x) => x.ma !== 0)) return { ok: false, ly_do: `có bước mã khác 0: ${JSON.stringify(b)}` };
  if (g[3] > 300) return { ok: false, ly_do: `LAT: bước ${g[3]} s > 300 s` };
  if (tv > 123) return { ok: false, ly_do: `trung vị ${tv} s > 123 s` };
  return { ok: true, ly_do: `bốn bước ${b.map((x) => x.giay).join(", ")} s · trung vị ${tv} s` };
}
const S = (s) => `JOB STEP [zalo-import-daily] bước transform-zalo mã 0 giây ${s} nhanh 1`;
const lanh = xet([S(70), "x", S(80), S(100), S(69)]), pha = xet([S(70), S(400), S(80), S(90)]);
if (!lanh.ok || pha.ok || !/LAT/.test(pha.ly_do)) { console.log(`TU KIEM HONG: lành ${JSON.stringify(lanh)} · phá ${JSON.stringify(pha)}`); process.exit(2); }
console.log("tự kiểm: log lành đạt, log có bước 400 s đỏ «LAT»");

const a = process.argv.slice(2), arg = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const tu = Number(arg("--tu-dong")), tuC = Number(arg("--chotot-tu-dong")), gop = new Date(arg("--gop-luc") ?? "x");
if (!Number.isInteger(tu) || !Number.isInteger(tuC) || Number.isNaN(gop.getTime())) {
  console.log("san-xuat: cần --tu-dong <n> --chotot-tu-dong <n> --gop-luc <ISO> (ghi trong ap-may-thu.md)"); process.exit(2);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const chung = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: here }).toString().trim();
const logs = path.join(path.dirname(chung), "pipeline/logs");
const loi = [];
const kq = xet(readFileSync(arg("--log") ?? path.join(logs, "s03-nap-15phut.log"), "utf8").split("\n").slice(tu));
console.log(`transform-zalo: ${kq.ly_do}`); if (!kq.ok) loi.push("transform-zalo");
const RC = /^JOB STEP \[chotot-daily\] bước transform-chotot mã (\d+) giây (\d+)/;
const bc = readFileSync(arg("--log-chotot") ?? path.join(logs, "chotot.log"), "utf8").split("\n").slice(tuC).map((l) => RC.exec(l)).find(Boolean);
if (!bc) { console.log("transform-chotot: chưa có bước sau mốc"); loi.push("transform-chotot"); }
else { console.log(`transform-chotot: mã ${bc[1]} · ${bc[2]} s`); if (+bc[1] !== 0 || +bc[2] > 400) loi.push("transform-chotot"); }
const pg = createRequire(path.join(path.dirname(chung), "app/package.json"))("pg");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const { rows } = await c.query(
  `SELECT split_part(subject_key, ':', 1) AS nguon,
          count(*) FILTER (WHERE retracted_at >= $1::timestamptz - interval '2 hours' AND retracted_at < $1)::int AS truoc,
          count(*) FILTER (WHERE retracted_at >= $1 AND retracted_at < $1::timestamptz + interval '2 hours')::int AS sau
     FROM field_assertions WHERE retract_reason = 'thay-boi-luot' AND retracted_at >= $1::timestamptz - interval '2 hours'
    GROUP BY 1 ORDER BY 1`, [gop.toISOString()]);
await c.end();
for (const r of rows) {
  const vuot = r.sau > 3 * r.truoc + 100;
  console.log(`rút thay-boi-luot ${r.nguon}: 2 giờ trước ${r.truoc} · 2 giờ sau ${r.sau}${vuot ? " · VUOT" : ""}`);
  if (vuot) loi.push(`rut-${r.nguon}`);
}
console.log(loi.length ? `SAN XUAT DO — ${loi.join(", ")}` : "SAN XUAT OK");
process.exit(loi.length ? 1 : 0);
