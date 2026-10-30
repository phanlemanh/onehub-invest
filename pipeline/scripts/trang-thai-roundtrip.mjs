// trang-thai-roundtrip.mjs — PL19 E8 (AC-8): chạy `node pipeline/trang-thai-chao.mjs` hai lần trên bản chép DB máy thu,
// đối chiếu đếm in ra với đếm độc lập bằng SQL riêng, rồi chiều đỏ: DB không tới được → lệnh thoát khác 0.
// GHI phát biểu + cột trạng thái nên CHỈ chạy trên DB thử (bash db/db-thu.sh oneinvest_p2_tg); DB thử chưa áp 059 thì
// script áp tệp 059 trước (từ chối trên DB `oneinvest` dùng chung).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA } from "../bac-du-lieu.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const CLI = path.join(ROOT, "pipeline", "trang-thai-chao.mjs");
const URL = process.env.DATABASE_URL;
const TRANG_THAI = VOCAB.offer_status;

let hong = 0;
const dong = (ok, chu) => {
  console.log(`AC-8 ${chu}${ok ? "" : " — LỆCH"}`);
  if (!ok) hong++;
};

function chayCli(env) {
  const r = spawnSync(process.execPath, [CLI], { env: { ...process.env, ...env }, encoding: "utf8" });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}
function docDong(out) {
  const m = out.match(/^trang-thai-chao: (\d+) tin · (.+) · (\d+) phát biểu mới · (\d+) rút$/m);
  if (!m) throw new Error(`không đọc được dòng in của trang-thai-chao: «${out}»`);
  const dem = Object.fromEntries(m[2].split(" · ").map((x) => x.split(" ")).map(([k, v]) => [k, Number(v)]));
  return { tong: Number(m[1]), dem, moi: Number(m[3]) };
}

async function main() {
  if (!URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử (bash db/db-thu.sh oneinvest_p2_tg)");
  const c = new pg.Client({ connectionString: URL });
  await c.connect();
  try {
    const { rows: [db] } = await c.query(
      "SELECT current_database() AS ten, to_regclass('public.history_transactional') IS NOT NULL AS co059");
    if (db.ten === "oneinvest") throw new Error("từ chối chạy trên DB oneinvest dùng chung — phép đo GHI dữ liệu, dùng DB thử");
    if (!db.co059) {
      // giữ khoá 56056 như mọi bên nạp 059 / ghi trạng thái (itest, trang-thai-chao) — không deadlock khi chạy cùng DB thử
      await c.query("BEGIN");
      await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
      await c.query(readFileSync(path.join(ROOT, "db/migrations/059_thoi_gian_hieu_luc.sql"), "utf8"));
      await c.query("COMMIT");
      console.log(`AC-8 DB thử ${db.ten}: đã áp 059`);
    }

    const mot = chayCli({});
    if (mot.code !== 0) throw new Error(`lần một thoát ${mot.code}: ${mot.err}`);
    const a = docDong(mot.out);
    const { rows: dl } = await c.query("SELECT offer_status, count(*)::int AS n FROM sale_offer_records GROUP BY 1");
    const doc = Object.fromEntries(TRANG_THAI.map((t) => [t, 0]));
    for (const r of dl) doc[r.offer_status] = r.n;
    const { rows: [n] } = await c.query("SELECT count(*)::int AS n FROM sale_offer_records");
    const khop = a.tong === n.n && TRANG_THAI.every((t) => a.dem[t] === doc[t]);
    dong(khop, `lần một: ${a.tong} tin · ${TRANG_THAI.map((t) => `${t} ${a.dem[t]}`).join(" · ")} · ${a.moi} phát biểu mới · tổng ${
      khop ? "khớp" : `≠ ${n.n} tin đếm độc lập`}`);

    const hai = chayCli({});
    if (hai.code !== 0) throw new Error(`lần hai thoát ${hai.code}: ${hai.err}`);
    const b = docDong(hai.out);
    const cungDem = b.tong === a.tong && TRANG_THAI.every((t) => b.dem[t] === a.dem[t]);
    dong(b.moi === 0 && cungDem, `lần hai: ${b.moi} phát biểu mới, ${cungDem ? "cùng đếm" : "đếm khác lần một"}`);

    const { rows: nguon } = await c.query(`SELECT source, count(*)::int AS n FROM sale_offers
      WHERE offer_status = 'unknown' GROUP BY 1 ORDER BY 1`);
    const ngoai = nguon.filter((r) => !["S03", "S05", "S06"].includes(r.source));
    const trongDs = nguon.length === ngoai.length;
    dong(trongDs, `tin sống unknown: ${nguon.reduce((s, r) => s + r.n, 0)}${ngoai.length
      ? ` (nguồn không có bằng chứng: ${ngoai.map((r) => `${r.source} ${r.n}`).join(", ")})` : ""}`);

    const { rows: [h] } = await c.query(`SELECT
      count(*) FILTER (WHERE retired_reason = 'het_trong_luot' AND source = 'S06')::int AS s06,
      count(*) FILTER (WHERE retired_reason = 'het_trong_luot' AND source <> 'S06')::int AS khac
      FROM sale_offer_records`);
    dong(a.dem.withdrawn === h.s06, `withdrawn = ${a.dem.withdrawn} = ${h.s06} tin S06 het_trong_luot đếm độc lập`);
    console.log(`AC-8 tin S03/S05 het_trong_luot không thành withdrawn: ${h.khac} (vắng lượt nhóm không phải bằng chứng gỡ — AC-4)`);

    // Vế lịch sử giá (Hỏi-3): số căn B5 khi bỏ vế, trừ số căn B5 thật — bản hàm ở pg_temp, giao dịch ROLLBACK.
    await c.query("BEGIN");
    try {
      await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
      const { rows: [f] } = await c.query("SELECT pg_get_functiondef('property_data_level(bigint[])'::regprocedure) AS d");
      const ve = "\n                         AND coalesce(g.n, 0) >= 2";
      if (!f.d.includes(ve)) throw new Error("property_data_level không còn vế lịch sử giá — sửa phép đo theo hàm");
      await c.query(f.d.replace("public.property_data_level(", "pg_temp.bac_bo_ve_gia(").replace(ve, ""));
      const { rows: [k] } = await c.query(`SELECT
        (SELECT count(*) FROM pg_temp.bac_bo_ve_gia(NULL) WHERE data_level = 'B5')::int
          - (SELECT count(*) FROM property_data_level(NULL) WHERE data_level = 'B5')::int AS k`);
      console.log(`AC-8 căn bị vế lịch sử giá loại: ${k.k}${k.k === 0 ? " — vế lịch sử giá không lọc căn nào" : ""}`);
    } finally {
      await c.query("ROLLBACK");
    }
  } finally {
    await c.end();
  }

  // Chiều đỏ: DB không tới được → lệnh thoát khác 0.
  const loi = chayCli({ DATABASE_URL: "postgres://127.0.0.1:1/khong_co" });
  dong(loi.code !== 0, `lỗi chạy → thoát ${loi.code}`);
  return hong ? 1 : 0;
}

main().then((ma) => { process.exitCode = ma; }, (e) => { console.error(`trang-thai-roundtrip: ${e.message}`); process.exit(1); });
