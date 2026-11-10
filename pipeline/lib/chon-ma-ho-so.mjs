// chon-ma-ho-so.mjs — link-nguoi-ban-s03 (AC-8): chọn mã tài khoản S03 cho tệp yêu cầu của bộ tra hồ sơ. Chỉ người bán đã đăng tin
// bán hoặc thuê mà không để lại số ở đâu cả; không lấy mã từ danh sách thành viên nhóm hay người chỉ bình luận (nguồn mã duy nhất là
// seller_ref của tin). Phần chọn thuần, tách khỏi DB và đĩa.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import { gunzipSync } from "node:zlib";
import { KENH_LIEN_LAC, NGUON_LIEN_LAC, SQL_LL } from "./lien-lac-nguoi.mjs";
import { nguoiCuoi } from "./danh-ba-nguoi.mjs";
import { STG_HO_SO } from "./nap-080.mjs";
import { ALIAS_KIND, CONTACT_KIND, KIND } from "./vocab.generated.mjs";

/** Nguồn snapshot của kết quả tra hồ sơ (DATA-CONTRACT, kind ho-so). */
export const NGUON_SNAPSHOT_HO_SO = "s03-ho-so";
/** Lượt thử: số mã, số tin tối thiểu mỗi mã, số mã đối chứng (AC-3, AC-8). */
export const LUOT_THU = Object.freeze({ soMa: 20, tinToiThieu: 3, doiChung: 2 });
/** Không tra lại mã đã tra trong ngần này ngày (tính cả snapshot hồ sơ chưa nạp). */
export const NGAY_KHONG_TRA_LAI = 30;
/** Đối chứng: người đã gửi tin trong ngần này giờ. */
export const GIO_DOI_CHUNG = 24;

const MA = /^\d{1,32}$/;

/**
 * Chọn mã. Thuần.
 * @param {{ ma: string, n_tin: number, co_so: boolean }[]} taiKhoan một dòng mỗi seller_ref S03 có tin bán hoặc thuê
 * @param {Map<string, string>} nguoiCuaMa mã → party_key cuối chuỗi gộp
 * @param {Set<string>} nguoiCoSo party_key cuối chuỗi gộp của mọi Người có liên lạc sdt hay bí danh SĐT (kể cả Người theo SĐT đã nối)
 * @param {Set<string>} daTra mã đã tra trong cửa sổ (stg + snapshot chưa nạp)
 * @param {string[]} guiGanDay mã người gửi tin gần đây, mới nhất trước — nguồn đối chứng
 */
export function chonMa(taiKhoan, nguoiCuaMa, nguoiCoSo, daTra, guiGanDay, {
  soMa = LUOT_THU.soMa, tinToiThieu = LUOT_THU.tinToiThieu, soDoiChung = LUOT_THU.doiChung,
} = {}) {
  const dem = { tai_khoan: taiKhoan.length, ma_sai_khuon: 0, co_so_tren_tin: 0, khong_nguoi: 0, nguoi_co_so: 0, da_tra: 0, it_tin: 0, du_dieu_kien: 0 };
  const ung = [];
  for (const t of taiKhoan) {
    if (!MA.test(t.ma)) { dem.ma_sai_khuon++; continue; }
    if (t.co_so) { dem.co_so_tren_tin++; continue; }
    const p = nguoiCuaMa.get(t.ma);
    if (!p) { dem.khong_nguoi++; continue; }
    if (nguoiCoSo.has(p)) { dem.nguoi_co_so++; continue; }
    if (daTra.has(t.ma)) { dem.da_tra++; continue; }
    if (t.n_tin < tinToiThieu) { dem.it_tin++; continue; }
    ung.push(t);
  }
  dem.du_dieu_kien = ung.length;
  const mas = ung.sort((a, b) => b.n_tin - a.n_tin || a.ma.localeCompare(b.ma)).slice(0, soMa).map((t) => t.ma);
  const chon = new Set(mas);
  const doiChung = [];
  for (const m of guiGanDay) {
    if (doiChung.length >= soDoiChung) break;
    if (MA.test(m) && !chon.has(m) && !doiChung.includes(m)) doiChung.push(m);
  }
  return { mas, doi_chung: doiChung, dem };
}

/** Mã đã tra trong snapshot hồ sơ còn trên đĩa (đã nạp hay chưa), lấy lúc ≥ mốc. Snapshot hỏng thì bỏ qua — bộ nạp sẽ báo nó.
 * @param {string} goc thư mục snapshots/ @param {Date} tu */
