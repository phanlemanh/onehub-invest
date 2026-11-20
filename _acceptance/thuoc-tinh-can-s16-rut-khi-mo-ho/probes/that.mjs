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
  // Số 0 phải đến từ tập căn mơ hồ đọc đúng, không từ lỗi bị nuốt: đọc v_s16_can trực tiếp (không catch) và đếm độc lập
  // số căn danh bạ mang mã mơ hồ bằng một câu nối riêng; tập của lệnh phải bằng đúng số đó (DB thật hôm nay: 0 căn, vì
  // DA33 không đúc căn cho mã mơ hồ — bat_khi của hàng).
  const moHoView = (await c.query(`SELECT count(*)::int AS n FROM v_s16_can WHERE mo_ho`)).rows[0].n;
  const canMoHoDem = (await c.query(`SELECT count(DISTINCT a.object_key)::int AS n FROM registry_aliases a
      JOIN v_s16_can v ON v.mo_ho AND a.value = v.du_an || '/' || v.ma_can
     WHERE a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.object_key LIKE 'unt\\_%'`)).rows[0].n;
  dung("can_mo_ho_doc_dung", moHoView > 0 && kq.can_mo_ho.length === canMoHoDem,
    `mã mơ hồ ở v_s16_can ${moHoView} · căn danh bạ mơ hồ: lệnh ${kq.can_mo_ho.length} · đếm độc lập ${canMoHoDem}`);
  const mh = await demMoHo(c, kq.can_mo_ho);
  dung("rut_mo_ho_can", mh.can === 0, `căn sẽ rút ${mh.can}`);
  const dem = (await c.query(`SELECT count(*)::int AS phat, count(DISTINCT subject_key)::int AS can FROM field_assertions
      WHERE resource_name = 'Unit' AND method = 'source_field' AND evidence ->> 'nguon' = 'S16' AND retracted_at IS NULL`)).rows[0];
  // Đối chứng dương độc lập: lấy tập căn mang nguồn S16 qua đường khác hẳn bộ lọc rút (view đọc của Ops), bộ lọc phải
  // bắt đúng từng căn đó và đúng số phát biểu S16 sống của chúng.
  const canView = (await c.query(`SELECT unit_key FROM v_unit_thuoc_tinh WHERE 'S16' = ANY(nguon)`)).rows.map((r) => r.unit_key);
  const quaLoc = await demMoHo(c, canView);
  dung("phat_bieu_khop_bo_loc", canView.length > 0 && quaLoc.can === canView.length && quaLoc.phat_bieu === dem.phat,
    `bộ lọc ${quaLoc.can} căn/${quaLoc.phat_bieu} phát biểu · view ${canView.length} căn · đếm thẳng ${dem.phat} phát biểu`);
  const view = (await c.query(`SELECT count(*)::int AS n FROM v_unit_thuoc_tinh`)).rows[0].n;
  dung("co_thuoc_tinh", view > 0 && view === dem.can, `view ${view} · đếm độc lập ${dem.can}`);
  const i = process.argv.indexOf("--co-thuoc-tinh");
  if (i > 0) dung("co_thuoc_tinh_ky_vong", view === Number(process.argv[i + 1]), `view ${view} · kỳ vọng ${process.argv[i + 1]}`);
} finally { await c.end(); }
process.exit(sai.length ? 1 : 0);
