// dung-nguoi.mjs — DB2b: dựng danh bạ Người + vai người đăng một lượt (vận hành tay; chạy đêm đi qua refresh-bait-gap.mjs).
// Mặc định COMMIT; `--thu` chạy trong giao dịch rồi ROLLBACK (xem số, không ghi).
// HD13: `--tach <party_key> --ly-do «…»` tách một lần gộp theo SĐT (người về split, sự kiện tach, dựng lại cùng giao dịch).
// Công tắc gộp (mặc định tắt): `--cong-tac-gop bat|tat --ly-do «…»` ghi một dòng ops_audit `danh-ba:gop-sdt`, không dựng.
// Thoát: 0 xong · 1 lỗi (kể cả khoá không có, người không ở merged) · 2 sai cờ (trước khi mở kết nối DB).
import pg from "pg";

import { dungNguoi, ghiCongTac, tachNguoi } from "./lib/danh-ba-nguoi.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const argv = process.argv.slice(2);
const thu = argv.includes("--thu");
const sauCo = (co) => (argv.includes(co) ? argv[argv.indexOf(co) + 1] ?? null : null);
const tach = sauCo("--tach");
const lyDo = sauCo("--ly-do");
const congTac = sauCo("--cong-tac-gop");
const coLyDo = lyDo && lyDo.trim() && !lyDo.startsWith("--");

const sai = (loi) => {
  console.error(`dung-nguoi: ${loi}`);
  process.exit(2);
};
if (argv.includes("--cong-tac-gop")) {
  if (argv.includes("--tach")) sai("--cong-tac-gop không đi cùng --tach");
  if (congTac !== "bat" && congTac !== "tat") sai("--cong-tac-gop chỉ nhận bat | tat");
  if (!coLyDo) sai("--cong-tac-gop cần --ly-do «…» (lý do ghi vào ops_audit)");
}
if (argv.includes("--tach") && (!tach || !coLyDo)) sai("--tach <party_key> cần --ly-do «…» (lý do tách ghi vào registry_events)");

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  await c.query("BEGIN");
  const kq = congTac
    ? await ghiCongTac(c, { bat: congTac === "bat", lyDo })
    : tach ? await tachNguoi(c, tach, { lyDo }) : await dungNguoi(c);
  console.log(JSON.stringify(kq));
  await c.query(thu ? "ROLLBACK" : "COMMIT");
  console.log(thu ? "--thu: ROLLBACK, không ghi" : "COMMIT");
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error(e.code === "KHONG_CO" || e.code === "SAI_TRANG_THAI" ? e.message : e);
  process.exitCode = 1;
} finally {
  await c.end();
}
