// on12-tien-de.mjs — hồ sơ khu-vuc-vung-moi-s06 AC-2 (E2). Tiền đề trước khi chạy ON12-AC-7 trên DB :5433: đếm ảnh chụp S06
// theo khoá thành phố (mã nguồn đọc từ source_registry local theo mã S06 — không ghi tên nguồn thật vào mã, SPL) — ca chỉ đo được hàm khi DB có ít nhất một khoá vùng mới (da-nang). Bằng 0 → thoát 2 (không
// đo được), không báo xanh. Rồi chạy ba ca ON12-AC-7.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "app", "package.json"))("pg");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
const { rows } = await c.query(`SELECT s.city, count(*)::int AS n FROM airbnb_snapshots s
  JOIN source_registry r ON r.code = 'S06' AND s.source = ANY (r.source_ids) GROUP BY s.city ORDER BY s.city`);
await c.end();
console.log(`on12 tiền đề: ảnh chụp S06 theo khoá ${rows.map((r) => `${r.city}=${r.n}`).join(" · ")}`);
const vung = rows.filter((r) => !["hanoi", "hcmc"].includes(r.city));
if (!vung.length) { console.error("on12 tiền đề: DB không có khoá vùng mới nào của S06 — ON12-AC-7 không đo được hàm"); process.exit(2); }
const r = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-name-pattern=ON12-AC-7", "tests/ops-nhan-theo-context.test.tsx"],
  { cwd: path.join(ROOT, "app"), encoding: "utf8", timeout: 600_000 });
const ca = [...(r.stdout + r.stderr).matchAll(/^([✔✖]) (ON12-AC-7[^(]*)/gm)].map((m) => `${m[1]} ${m[2].trim()}`);
console.log(ca.join("\n"));
process.exit(r.status ?? 1);
