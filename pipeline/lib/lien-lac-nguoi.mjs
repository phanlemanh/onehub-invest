// lien-lac-nguoi.mjs — enrich-nguoi-s03: sổ liên lạc của Người (party_contacts, migration 079) dựng từ bài S03 của chính người gửi.
// Liên lạc là phát biểu, khác bí danh định danh: số dùng chung liên lạc được nhiều người mà không gộp họ (ADR-0016 §3, §8;
// design docs/superpowers/specs/2026-11-06-enrich-nguoi-s03-design.md §2–§4). Phần thuần (rút liên lạc, chọn số) tách khỏi DB.
import { extractPhones } from "../transform-zalo.mjs";
import { KHOA_DANH_BA, RULE_QUA_NGUOI, nguoiCuoi } from "./danh-ba-nguoi.mjs";
import { daCoBang079 } from "./nap-079.mjs";
import { ALIAS_KIND, ASSERTION_METHOD, CONTACT_KIND, CONTACT_RULE, EVIDENCE_TIER } from "./vocab.generated.mjs";

/** Nguồn và kênh bài của vòng này (S03 = openclaw-hook); S05, S06 ngoài phạm vi. */
export const NGUON_LIEN_LAC = "S03";
export const KENH_LIEN_LAC = "openclaw-hook";
/** Lý do rút liên lạc khi số trở thành số chung (bằng chứng thay). */
export const LY_DO_SO_CHUNG = "so-chung";
/** Bài ngắn — kiểu trả lời bằng số trong nhóm; chỉ để đếm vào bằng chứng. */
export const BAI_NGAN = 40;
/** Số mã bài/tin giữ trong bằng chứng (sớm nhất theo mã); số đếm vẫn đủ. */
const TRAN_BANG_CHUNG = 5;

const sach = (s) => (typeof s === "string" && s.trim() !== "" ? s.trim() : null);
const themVao = (m, k, mac) => m.get(k) ?? m.set(k, mac()).get(k);

/**
 * Liên lạc của lượt này từ bài và tin S03. Thuần.
 * - Số của người gửi = số `extractPhones` đọc trong mọi bài của họ, cộng số trực tiếp trên tin họ đăng (`seller_ref`).
 * - Số chung (X1): số thấy ở bài hoặc tin của ≥ 2 người gửi — không sinh liên lạc cho ai. `loaiSoChung: false` CHỈ cho đối chứng.
 * - Tin mang dấu số suy qua người đăng không bao giờ là bằng chứng.
 * - Người gửi chưa có Người (chưa có tin) → bỏ, đếm `khong_nguoi`.
 * @param {{ post_id: string, sender_id: string|null, text: string|null }[]} bai
 * @param {{ offer_id: string, seller_ref: string|null, seller_phone: string|null, field_provenance?: object|null }[]} tins
 * @param {Map<string, string>} nguoiCuaTaiKhoan sender_id → party_key
 */
export function rutLienLac(bai, tins, nguoiCuaTaiKhoan, { loaiSoChung = true } = {}) {
  const theoNguoi = new Map(); // sender → Map số → { post_ids, n_bai, n_bai_ngan, offer_ids }
  const nguoiCuaSo = new Map(); // số → Set sender
  const ghi = (ai, so) => {
    themVao(nguoiCuaSo, so, () => new Set()).add(ai);
    return themVao(themVao(theoNguoi, ai, () => new Map()), so, () => ({ post_ids: [], n_bai: 0, n_bai_ngan: 0, offer_ids: [] }));
  };
  for (const b of bai) {
    const ai = sach(b.sender_id);
    if (!ai) continue;
    for (const so of extractPhones(b.text ?? "")) {
      const m = ghi(ai, so);
      m.post_ids.push(b.post_id);
      m.n_bai++;
      if ((b.text ?? "").trim().length <= BAI_NGAN) m.n_bai_ngan++;
    }
  }
  for (const t of tins) {
    const ai = sach(t.seller_ref);
    const so = sach(t.seller_phone);
    if (!ai || !so || t.field_provenance?.seller_phone?.rule_id === RULE_QUA_NGUOI) continue;
    ghi(ai, so).offer_ids.push(t.offer_id);
  }
  const chung = new Set([...nguoiCuaSo].filter(([, ng]) => ng.size >= 2).map(([so]) => so));
  const lienLac = [];
  const khongNguoi = new Set();
  for (const [ai, soMap] of [...theoNguoi].sort(([a], [b]) => a.localeCompare(b))) {
    const rieng = [...soMap].filter(([so]) => !loaiSoChung || !chung.has(so));
    if (!rieng.length) continue;
    const party_key = nguoiCuaTaiKhoan.get(ai);
    if (!party_key) { khongNguoi.add(ai); continue; }
    for (const [so, m] of rieng.sort(([a], [b]) => a.localeCompare(b))) {
      const evidence = {
        post_ids: [...new Set(m.post_ids)].sort().slice(0, TRAN_BANG_CHUNG),
        n_bai: m.n_bai,
        n_bai_ngan: m.n_bai_ngan,
        ...(m.offer_ids.length ? { offer_ids: [...new Set(m.offer_ids)].sort().slice(0, TRAN_BANG_CHUNG) } : {}),
      };
      lienLac.push({
        party_key, kind: CONTACT_KIND.sdt, value: so,
        rule_id: m.offer_ids.length ? CONTACT_RULE.so_tren_tin : CONTACT_RULE.so_trong_bai, evidence,
      });
    }
  }
  return { lienLac, chung, so_chung: chung.size, khong_nguoi: khongNguoi.size };
}

