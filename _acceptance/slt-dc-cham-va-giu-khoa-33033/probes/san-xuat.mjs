// san-xuat.mjs — AC-7 (đo SAU gộp, chỉ đọc log máy thu): bốn bước transform-zalo liền nhau của lượt nạp 15′ sau mốc gộp.
//   node san-xuat.mjs --tu-dong <số dòng log lúc kéo main>   [--log <đường log>]
// Đạt: đủ 4 bước sau mốc, mọi bước mã 0, trung vị ≤ 123 s, không bước nào > 300 s (dấu kế hoạch lật). In «SAN XUAT OK».
// Tự kiểm hai chiều trên log giả trước khi đọc log thật.
import { readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
const tu = Number(arg("--tu-dong"));
if (!Number.isInteger(tu) || tu < 0) { console.log("san-xuat: thiếu --tu-dong <số dòng log lúc kéo main> (ghi trong ap-may-thu.md)"); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const chung = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: here }).toString().trim();
const log = arg("--log") ?? path.join(path.dirname(chung), "pipeline/logs/s03-nap-15phut.log");
const kq = xet(readFileSync(log, "utf8").split("\n").slice(tu));
console.log(kq.ok ? `SAN XUAT OK — ${kq.ly_do}` : `SAN XUAT DO — ${kq.ly_do}`);
process.exit(kq.ok ? 0 : 1);
