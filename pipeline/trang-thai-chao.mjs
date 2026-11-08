// trang-thai-chao.mjs — PL19 `thoi-gian-va-hieu-luc`: ghi bằng chứng trạng thái chào (ghi_bang_chung_chao), luật «không
// thấy lại quá N ngày → ngừng rao» (ghi_khong_thay_lai, migration 085, V6) rồi phân xử (resolve_offer_status, 059) cho mọi
// tin; in đếm theo năm trạng thái, rồi một dòng của luật. Bước cloud-sync ngay trước bac-du-lieu.
//   node trang-thai-chao.mjs         một giao dịch dưới khoá 56056 (cùng khoá bac-du-lieu — hai lượt cùng lúc xếp hàng)
//   node trang-thai-chao.mjs --thu   chạy y hệt rồi ROLLBACK — đo trước khi bật trên máy thu, DB không đổi
// DB chưa áp 085 → bỏ bước luật, in «chưa áp 085», không lỗi (code gộp trước khi Mạnh cho áp 085 trên máy thu).
// Chạy lại không thêm phát biểu nào khi tin không đổi. Lỗi chạy (DB, SQL) thoát 1.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA } from "./bac-du-lieu.mjs";
import { VOCAB } from "./lib/vocab.generated.mjs";

const TRANG_THAI = VOCAB.offer_status;
const NGUON_LUAT = ["S03", "S05", "S06"];

/** DB đã áp 085 (có hàm luật) chưa. */
const coLuat = async (client) =>
  (await client.query("SELECT to_regproc('ghi_khong_thay_lai') IS NOT NULL AS co")).rows[0].co;

/** Ghi bằng chứng + luật + phân xử mọi tin trong giao dịch của bên gọi. `luat` = null khi DB chưa áp 085. */
export async function chay(client) {
  await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
  const { rows: [g] } = await client.query("SELECT ghi_bang_chung_chao(NULL) AS g");
  const co = await coLuat(client);
  const l = co ? (await client.query("SELECT ghi_khong_thay_lai(NULL) AS l")).rows[0].l : null;
  await client.query("SELECT resolve_offer_status(NULL)");
  const { rows } = await client.query("SELECT offer_status, count(*)::int AS n FROM sale_offer_records GROUP BY 1");
  const dem = Object.fromEntries(TRANG_THAI.map((t) => [t, 0]));
  for (const r of rows) dem[r.offer_status] = r.n;
  let luat = null;
  if (l) {
    // tin sống đang ngừng rao theo luật: trạng thái withdrawn và còn phát biểu luật sống của chính tin
    const { rows: nr } = await client.query(`SELECT r.source, count(DISTINCT r.offer_id)::int AS n
        FROM field_assertions fa JOIN sale_offer_records r ON fa.rule_id = 'khong-thay-lai:' || r.offer_id
       WHERE fa.field = 'offer_status' AND fa.retracted_at IS NULL AND fa.rule_id LIKE 'khong-thay-lai:%'
         AND r.retired_at IS NULL AND r.offer_status = 'withdrawn'
       GROUP BY 1`);
    const theoNguon = Object.fromEntries(NGUON_LUAT.map((s) => [s, 0]));
    for (const r of nr) theoNguon[r.source] = r.n;
    luat = { moi: l.moi, rut: l.rut, theoNguon };
  }
  return { moi: g.g.moi, rut: g.g.rut, dem, tong: Object.values(dem).reduce((a, b) => a + b, 0), luat };
}

export const dongIn = (kq) =>
  `trang-thai-chao: ${kq.tong} tin · ${TRANG_THAI.map((t) => `${t} ${kq.dem[t]}`).join(" · ")} · ${kq.moi} phát biểu mới · ${kq.rut} rút`;

export const dongLuat = (kq) => kq.luat === null
  ? "trang-thai-chao: chưa áp 085 — bỏ qua luật không thấy lại"
  : `trang-thai-chao: ngừng rao ${NGUON_LUAT.map((s) => `${s} ${kq.luat.theoNguon[s]}`).join(" · ")} · ${kq.luat.moi} phát biểu luật mới · ${kq.luat.rut} rút`;

async function main() {
  const thu = process.argv.includes("--thu");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
    connectionTimeoutMillis: 5000 });
  await c.connect();
  try {
    await c.query("BEGIN");
    const kq = await chay(c);
    await c.query(thu ? "ROLLBACK" : "COMMIT");
    console.log(dongIn(kq));
    console.log(dongLuat(kq));
    if (thu) console.log("trang-thai-chao: --thu, đã hoàn tác");
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