/**
 * Số chọn cho một Người (luật A, Hỏi-3): đúng một số `so_tren_tin` → số ấy; không số nào trên tin mà đúng một số `so_trong_bai` →
 * số ấy; còn lại null. Chỉ liên lạc `sdt` còn sống. Một số có cả hai luật tính là số trên tin. Thuần.
 * `uuTienBai: true` đảo thứ tự ưu tiên — CHỈ cho đối chứng của thước.
 * @param {{ id?: number|string, kind: string, value: string, rule_id: string, retracted_at?: unknown }[]} lienLac
 * @returns {{ value: string, rule_id: string, contact_id: number|string|null } | null}
 */
export function chonSoNguoi(lienLac, { uuTienBai = false } = {}) {
  const song = lienLac.filter((l) => l.kind === CONTACT_KIND.sdt && l.retracted_at == null);
  const theo = (rule) => {
    const m = new Map();
    for (const l of song) if (l.rule_id === rule && !m.has(l.value)) m.set(l.value, l);
    return m;
  };
  const tren = theo(CONTACT_RULE.so_tren_tin);
  const bai = theo(CONTACT_RULE.so_trong_bai);
  for (const v of tren.keys()) bai.delete(v);
  const [dau, sau] = uuTienBai ? [bai, tren] : [tren, bai];
  const mot = (m) => {
    const [l] = m.values();
    return { value: l.value, rule_id: l.rule_id, contact_id: l.id ?? null };
  };
  if (dau.size === 1) return mot(dau);
  if (dau.size === 0 && sau.size === 1) return mot(sau);
  return null;
}

/** Mọi câu SQL của mô-đun. */
export const SQL_LL = Object.freeze({
  bai: `SELECT DISTINCT ON (post_id) post_id, sender_id, text FROM stg_zalo_posts
         WHERE agent_id = $1 AND nullif(btrim(sender_id), '') IS NOT NULL ORDER BY post_id, captured_at DESC`,
  tin: `SELECT offer_id, seller_ref, seller_phone, field_provenance FROM sale_offer_records
         WHERE source = $1 AND seller_phone IS NOT NULL
           AND field_provenance->'seller_phone'->>'rule_id' IS DISTINCT FROM '${RULE_QUA_NGUOI}'`,
  taiKhoan: `SELECT value, object_key FROM registry_aliases
              WHERE retired_at IS NULL AND source = $1 AND kind = '${ALIAS_KIND.tai_khoan_nguon}' AND object_key LIKE 'pty\\_%'`,
  song: `SELECT c.id, c.party_key, c.kind, c.value, c.rule_id FROM party_contacts c
          JOIN parties p ON p.party_key = c.party_key WHERE c.retracted_at IS NULL AND p.source = $1`,
  them: `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, evidence, run_id)
         SELECT p, k, v, '${EVIDENCE_TIER.observed}', '${ASSERTION_METHOD.parser}', r, e, $6
           FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::jsonb[]) AS x(p, k, v, r, e)`,
  rut: `UPDATE party_contacts SET retracted_at = now(), retract_reason = $2 WHERE id = ANY($1::bigint[]) AND retracted_at IS NULL`,
  gop: `SELECT party_key, merged_into FROM parties WHERE status = 'merged'`,
});

