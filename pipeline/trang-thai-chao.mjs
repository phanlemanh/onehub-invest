// trang-thai-chao.mjs — PL19 `thoi-gian-va-hieu-luc`: ghi bằng chứng trạng thái chào (ghi_bang_chung_chao) rồi phân xử
// (resolve_offer_status, migration 059) cho mọi tin; in đếm theo năm trạng thái. Bước cloud-sync ngay trước bac-du-lieu.
//   node trang-thai-chao.mjs   một giao dịch dưới khoá 56056 (cùng khoá bac-du-lieu — hai lượt cùng lúc xếp hàng)
// Chạy lại không thêm phát biểu nào khi tin không đổi. Lỗi chạy (DB, SQL) thoát 1.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA } from "./bac-du-lieu.mjs";
import { VOCAB } from "./lib/vocab.generated.mjs";

const TRANG_THAI = VOCAB.offer_status;

/** Ghi bằng chứng + phân xử mọi tin trong giao dịch của bên gọi. */
export async function chay(client) {
  await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
  const { rows: [g] } = await client.query("SELECT ghi_bang_chung_chao(NULL) AS g");
  await client.query("SELECT resolve_offer_status(NULL)");
  const { rows } = await client.query("SELECT offer_status, count(*)::int AS n FROM sale_offer_records GROUP BY 1");
  const dem = Object.fromEntries(TRANG_THAI.map((t) => [t, 0]));
  for (const r of rows) dem[r.offer_status] = r.n;
  return { moi: g.g.moi, rut: g.g.rut, dem, tong: Object.values(dem).reduce((a, b) => a + b, 0) };
}

export const dongIn = (kq) =>
  `trang-thai-chao: ${kq.tong} tin · ${TRANG_THAI.map((t) => `${t} ${kq.dem[t]}`).join(" · ")} · ${kq.moi} phát biểu mới · ${kq.rut} rút`;

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
    connectionTimeoutMillis: 5000 });
  await c.connect();
  try {
    await c.query("BEGIN");
    const kq = await chay(c);
    await c.query("COMMIT");
    console.log(dongIn(kq));
    return 0;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((ma) => { process.exitCode = ma; }, (e) => { console.error(`trang-thai-chao: ${e.message}`); process.exit(1); });
