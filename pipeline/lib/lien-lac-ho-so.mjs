// lien-lac-ho-so.mjs — link-nguoi-ban-s03 (AC-7): liên lạc chat_profile của Người S03 từ kết quả tra hồ sơ theo mã tài khoản
// (stg_s03_ho_so, migration 080). Liên lạc là phát biểu (ADR-0016 §3): bước này không thêm bí danh, không gộp Người, không đụng
// liên lạc sdt hay sale_offers. Giá trị là username trần; link hồ sơ dựng lúc hiển thị từ source_registry local. Phần quyết tách khỏi DB.
import { KHOA_DANH_BA, nguoiCuoi } from "./danh-ba-nguoi.mjs";
import { SQL_LL, NGUON_LIEN_LAC } from "./lien-lac-nguoi.mjs";
import { daCoBang079 } from "./nap-079.mjs";
import { RULE_HO_SO, daCo080 } from "./nap-080.mjs";
import { ASSERTION_METHOD, CONTACT_KIND, EVIDENCE_TIER } from "./vocab.generated.mjs";

/** Bốn loại kết quả của bộ tra (DATA-CONTRACT, kind ho-so). */
export const LOAI_HO_SO = Object.freeze({
  co: "co-username",
  khong: "khong-username",
  khongRo: "khong-ro",
  khongThay: "khong-tim-thay",
});
/** Lý do rút liên lạc hồ sơ. */
export const LY_DO_DOI = "doi-username";
export const LY_DO_BO = "bo-username";

/** Mã tài khoản S03 hợp lệ: toàn chữ số — mã mang hậu tố hay tiền tố không khớp bí danh nào, không tự cắt. */
const MA = /^\d{1,32}$/;
/** Username trần: không link, không khoảng trắng (cùng khuôn rào party_contacts_rule_kind_chk của 080). */
const USERNAME = /^[^/:\s]{1,120}$/;

/**
 * Quyết liên lạc của lượt từ kết quả tra mới nhất mỗi mã. Thuần.
 * - co-username + username đúng khuôn + mã khớp Người → một liên lạc chat_profile ở Người cuối chuỗi gộp.
 * - Liên lạc sống cùng mã mà username khác → rút `doi-username` rồi thêm mới; lần tra mới ra khong-username hay khong-tim-thay
 *   → rút `bo-username`. khong-ro không đổi gì.
 * - Mã sai khuôn, không khớp Người, username sai khuôn → không ghi, đếm.
 * @param {{ source_id: string, ma_tai_khoan: string, username: string|null, loai: string|null, captured_at: string|Date|null }[]} hoSo
 * @param {Map<string, string>} nguoiCuaMa mã tài khoản → party_key cuối chuỗi gộp
 * @param {{ id: number|string, party_key: string, value: string, evidence: { ma_tai_khoan?: string } | null }[]} song liên lạc
 *   sống của luật hồ sơ
 */
export function quyetLienLacHoSo(hoSo, nguoiCuaMa, song) {
  const dem = {
    co_username: 0, them: 0, giu: 0, rut_doi: 0, rut_bo: 0, khong_username: 0, khong_tim_thay: 0, khong_ro: 0,
    khong_nguoi: 0, ma_sai_khuon: 0, username_sai_khuon: 0, loai_la: 0,
  };
  const theoMa = new Map();
  for (const l of song) {
    const ma = l.evidence?.ma_tai_khoan;
    if (typeof ma === "string") (theoMa.get(ma) ?? theoMa.set(ma, []).get(ma)).push(l);
  }
  const rut = [];
  const daRut = new Set();
  const rutHet = (ds, lyDo) => {
    for (const l of ds) if (!daRut.has(l.id)) { daRut.add(l.id); rut.push({ id: l.id, ly_do: lyDo }); }
  };
  const them = [];
  const ke = (p, v) => `${p}|${v}`;
  const conSong = () => new Set(song.filter((l) => !daRut.has(l.id)).map((l) => ke(l.party_key, l.value)));
  for (const h of [...hoSo].sort((a, b) => String(a.ma_tai_khoan).localeCompare(String(b.ma_tai_khoan)))) {
    const ma = String(h.ma_tai_khoan ?? "");
    if (!MA.test(ma)) { dem.ma_sai_khuon++; continue; }
    const cu = theoMa.get(ma) ?? [];
    if (h.loai === LOAI_HO_SO.khongRo) { dem.khong_ro++; continue; }
    if (h.loai === LOAI_HO_SO.khong || h.loai === LOAI_HO_SO.khongThay) {
      dem[h.loai === LOAI_HO_SO.khong ? "khong_username" : "khong_tim_thay"]++;
      const truoc = rut.length;
      rutHet(cu, LY_DO_BO);
      dem.rut_bo += rut.length - truoc;
      continue;
    }
    if (h.loai !== LOAI_HO_SO.co) { dem.loai_la++; continue; }
    dem.co_username++;
    const party = nguoiCuaMa.get(ma);
    if (!party) { dem.khong_nguoi++; continue; }
    const username = typeof h.username === "string" ? h.username.trim() : "";
    if (!USERNAME.test(username)) { dem.username_sai_khuon++; continue; }
    if (cu.some((l) => l.value === username && l.party_key === party)) { dem.giu++; continue; }
    const truoc = rut.length;
    rutHet(cu.filter((l) => l.value !== username || l.party_key !== party), LY_DO_DOI);
    dem.rut_doi += rut.length - truoc;
    // Hai mã cùng Người, cùng username: một liên lạc (khoá sống party, loại, giá trị, luật là duy nhất).
    if (conSong().has(ke(party, username)) || them.some((t) => ke(t.party_key, t.value) === ke(party, username))) { dem.giu++; continue; }
    const capturedAt = h.captured_at instanceof Date ? h.captured_at.toISOString() : h.captured_at ?? null;
    them.push({
      party_key: party, kind: CONTACT_KIND.chat_profile, value: username, rule_id: RULE_HO_SO,
      evidence: { ma_tai_khoan: ma, captured_at: capturedAt, source_id: h.source_id },
    });
    dem.them++;
  }
  return { them, rut, dem };
}