/**
 * Dựng sổ liên lạc S03 trong giao dịch của người gọi (sau dungNguoi, cùng khoá danh bạ). Chỉ thêm; rút khi số trở thành số chung.
 * Bài bằng chứng vắng khỏi stg không làm rút gì (stg nạp lại có thể thiếu bài). DB chưa áp 079 → in CHUA-AP-079, không đọc gì thêm.
 * @param {import("pg").Client} c
 */
export async function dungLienLac(c, { runId = new Date().toISOString(), out = console.log, loaiSoChung = true } = {}) {
  const rong = { lien_lac_moi: 0, lien_lac_rut: 0, so_chung: 0, khong_nguoi: 0, theo_rule: {} };
  if (!(await daCoBang079(c))) {
    out("lien-lac-nguoi: CHUA-AP-079 — chưa có bảng party_contacts, lượt này không dựng liên lạc");
    return { ...rong, bo_qua: "CHUA-AP-079" };
  }
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
  const bai = (await c.query(SQL_LL.bai, [KENH_LIEN_LAC])).rows;
  const tins = (await c.query(SQL_LL.tin, [NGUON_LIEN_LAC])).rows;
  const nguoiCuaTaiKhoan = new Map((await c.query(SQL_LL.taiKhoan, [NGUON_LIEN_LAC])).rows.map((r) => [r.value, r.object_key]));
  const { lienLac, chung, so_chung, khong_nguoi } = rutLienLac(bai, tins, nguoiCuaTaiKhoan, { loaiSoChung });
  const song = (await c.query(SQL_LL.song, [NGUON_LIEN_LAC])).rows;
  const daCo = new Set(song.map((l) => `${l.party_key}|${l.kind}|${l.value}|${l.rule_id}`));
  const moi = lienLac.filter((l) => !daCo.has(`${l.party_key}|${l.kind}|${l.value}|${l.rule_id}`));
  const rut = loaiSoChung ? song.filter((l) => l.kind === CONTACT_KIND.sdt && chung.has(l.value)) : [];
  if (rut.length) await c.query(SQL_LL.rut, [rut.map((l) => l.id), LY_DO_SO_CHUNG]);
  if (moi.length) {
    await c.query(SQL_LL.them, [
      moi.map((l) => l.party_key), moi.map((l) => l.kind), moi.map((l) => l.value), moi.map((l) => l.rule_id),
      moi.map((l) => JSON.stringify(l.evidence)), runId,
    ]);
  }
  const theo_rule = {};
  for (const l of moi) theo_rule[l.rule_id] = (theo_rule[l.rule_id] ?? 0) + 1;
  const kq = { lien_lac_moi: moi.length, lien_lac_rut: rut.length, so_chung, khong_nguoi, theo_rule, bo_qua: null };
  out(`lien-lac-nguoi: +${moi.length} liên lạc (${Object.entries(theo_rule).map(([r, n]) => `${r}=${n}`).join(" ") || "0"}) · rút ${rut.length} số chung · số chung ${so_chung} · người gửi chưa có Người ${khong_nguoi}`);
  return kq;
}

/**
 * Số chọn cho mỗi Người cuối chuỗi gộp, từ liên lạc sống của mọi người trong chuỗi. DB chưa áp 079 → Map rỗng.
 * @param {import("pg").Client} c
 * @returns {Promise<Map<string, { value: string, rule_id: string, contact_id: number|string|null }>>}
 */
export async function docSoNguoi(c) {
  if (!(await daCoBang079(c))) return new Map();
  const gopVao = new Map((await c.query(SQL_LL.gop)).rows.map((r) => [r.party_key, r.merged_into]));
  const theo = new Map();
  for (const l of (await c.query(SQL_LL.song, [NGUON_LIEN_LAC])).rows) themVao(theo, nguoiCuoi(gopVao, l.party_key), () => []).push(l);
  const kq = new Map();
  for (const [k, ds] of theo) {
    const so = chonSoNguoi(ds);
    if (so) kq.set(k, so);
  }
  return kq;
}

/** Người cuối chuỗi gộp của mỗi tài khoản S03 — bộ gán dùng để đi từ người gửi của tin tới số của Người. */
export async function docNguoiCuaTaiKhoan(c) {
  const gopVao = new Map((await c.query(SQL_LL.gop)).rows.map((r) => [r.party_key, r.merged_into]));
  return new Map((await c.query(SQL_LL.taiKhoan, [NGUON_LIEN_LAC])).rows.map((r) => [r.value, nguoiCuoi(gopVao, r.object_key)]));
}
