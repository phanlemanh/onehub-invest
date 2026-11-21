// tra-s09-s17.mjs — bước điền sau khi áp 122: real_name, source_ids, match_whole cho dòng S09, S17 (122 chèn với real_name NULL,
// source_ids rỗng). Giá trị đọc từ hai tệp cục bộ làn thu ghi (thư mục đợt, `tam/s09-mien.txt`, `tam/s17-mien.txt`, quyền 600):
// dòng 1 = tên thật → real_name; dòng có dấu chấm, không bắt đầu bằng «/» = tên miền → source_ids; dòng bắt đầu bằng «/» (tiền tố
// đường dẫn API, từ chung) bỏ. match_whole = true (khuôn S16, hồ sơ che-ten). Một giao dịch; chỉ điền dòng còn trống tên; mỗi mã
// phải đổi đúng 1 dòng, không thì lùi cả hai. In số dòng, số mục — không in giá trị.
// `--thu`: chạy khô — cùng câu UPDATE trong cùng giao dịch, in số dòng sẽ đổi, rồi LUÔN lùi (ROLLBACK), không ghi gì.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const pg = createRequire(path.join(ROOT, "pipeline", "package.json"))("pg");
const THU = process.argv.includes("--thu");
const TAM = process.env.NK_TAM ?? "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam";

export function docTep(text) {
  const dong = text.split("\n").map((x) => x.trim()).filter(Boolean);
  const [ten, ...con] = dong;
  return { real_name: ten, source_ids: con.filter((x) => !x.startsWith("/") && x.includes(".")) };
}

const gia = {};
for (const ma of ["S09", "S17"]) {
  const f = path.join(TAM, `${ma.toLowerCase()}-mien.txt`);
  if (!existsSync(f)) { console.log(`thiếu tệp cục bộ của ${ma} — dừng, không ghi`); process.exit(2); }
  gia[ma] = docTep(readFileSync(f, "utf8"));
  if (!gia[ma].real_name || gia[ma].source_ids.length === 0) { console.log(`tệp của ${ma} sai khuôn (thiếu tên hay tên miền) — dừng`); process.exit(2); }
}
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("BEGIN");
for (const ma of ["S09", "S17"]) {
  const r = await c.query(
    "UPDATE source_registry SET real_name = $1, source_ids = $2, match_whole = true WHERE code = $3 AND real_name IS NULL",
    [gia[ma].real_name, gia[ma].source_ids, ma],
  );
  if (r.rowCount !== 1) {
    await c.query("ROLLBACK");
    await c.end();
    console.log(`${ma}: số dòng đổi ${r.rowCount} ≠ 1 (chưa áp 122, hay tên đã điền) — lùi cả hai, dừng`);
    process.exit(1);
  }
}
if (THU) {
  await c.query("ROLLBACK");
  await c.end();
  console.log(`CHẠY KHÔ (đã lùi, không ghi): S09 sẽ đổi 1 dòng (${gia.S09.source_ids.length} tên miền), S17 sẽ đổi 1 dòng (${gia.S17.source_ids.length} tên miền)`);
  process.exit(0);
}
await c.query("COMMIT");
await c.end();
console.log(`đã điền: S09 1 dòng (${gia.S09.source_ids.length} tên miền), S17 1 dòng (${gia.S17.source_ids.length} tên miền), match_whole = true`);