/** Mọi câu SQL của mô-đun. */
export const SQL_HS = Object.freeze({
  hoSo: `SELECT source_id, ma_tai_khoan, username, loai, captured_at FROM stg_s03_ho_so_moi_nhat`,
  song: `SELECT id, party_key, value, evidence FROM party_contacts WHERE retracted_at IS NULL AND rule_id = $1`,
  them: `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, evidence, run_id)
         SELECT p, '${CONTACT_KIND.chat_profile}', v, '${EVIDENCE_TIER.fact}', '${ASSERTION_METHOD.source_field}', $3, e, $4
           FROM unnest($1::text[], $2::text[], $5::jsonb[]) AS x(p, v, e)`,
  rut: `UPDATE party_contacts SET retracted_at = now(), retract_reason = $2 WHERE id = ANY($1::bigint[]) AND retracted_at IS NULL`,
});

/**
 * Ghi liên lạc hồ sơ trong giao dịch của người gọi (sau dungNguoi, cùng khoá danh bạ). Thiếu 079 hay 080 → in CHUA-AP-079 /
 * CHUA-AP-080, không đọc gì thêm, không ghi. In số đếm, không in mã hay username.
 * @param {import("pg").Client} c
 */
export async function ghiLienLacHoSo(c, { runId = new Date().toISOString(), out = console.log } = {}) {
  if (!(await daCoBang079(c))) {
    out("lien-lac-ho-so: CHUA-AP-079 — chưa có bảng party_contacts, lượt này không ghi liên lạc hồ sơ");
    return { bo_qua: "CHUA-AP-079" };
  }
  if (!(await daCo080(c))) {
    out("lien-lac-ho-so: CHUA-AP-080 — chưa có bảng stg hồ sơ S03 hay luật s03_ho_so_theo_tai_khoan, lượt này không ghi");
    return { bo_qua: "CHUA-AP-080" };
  }
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
  const hoSo = (await c.query(SQL_HS.hoSo)).rows;
  const gopVao = new Map((await c.query(SQL_LL.gop)).rows.map((r) => [r.party_key, r.merged_into]));
  const nguoiCuaMa = new Map((await c.query(SQL_LL.taiKhoan, [NGUON_LIEN_LAC])).rows.map((r) => [r.value, nguoiCuoi(gopVao, r.object_key)]));
  const song = (await c.query(SQL_HS.song, [RULE_HO_SO])).rows;
  const { them, rut, dem } = quyetLienLacHoSo(hoSo, nguoiCuaMa, song);
  for (const lyDo of [LY_DO_DOI, LY_DO_BO]) {
    const ids = rut.filter((r) => r.ly_do === lyDo).map((r) => r.id);
    if (ids.length) await c.query(SQL_HS.rut, [ids, lyDo]);
  }
  if (them.length) {
    await c.query(SQL_HS.them, [them.map((t) => t.party_key), them.map((t) => t.value), RULE_HO_SO, runId,
      them.map((t) => JSON.stringify(t.evidence))]);
  }
  out(`lien-lac-ho-so: +${dem.them} hồ sơ chat · rút ${dem.rut_doi} đổi username, ${dem.rut_bo} bỏ username · giữ ${dem.giu}`
    + ` · không khớp Người ${dem.khong_nguoi} · không rõ ${dem.khong_ro} · không username ${dem.khong_username}`
    + ` · không tìm thấy ${dem.khong_tim_thay} · sai khuôn ${dem.ma_sai_khuon + dem.username_sai_khuon + dem.loai_la}`);
  return { bo_qua: null, ...dem };
}