export function maTrongSnapshot(goc, tu) {
  const ra = new Set();
  if (!existsSync(goc)) return ra;
  for (const city of readdirSync(goc, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dirCity = join(goc, city.name);
    for (const s of readdirSync(dirCity, { withFileTypes: true })) {
      if (!s.isDirectory() || s.name.startsWith(".") || !s.name.includes(`__${NGUON_SNAPSHOT_HO_SO}__`)) continue;
      try {
        const manifest = JSON.parse(readFileSync(join(dirCity, s.name, "manifest.json"), "utf8"));
        if (manifest.source !== NGUON_SNAPSHOT_HO_SO) continue;
        for (const f of manifest.files.filter((x) => x.name.startsWith("items-"))) {
          for (const it of JSON.parse(gunzipSync(readFileSync(join(dirCity, s.name, f.name))).toString("utf8"))) {
            const ma = it?.payload?.ma_tai_khoan;
            const luc = Date.parse(it?.fetchedAt ?? "");
            if (typeof ma === "string" && Number.isFinite(luc) && luc >= tu.getTime()) ra.add(ma);
          }
        }
      } catch { /* snapshot mồ côi hay hỏng: không tính */ }
    }
  }
  return ra;
}

/** Đường ghi tệp yêu cầu hợp lệ: không nằm trong cấu hình OpenClaw (~/.openclaw) và không trong thư mục snapshots/ nào. */
export function duongYeuCauHopLe(p, home = homedir()) {
  const tuyetDoi = resolve(p);
  const openclaw = resolve(home, ".openclaw");
  if (tuyetDoi === openclaw || tuyetDoi.startsWith(openclaw + sep)) return false;
  return !tuyetDoi.split(sep).includes("snapshots");
}

/**
 * U1(8) — mã trong SPOOL của bộ tra (spool-ho-so.jsonl trong thư mục việc):
 * đã tra NHƯNG chưa gửi được tới collector (bộ tra phát lại đầu mỗi vòng).
 * Những mã này phải được coi là «đã tra» để không chọn lại (0711-39).
 * Dòng hỏng khuôn bỏ qua — không làm ngỏ cả lượt chọn.
 * @param {string} lookupDir thư mục việc bộ tra (S03_LOOKUP_DIR)
 */
export function maTrongSpool(lookupDir) {
  const ra = new Set();
  const p = join(lookupDir, "spool-ho-so.jsonl");
  if (!existsSync(p)) return ra;
  for (const dong of readFileSync(p, "utf8").split("\n")) {
    const t = dong.trim();
    if (!t) continue;
    try {
      const ma = JSON.parse(t)?.ma_tai_khoan;
      if (typeof ma === "string" && MA.test(ma)) ra.add(ma);
    } catch { /* dòng dở (đang ghi dở giữa chừng) — bỏ qua */ }
  }
  return ra;
}

// Bảng bài S03 lấy từ câu của bộ dựng liên lạc (cùng nguồn, không viết lại tên bảng).
const BANG_BAI = SQL_LL.bai.match(/FROM\s+(\w+)/)[1];

/** Mọi câu SQL của mô-đun. */
export const SQL_CM = Object.freeze({
  taiKhoan: `SELECT seller_ref AS ma, count(*)::int AS n_tin, bool_or(seller_phone IS NOT NULL) AS co_so
               FROM sale_offer_records
              WHERE source = $1 AND nullif(btrim(seller_ref), '') IS NOT NULL
              GROUP BY seller_ref
             HAVING bool_or(kind IN ('${KIND.sale}', '${KIND.rent_lt}'))`,
  sdtLienLac: `SELECT DISTINCT party_key FROM party_contacts WHERE retracted_at IS NULL AND kind = '${CONTACT_KIND.sdt}'`,
  sdtBiDanh: `SELECT DISTINCT object_key FROM registry_aliases
               WHERE retired_at IS NULL AND kind IN ('${ALIAS_KIND.sdt}', '${ALIAS_KIND.sdt_bam}') AND object_key LIKE 'pty\\_%'`,
  daTra: `SELECT DISTINCT ma_tai_khoan FROM ${STG_HO_SO} WHERE captured_at >= now() - make_interval(days => $1)`,
  guiGanDay: `SELECT sender_id FROM ${BANG_BAI}
               WHERE agent_id = $1 AND sender_id ~ '^[0-9]{1,32}$' AND captured_at >= now() - make_interval(hours => $2)
               GROUP BY sender_id ORDER BY max(captured_at) DESC, sender_id`,
});

/**
 * Đọc DB rồi chọn. DB chưa áp 079 thì không có liên lạc sdt để loại — dừng (exit 2 ở CLI); chưa áp 080 thì chỉ đếm snapshot.
 * U1(8): đọc thêm SPOOL của bộ tra (lookupDir) — mã đã tra nhưng chưa gửi được
 * tới collector coi như đã tra, không chọn lại.
 * @param {import("pg").Client} c
 */
export async function docVaChon(c, { snapshots, lookupDir, bayGio = new Date(), ...tuy } = {}) {
  if (!(await c.query("SELECT to_regclass('party_contacts') IS NOT NULL AS co")).rows[0].co) throw new Error("CHUA-AP-079");
  const gopVao = new Map((await c.query(SQL_LL.gop)).rows.map((r) => [r.party_key, r.merged_into]));
  const nguoiCuaMa = new Map((await c.query(SQL_LL.taiKhoan, [NGUON_LIEN_LAC])).rows.map((r) => [r.value, nguoiCuoi(gopVao, r.object_key)]));
  const coSo = [...(await c.query(SQL_CM.sdtLienLac)).rows.map((r) => r.party_key),
    ...(await c.query(SQL_CM.sdtBiDanh)).rows.map((r) => r.object_key)];
  const nguoiCoSo = new Set(coSo.map((k) => nguoiCuoi(gopVao, k)));
  const daTra = snapshots ? maTrongSnapshot(snapshots, new Date(bayGio.getTime() - NGAY_KHONG_TRA_LAI * 864e5)) : new Set();
  if (lookupDir) for (const m of maTrongSpool(lookupDir)) daTra.add(m);
  if ((await c.query("SELECT to_regclass($1) IS NOT NULL AS co", [STG_HO_SO])).rows[0].co) {
    for (const r of (await c.query(SQL_CM.daTra, [NGAY_KHONG_TRA_LAI])).rows) daTra.add(r.ma_tai_khoan);
  }
  const taiKhoan = (await c.query(SQL_CM.taiKhoan, [NGUON_LIEN_LAC])).rows;
  const guiGanDay = (await c.query(SQL_CM.guiGanDay, [KENH_LIEN_LAC, GIO_DOI_CHUNG])).rows.map((r) => r.sender_id);
  return chonMa(taiKhoan, nguoiCuaMa, nguoiCoSo, daTra, guiGanDay, tuy);
}
