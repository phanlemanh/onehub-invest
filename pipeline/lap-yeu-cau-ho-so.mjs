#!/usr/bin/env node
// lap-yeu-cau-ho-so.mjs — link-nguoi-ban-s03 (AC-8): lập tệp yêu cầu cho bộ tra hồ sơ người bán S03 ({mas, doi_chung}, khuôn của bộ
// tra trong extension). Lượt thử: 20 mã có từ 3 tin + 2 mã đối chứng gửi tin trong 24 giờ. Chỉ đọc DB; in số đếm, KHÔNG in mã.
//   node pipeline/lap-yeu-cau-ho-so.mjs                      chỉ đếm, không ghi tệp
//   node pipeline/lap-yeu-cau-ho-so.mjs --out <tệp>          ghi tệp yêu cầu (đặt ở thư mục việc S03_LOOKUP_DIR của gateway)
//        [--snapshots <thư mục snapshots/>] [--so-ma N] [--tin-toi-thieu N] [--ghi-de]
// Tệp nằm ngoài ~/.openclaw và ngoài mọi thư mục snapshots/. Đặt tệp là bước bật lượt thử — theo lời giao triển khai, không tự chạy.
// Thoát: 0 xong · 2 đối số sai, đường cấm, tệp đã có, DB thiếu 079 hay không đủ mã.
import { existsSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { LUOT_THU, docVaChon, duongYeuCauHopLe } from "./lib/chon-ma-ho-so.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function doiSo(argv) {
  const a = { out: null, snapshots: join(ROOT, "collector", "snapshots"), lookupDir: process.env.S03_LOOKUP_DIR ?? null, soMa: LUOT_THU.soMa, tinToiThieu: LUOT_THU.tinToiThieu, ghiDe: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--out") a.out = argv[++i];
    else if (k === "--snapshots") a.snapshots = argv[++i];
    else if (k === "--lookup-dir") a.lookupDir = argv[++i];
    else if (k === "--so-ma") a.soMa = Number(argv[++i]);
    else if (k === "--tin-toi-thieu") a.tinToiThieu = Number(argv[++i]);
    else if (k === "--ghi-de") a.ghiDe = true;
    else throw new Error(`đối số lạ: ${k}`);
  }
  if (!(Number.isInteger(a.soMa) && a.soMa >= 1 && a.soMa <= LUOT_THU.soMa)) throw new Error(`--so-ma phải là số nguyên 1–${LUOT_THU.soMa} (trần một lời của bộ tra)`);
  if (!(Number.isInteger(a.tinToiThieu) && a.tinToiThieu >= 1)) throw new Error("--tin-toi-thieu phải là số nguyên ≥ 1");
  if (a.out !== null && !a.out) throw new Error("--out thiếu đường dẫn");
  return a;
}

async function main() {
  let a;
  try { a = doiSo(process.argv.slice(2)); } catch (e) { console.error(`lap-yeu-cau-ho-so: ${e.message}`); return 2; }
  if (a.out) {
    if (!duongYeuCauHopLe(a.out)) { console.error("lap-yeu-cau-ho-so: tệp yêu cầu không được nằm trong ~/.openclaw hay thư mục snapshots/"); return 2; }
    if (existsSync(a.out) && !a.ghiDe) { console.error("lap-yeu-cau-ho-so: tệp yêu cầu đã có — bộ tra có thể đang xử; dùng --ghi-de nếu chắc"); return 2; }
  }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  let kq;
  try {
    await c.query("BEGIN READ ONLY");
    kq = await docVaChon(c, { snapshots: a.snapshots, lookupDir: a.lookupDir, soMa: a.soMa, tinToiThieu: a.tinToiThieu });
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    if (e.message === "CHUA-AP-079") { console.error("lap-yeu-cau-ho-so: CHUA-AP-079 — chưa có sổ liên lạc, không loại được Người có số"); return 2; }
    throw e;
  } finally {
    await c.end();
  }
  const d = kq.dem;
  console.log(`lap-yeu-cau-ho-so: chọn ${kq.mas.length} mã · đối chứng ${kq.doi_chung.length} · đủ điều kiện ${d.du_dieu_kien}/${d.tai_khoan} tài khoản`
    + ` (loại: có số trên tin ${d.co_so_tren_tin}, Người có số ${d.nguoi_co_so}, chưa có Người ${d.khong_nguoi}, đã tra trong 30 ngày ${d.da_tra},`
    + ` dưới ${a.tinToiThieu} tin ${d.it_tin}, mã sai khuôn ${d.ma_sai_khuon})`);
  if (!a.out) return 0;
  if (kq.mas.length === 0 || kq.doi_chung.length < LUOT_THU.doiChung) {
    console.error("lap-yeu-cau-ho-so: không đủ mã hay mã đối chứng — không ghi tệp");
    return 2;
  }
  const tam = `${a.out}.tam-${process.pid}`;
  writeFileSync(tam, JSON.stringify({ mas: kq.mas, doi_chung: kq.doi_chung }), { mode: 0o600 });
  renameSync(tam, a.out);
  console.log(`lap-yeu-cau-ho-so: đã ghi tệp yêu cầu (${kq.mas.length} + ${kq.doi_chung.length} mã)`);
  return 0;
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
