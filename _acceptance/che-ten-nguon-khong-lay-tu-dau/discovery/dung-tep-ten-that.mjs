// Dựng lại tệp tên thật S16 cục bộ (tầng A) cho probes/ban-chep.sh từ dữ liệu trên máy — tệp này KHÔNG chứa giá trị nào.
// Nguồn: (1) tên hai từ = trường `source` của manifest bản thu S16 mới nhất trong collector/snapshots («s16-<từ>-<từ>»);
// (2) id cũ = source_ids của dòng S16 trong source_registry máy thu (chỉ đọc); (3) tên miền = tệp tam/s16-mien.txt do làn
// thu ghi (mỗi dòng một tên miền). Ghi tam/s16-ten-that.json quyền 600. Chỉ in số đếm, không in giá trị.
// Chạy: node _acceptance/che-ten-nguon-khong-lay-tu-dau/discovery/dung-tep-ten-that.mjs (từ gốc worktree)
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const goc = path.dirname(path.resolve(execFileSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim()));
const tam = path.join(goc, ".acceptance-runs/dieu-phoi-dot0-cam-mau/tam");
const ra = path.join(tam, "s16-ten-that.json");
const mienTep = path.join(tam, "s16-mien.txt");
const dung = (m) => { console.log(`dừng: ${m}`); process.exit(2); };

const snapGoc = path.join(goc, "collector/snapshots/vn");
const thuMuc = readdirSync(snapGoc).filter((d) => /^vn__s16-/i.test(d)).map((d) => path.join(snapGoc, d));
if (!thuMuc.length) dung("không có bản thu S16");
const moiNhat = (d) => Math.max(...readdirSync(d).map((f) => statSync(path.join(d, f)).mtimeMs));
thuMuc.sort((a, b) => moiNhat(b) - moiNhat(a));
const mf = readdirSync(thuMuc[0]).find((f) => /manifest/i.test(f));
if (!mf) dung("bản thu S16 mới nhất thiếu manifest");
const nguon = String(JSON.parse(readFileSync(path.join(thuMuc[0], mf), "utf8")).source ?? "");
const m = nguon.match(/^s16-([a-z]+)-([a-z]+)$/i);
if (!m) dung("trường source của manifest không có dạng s16-<từ>-<từ>");
const realName = `${m[1]} ${m[2]}`;

const require = createRequire(path.join(goc, "app/package.json"));
const pg = require("pg");
const c = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const dong = (await c.query("SELECT real_name, source_ids FROM source_registry WHERE code = 'S16'")).rows[0];
await c.end();
if (!dong) dung("source_registry không có dòng S16");
const khopRegistry = String(dong.real_name ?? "").toLowerCase().replace(/\s+/g, "") === `${m[1]}${m[2]}`.toLowerCase();
if (!khopRegistry) dung("tên hai từ không khớp real_name của S16 trong source_registry");

if (!existsSync(mienTep)) dung("thiếu tam/s16-mien.txt");
const mien = readFileSync(mienTep, "utf8").split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
if (!mien.length || !mien.every((d) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d))) dung("s16-mien.txt rỗng hoặc có dòng không phải tên miền");

const idCu = (dong.source_ids ?? []).filter(Boolean);
const ids = [...new Set([...idCu, ...mien])];
writeFileSync(ra, JSON.stringify([{ code: "S16", real_name: realName, source_ids: ids }]) + "\n", { mode: 0o600 });
chmodSync(ra, 0o600);
console.log(`đã ghi: ${realName.split(" ").length} từ, ${ids.length} id (${idCu.length} cũ + ${ids.length - idCu.length} mới), ${mien.length} tên miền; khớp source_registry: có; quyền 600`);
