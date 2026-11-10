// do-anh-roi-s03.mjs — ma-album-s03 AC-6: đo ảnh rơi của album kênh S03 trên cửa sổ 24 giờ theo manifest.finishedAt.
//   node do-anh-roi-s03.mjs [--den <ISO>] [--gio 24]   in báo cáo; thoát 0 cả khi cảnh báo (phép đo chỉ báo, không chặn ghi)
// Chỉ ĐỌC: một giao dịch READ ONLY trên DB, đọc manifest snapshot và log hook. Không ghi dữ liệu, không gọi kênh.
// captured_at của stg = manifest.finishedAt (bộ nạp ghi giờ thu snapshot), nên cửa sổ lọc trên cột đó.
// Ngưỡng 2%, 5% là tạm (Notes của hợp đồng): chốt lại sau 24 giờ đo đầu.
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const NGUONG_CANH_BAO = 0.02; // thiếu đúng 2,0% chưa cảnh báo
export const NGUONG_DUNG = 0.05;
export const PHUT_DANG_VE = 10; // nhóm mới dưới 10 phút có thể còn ảnh đang về
const LE_CUA_SO_MS = 2 * 3600 * 1000; // đọc rộng hai phía để nhận ra album vắt qua ranh

/** Khoá gom = hội thoại + người gửi + group_layout_id (Notes: khoá trần có thể đụng giữa các nhóm). */
export function khoaGom(r) {
  const a = r.album_meta;
  if (!a || typeof a.group_layout_id !== "string") return null;
  return JSON.stringify([r.conversation_id ?? null, r.sender_id ?? null, a.group_layout_id]);
}

/**
 * Hàm thuần. rows: { conversation_id, sender_id, captured_at, posted_at, album_meta } đọc rộng quanh cửa sổ.
 * Trả số đếm theo AC-6; nhóm chỉ tính khi có ít nhất một bài trong cửa sổ.
 */
export function demAnhRoi(rows, { tu, den }) {
  const t0 = new Date(tu).getTime();
  const t1 = new Date(den).getTime();
  const nhom = new Map();
  for (const r of rows) {
    const k = khoaGom(r);
    if (!k) continue;
    if (!nhom.has(k)) nhom.set(k, []);
    nhom.get(k).push(r);
  }
  const kq = {
    so_nhom: 0, nhom_tu_2_bai: 0, nhom_khong_tong: 0, nhom_tong_khong_thong_nhat: 0,
    nhom_tong_1: 0, nhom_dang_ve: 0, nhom_vat_ranh: 0, mau_so: 0, nhom_thieu: 0,
  };
  for (const ds of nhom.values()) {
    const gio = ds.map((r) => new Date(r.captured_at).getTime());
    const trongCuaSo = gio.some((g) => g >= t0 && g < t1);
    if (!trongCuaSo) continue;
    kq.so_nhom++;
    const idTrong = new Set(ds.map((r) => r.album_meta.id_in_group));
    if (idTrong.size >= 2) kq.nhom_tu_2_bai++;
    const tong = new Set(ds.map((r) => r.album_meta.total_item_in_group).filter((v) => v !== undefined && v !== null));
    if (tong.size === 0) { kq.nhom_khong_tong++; continue; }
    if (tong.size > 1) { kq.nhom_tong_khong_thong_nhat++; continue; }
    const n = Number([...tong][0]);
    if (!(n >= 2)) { kq.nhom_tong_1++; continue; }
    kq.mau_so++;
    if (idTrong.size >= n) continue;
    // Thiếu: trừ nhóm còn đang về và album vắt qua ranh cửa sổ (không phải ảnh rơi).
    const vatRanh = gio.some((g) => g < t0 || g >= t1);
    if (vatRanh) { kq.nhom_vat_ranh++; continue; }
    const dau = Math.min(...ds.map((r) => new Date(r.posted_at ?? r.captured_at).getTime()));
    if (t1 - dau < PHUT_DANG_VE * 60 * 1000) { kq.nhom_dang_ve++; continue; }
    kq.nhom_thieu++;
  }
  kq.ty_le = kq.mau_so ? kq.nhom_thieu / kq.mau_so : 0;
  kq.muc = kq.ty_le > NGUONG_DUNG ? "dung-mo-rong" : kq.ty_le > NGUONG_CANH_BAO ? "canh-bao" : "ok";
  return kq;
}

/** Đếm dòng `post 202` của log hook (UTC) trong cửa sổ. Chỉ đếm, không giữ nội dung dòng. */
export function demPost202(vanBan, { tu, den }) {
  const t0 = new Date(tu).getTime();
  const t1 = new Date(den).getTime();
  let n = 0;
  for (const dong of vanBan.split("\n")) {
    if (!dong.includes(" post 202")) continue;
    const g = Date.parse(dong.slice(0, dong.indexOf(" ")));
    if (g >= t0 && g < t1) n++;
  }
  return n;
}

/** Tổng item của snapshot kênh S03-agent có finishedAt trong cửa sổ. */
export function demItemSnapshot(thuMuc, { tu, den }) {
  const t0 = new Date(tu).getTime();
  const t1 = new Date(den).getTime();
  let n = 0;
  if (!existsSync(thuMuc)) return null;
  for (const ten of readdirSync(thuMuc)) {
    if (!ten.includes("-agent__")) continue;
    const tep = path.join(thuMuc, ten, "manifest.json");
    if (!existsSync(tep)) continue;
    const m = JSON.parse(readFileSync(tep, "utf8"));
    const g = Date.parse(m.finishedAt);
    if (g >= t0 && g < t1) n += m.counts?.items ?? 0;
  }
  return n;
}

export const SQL_DOC = `
  SELECT conversation_id, sender_id, captured_at, posted_at, album_meta
    FROM stg_zalo_posts
   WHERE album_meta IS NOT NULL AND captured_at >= $1 AND captured_at < $2`;

async function main() {
  const arg = process.argv.slice(2);
  const lay = (ten, mac) => { const i = arg.indexOf(ten); return i >= 0 ? arg[i + 1] : mac; };
  const den = new Date(lay("--den", new Date().toISOString()));
  const tu = new Date(den.getTime() - Number(lay("--gio", "24")) * 3600 * 1000);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  let rows = [];
  try {
    await client.query("BEGIN READ ONLY");
    const cot = await client.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'stg_zalo_posts' AND column_name = 'album_meta'");
    if (cot.rowCount === 0) {
      console.log("CHUA-AP-077: bảng stg S03 chưa có cột album_meta — chưa đo được");
    } else {
      ({ rows } = await client.query(SQL_DOC, [new Date(tu.getTime() - LE_CUA_SO_MS), new Date(den.getTime() + LE_CUA_SO_MS)]));
    }
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
  const kq = demAnhRoi(rows, { tu, den });
  const log = path.join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log");
  const post202 = existsSync(log) ? demPost202(readFileSync(log, "utf8"), { tu, den }) : null;
  const item = demItemSnapshot(path.join(HERE, "../collector/snapshots/hanoi"), { tu, den });
  console.log(JSON.stringify({ tu: tu.toISOString(), den: den.toISOString(), ...kq, ty_le: Number(kq.ty_le.toFixed(4)), post_202: post202, item_snapshot: item }));
  if (kq.muc !== "ok") console.log(`${kq.muc === "dung-mo-rong" ? "DỪNG MỞ RỘNG" : "CẢNH BÁO"}: ${kq.nhom_thieu}/${kq.mau_so} nhóm thiếu ảnh`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
