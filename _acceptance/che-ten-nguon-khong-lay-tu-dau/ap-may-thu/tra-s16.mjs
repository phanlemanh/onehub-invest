// tra-s16.mjs — bước áp thứ hai: trả dòng S16 về tên hai từ + tên miền với match_whole = true, giá trị đọc từ tệp cục bộ GS cấp
// (CTEN_TEP). Một giao dịch; in số dòng đổi, không in giá trị. Cần 112 đã áp.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const pg = createRequire(path.join(ROOT, "pipeline", "package.json"))("pg");
const TEP = process.env.CTEN_TEP ?? "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s16-ten-that.json";
if (!existsSync(TEP)) { console.log("thiếu tệp cục bộ tên thật S16 — dừng"); process.exit(2); }
const s16 = JSON.parse(readFileSync(TEP, "utf8")).find((r) => r.code === "S16");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("BEGIN");
const r = await c.query("UPDATE source_registry SET real_name = $1, source_ids = $2, match_whole = true WHERE code = 'S16'", [s16.real_name, s16.source_ids]);
if (r.rowCount !== 1) { await c.query("ROLLBACK"); console.log(`số dòng đổi ${r.rowCount} ≠ 1 — lùi, dừng`); process.exit(1); }
await c.query("COMMIT");
await c.end();
console.log("đã trả dòng S16: 1 dòng, match_whole = true");
