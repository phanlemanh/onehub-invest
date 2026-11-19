#!/usr/bin/env node
// E8: chỉ đọc DB máy thu đã áp DA40. Không in mã căn hay tên dự án.
//   node that.mjs                         kiểm số thật
//   node that.mjs --co-thuoc-tinh <số>    đòi số căn có thuộc tính đúng bằng <số> (chiều đỏ của phép đo)
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const { demMoHo, tinh } = await import(pathToFileURL(join(GOC, "pipeline/scripts/thuoc-tinh-can-s16.mjs")).href);
const url = process.env.TTC_DB_URL ?? process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const c = new pg.Client({ connectionString: url });
await c.connect();
const sai = [];
const dung = (ten, dat, chu) => { console.log(`${dat ? "đạt" : "LỆCH"} · ${ten} · ${chu}`); if (!dat) sai.push(ten); };
try {
  await c.query("SET default_transaction_read_only = on");
  const kq = await tinh(c);
  if (kq.chua_ap || !kq.snapshot) { console.error("that.mjs: DB chưa áp DA40 hoặc bảng nạp chưa có dòng"); process.exit(2); }
  const mh = await demMoHo(c, kq.can_mo_ho);
  dung("rut_mo_ho_can", mh.can === 0, `căn sẽ rút ${mh.can}`);
  const dem = (await c.query(`SELECT count(*)::int AS phat, count(DISTINCT subject_key)::int AS can FROM field_assertions
      WHERE resource_name = 'Unit' AND method = 'source_field' AND evidence ->> 'nguon' = 'S16' AND retracted_at IS NULL`)).rows[0];
  const quaLoc = await demMoHo(c, (await c.query(`SELECT DISTINCT subject_key k FROM field_assertions WHERE resource_name = 'Unit' AND retracted_at IS NULL`)).rows.map((r) => r.k));
  dung("phat_bieu_khop_bo_loc", dem.phat > 0 && quaLoc.phat_bieu === dem.phat, `bộ lọc ${quaLoc.phat_bieu} · đếm độc lập ${dem.phat}`);
  const view = (await c.query(`SELECT count(*)::int AS n FROM v_unit_thuoc_tinh`)).rows[0].n;
  dung("co_thuoc_tinh", view > 0 && view === dem.can, `view ${view} · đếm độc lập ${dem.can}`);
  const i = process.argv.indexOf("--co-thuoc-tinh");
  if (i > 0) dung("co_thuoc_tinh_ky_vong", view === Number(process.argv[i + 1]), `view ${view} · kỳ vọng ${process.argv[i + 1]}`);
} finally { await c.end(); }
process.exit(sai.length ? 1 : 0);
