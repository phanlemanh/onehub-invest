// dia-chi-the-nhom.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2): đóng dấu thẻ địa chỉ nhóm lên tin S03 lúc nạp.
// Thiết kế: docs/superpowers/specs/2026-11-16-dong-dau-dia-chi-luc-nap-design.md · Kế hoạch: docs/superpowers/plans/2026-11-17-…
//
// Ba phần, đúng khuôn mà transform-zalo đã dùng cho tầng và loại hình:
//   bộ đọc (cổng dò lược đồ + đọc thẻ đã duyệt + lọc giá trị) · hàm thuần sinh dòng phát biểu · hàm rút dòng cũ theo căn cứ.
// Khoá nhóm là tầng A: không vào `evidence`, không vào log, không lên cloud — mọi chỗ in ra dùng `card_code`.
import { khoaNhomThat } from "./eval-labels.mjs";
import { subjectKey } from "./assert.mjs";
import { RULE as RULE_DV6, docDuLieu as docDuLieuDV6, nhanDuocNhan, tinhDuAn as tinhDuAnDV6 } from "./du-an-tren-tin-s03.mjs";
import { chuan } from "./the-dia-chi-nhom.mjs";
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER, KIND } from "./vocab.generated.mjs";

export const RULE_ID = "dia-chi-the-nhom";
export const METHOD_VERSION = "dong-dau-dia-chi@1";
export const LY_DO_RUT = Object.freeze({ doiBan: "the-doi-ban", thayDV6: "thay-bang-the-nhom" });
/** Hai luật của lệnh DV6 (du-an-tren-tin-s03) mà hàng này thay trên bài nó ghi dự án — nguồn duy nhất là hằng RULE của DV6. */
export const LUAT_DV6 = Object.freeze(Object.values(RULE_DV6));

/** Ô bán/thuê của thẻ (108: ban · thue · ca_hai) sang giá trị `suyLoai` so (KIND.sale · KIND.rent_lt) — chỉ ánh xạ ở đây. */
const MUC_DICH = Object.freeze({ ban: KIND.sale, thue: KIND.rent_lt, ca_hai: null });

/**
 * DB đã có bảng thẻ VÀ cột cho nghỉ chưa (108 + 109). transform-zalo chạy trên nhiều DB; thiếu một trong hai thì bỏ bước
 * đóng dấu chứ không ném — cùng khuôn `co095` (assert.mjs).
 * @returns {Promise<boolean>}
 */
export async function coBangThe(client) {
  const { rows } = await client.query(
    `SELECT to_regclass('public.group_address_cards') IS NOT NULL
        AND EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'group_address_cards' AND column_name = 'retired_at') AS co`);
  return rows[0].co;
}

/**
 * @typedef {{ card_code: string, version: number, duAn: string|null, areaId: string|null, phanKhu: string|null,
 *             mucDich: "sale"|"rent_lt"|null }} The
 */

/**
 * Thẻ đã duyệt và còn sống (status 'da_duyet' AND retired_at IS NULL), khoá Map bằng khoá nhóm đã chuẩn hoá.
 * Ba phép biến đổi nằm trọn ở đây:
 *   (i) ô bán/thuê ánh xạ sang sale/rent_lt/null;
 *   (ii) ô dự án chỉ lấy khi thẻ có đúng MỘT nút — hai, ba nút thì không đoán (null, không tính là ô hỏng);
 *   (iii) lọc theo đúng luật trigger của 096: dự án phải là nút `project`, phường phải là `areas` cấp `submarket`, phân khu
 *        phải là nút `subzone|building`. Ô sai bị bỏ và cộng vào `oBo` — trigger 096 NÉM, một ô sai lọt qua là vỡ cả lượt nạp.
 * Giá trị bigint giữ dạng chuỗi (pg trả chuỗi), đúng dạng `field_assertions.value`.
 * @returns {Promise<{ the: Map<string, The>, oBo: { duAn: number, areaId: number, phanKhu: number } }>}
 */
export async function docTheDaDuyet(client, khoaNhom = khoaNhomThat) {
  const { rows } = await client.query(
    `SELECT c.group_key, c.card_code, c.version, c.purpose,
            cardinality(c.project_node_ids) = 1 AS mot_du_an,
            p.id::text AS du_an,
            c.area_id IS NOT NULL AS co_phuong, a.id AS phuong,
            c.subzone_node_id IS NOT NULL AS co_phan_khu, s.id::text AS phan_khu
       FROM group_address_cards c
       LEFT JOIN asset_nodes p ON cardinality(c.project_node_ids) = 1 AND p.id = c.project_node_ids[1] AND p.node_type = 'project'
       LEFT JOIN areas a ON a.id = c.area_id AND a.region_type = 'submarket'
       LEFT JOIN asset_nodes s ON s.id = c.subzone_node_id AND s.node_type IN ('subzone', 'building')
      WHERE c.status = 'da_duyet' AND c.retired_at IS NULL`);
  const the = new Map();
  const oBo = { duAn: 0, areaId: 0, phanKhu: 0 };
  for (const r of rows) {
    if (r.mot_du_an && r.du_an == null) oBo.duAn++;
    if (r.co_phuong && r.phuong == null) oBo.areaId++;
    if (r.co_phan_khu && r.phan_khu == null) oBo.phanKhu++;
    the.set(khoaNhom(r.group_key), {
      card_code: r.card_code, version: r.version,
      duAn: r.du_an ?? null, areaId: r.phuong ?? null, phanKhu: r.phan_khu ?? null,
      mucDich: r.purpose == null ? null : MUC_DICH[r.purpose] ?? null,
    });
  }
  return { the, oBo };
}

const NGUON = "S03";

/**
 * Dòng phát biểu cho bài của các nhóm có thẻ đã duyệt. Hàm thuần, không đọc DB.
 *
 * Bước 1 — theo BÀI: mỗi trường chọn đúng MỘT giá trị:
 *   dự án:    chữ bài (nhãn bạc chu_bai, trích đã kiểm, đã khớp một nút) → ô dự án của thẻ (đúng một nút) → không ghi;
 *   phường:   chữ bài đã nêu phường (cột của tin đã mang nó) → không ghi; còn lại → ô phường của thẻ;
 *   phân khu: ô phân khu của thẻ (chữ bài chỉ có phân khu dạng chữ, chưa nối nút — PL20, ngoài phạm vi).
 * Bước 2 — theo TIN, chỉ ô dự án (AC-8): offer_project đếm mọi dòng dự án sống của MỌI bài trong tin, nên đóng dấu từng bài mà
 * không nhìn cả tin là tự sinh xung đột (đo 17/11, kịch bản K1: 13 tin — 9 tin đăng lại chéo nhóm, 4 tin có bài chữ nêu dự án khác).
 *   - hai bài chữ nêu hai dự án khác nhau → bỏ mọi dòng dự án của tin (xung đột thật của chữ, không phải việc của thẻ);
 *   - đúng một dự án do chữ nêu → chữ thắng trên CẢ tin: bỏ dòng dự án từ thẻ khác giá trị ấy;
 *   - chữ im mà thẻ của các nhóm trong tin bất đồng (bài đăng lại chéo nhóm) → nếu tin ĐANG mang đúng một dự án (`duAnHienTai`,
 *     mọi luật kể cả luật này ở lượt trước) và dự án ấy nằm trong các thẻ → giữ nó, chỉ bỏ dòng của thẻ khác; còn lại không đoán,
 *     bỏ mọi dòng dự án từ thẻ. Duyệt từng đợt là lý do: thẻ thứ nhất đã cho tin một dự án, thẻ thứ hai bất đồng không được
 *     làm tin mất dự án ấy (đo 17/11 14:39Z: 10 bài một tin rơi sang «không dự án»);
 *   - bài khác cùng tin mà hàng này KHÔNG ghi dự án đang mang dòng dự án của luật khác (`duAnKhac`) khác giá trị → bỏ mọi dòng
 *     dự án của tin: hàng này chỉ rút dòng luật khác trên bài nó ghi dự án, nên đóng dấu là sinh hai dự án sống.
 *   Bỏ ô dự án KHÔNG kéo theo ô phường hay phân khu.
 * Bài của nhóm KHÔNG có thẻ đã duyệt: không ghi gì. Bài không có khoá nhóm: bỏ qua. Bài không mang mã tin: là một tin riêng.
 *
 * @param {{ bai: { post_id: string, conversation_id: string|null, posted_at?: string|null, tin?: string }[],
 *           the: Map<string, The>, nhanDuAn: Map<string, string>, phuongChu?: Set<string>,
 *           duAnKhac?: Map<string, string[]>, duAnHienTai?: Map<string, string[]> }} p
 *   `conversation_id` là khoá nhóm ĐÃ chuẩn hoá; `nhanDuAn` post_id → id nút dự án đã khớp từ chữ bài; `phuongChu` các post_id mà
 *   chữ bài đã nêu phường; `duAnKhac` post_id → giá trị các dòng dự án SỐNG của luật khác trên bài ấy; `duAnHienTai` post_id →
 *   giá trị mọi dòng dự án SỐNG trên bài ấy (mọi luật, kể cả luật này), đọc TRƯỚC khi lượt rút dòng nào.
 * @returns {{ dong: object[], baiDong: string[], demTheoNguon: { the: number, chu_bai: number, bo: number },
 *             demTin: { chuBaiThang: number, chuBaiBatDong: number, theBatDong: number, theGiuHienTai: number, xungLuatKhac: number } }}
 */
export function phatBieuDiaChiNhom({ bai, the, nhanDuAn, phuongChu = new Set(), duAnKhac = new Map(), duAnHienTai = new Map() }) {
  const khac = [];               // dòng phường, phân khu — không qua hoà giải
  const duAn = new Map();        // post_id → dòng dự án (bước 1)
  const tinCua = new Map();      // khoá tin → [post_id]
  const dongCho = (b, t, field, value, nguon_o) => ({
    subject_key: subjectKey(NGUON, b.post_id), field, value, evidence_tier: EVIDENCE_TIER.inferred, method: ASSERTION_METHOD.e1_rule,
    method_version: METHOD_VERSION, rule_id: RULE_ID, evidence: { the: t.card_code, ban: t.version, nguon_o },
    observed_at: b.posted_at ?? null,
  });
  for (const b of bai) {
    const k = b.tin ?? `bai:${b.post_id}`;
    tinCua.set(k, [...(tinCua.get(k) ?? []), b.post_id]);
    if (b.conversation_id == null) continue;
    const t = the.get(b.conversation_id);
    if (!t) continue;
    const chu = nhanDuAn.get(b.post_id);
    if (chu != null) duAn.set(b.post_id, dongCho(b, t, ASSERTION_FIELD.project_node_id, String(chu), "chu_bai"));
    else if (t.duAn != null) duAn.set(b.post_id, dongCho(b, t, ASSERTION_FIELD.project_node_id, t.duAn, "the"));
    if (t.areaId != null && !phuongChu.has(b.post_id)) khac.push(dongCho(b, t, ASSERTION_FIELD.area_id, t.areaId, "the"));
    if (t.phanKhu != null) khac.push(dongCho(b, t, ASSERTION_FIELD.subzone_node_id, t.phanKhu, "the"));
  }

  const demTin = { chuBaiThang: 0, chuBaiBatDong: 0, theBatDong: 0, theGiuHienTai: 0, xungLuatKhac: 0 };
  for (const ps of tinCua.values()) {
    const co = ps.filter((p) => duAn.has(p));
    if (!co.length) continue;
    const bo = (dk) => { let n = 0; for (const p of co) if (duAn.has(p) && dk(duAn.get(p))) { duAn.delete(p); n++; } return n; };
    const chu = new Set(co.map((p) => duAn.get(p)).filter((d) => d.evidence.nguon_o === "chu_bai").map((d) => d.value));
    if (chu.size >= 2) { bo(() => true); demTin.chuBaiBatDong++; continue; }
    if (chu.size === 1) {
      const [x] = chu;
      if (bo((d) => d.evidence.nguon_o === "the" && d.value !== x)) demTin.chuBaiThang++;
    } else {
      const theVals = new Set(co.map((p) => duAn.get(p).value));
      if (theVals.size >= 2) {
        const hienTai = new Set(ps.flatMap((p) => duAnHienTai.get(p) ?? []).map(String));
        const [v] = hienTai;
        if (hienTai.size === 1 && theVals.has(v)) { bo((d) => d.value !== v); demTin.theGiuHienTai++; }
        else { bo(() => true); demTin.theBatDong++; continue; }
      }
    }
    const conLai = new Set(ps.filter((p) => duAn.has(p)).map((p) => duAn.get(p).value));
    const ngoai = ps.filter((p) => !duAn.has(p)).flatMap((p) => duAnKhac.get(p) ?? []);
    if (conLai.size === 1 && ngoai.some((v) => !conLai.has(String(v)))) { bo(() => true); demTin.xungLuatKhac++; }
  }

  const dong = [...duAn.values(), ...khac];
  const demTheoNguon = { the: 0, chu_bai: 0, bo: 0 };
  for (const b of bai) {
    if (b.conversation_id == null || !the.has(b.conversation_id)) continue;
    const d = duAn.get(b.post_id);
    demTheoNguon[d ? d.evidence.nguon_o : "bo"]++;
  }
  return { dong, baiDong: [...new Set(dong.map((d) => d.subject_key))], demTheoNguon, demTin };
}

/**
 * Dự án do CHỮ BÀI nêu: nhãn bạc mới nhất của mỗi bài S03 có căn cứ `chu_bai` + đoạn trích đã kiểm (`nhanDuocNhan` của DV6),
 * tên khớp đúng MỘT nút dự án theo tên hay bí danh (cùng cách khớp của DV6, bỏ nút một-lời-khai). Bài có nhãn mà tên không khớp,
 * hay khớp hai nút, thì vắng mặt — để rơi về thẻ chứ không làm bài mất dự án.
 * @returns {Promise<Map<string, string>>} post_id → id nút dự án (chuỗi)
 */
export async function docNhanDuAn(client) {
  const { rows: nut } = await client.query(
    `SELECT n.id::text AS id, n.name, n.aliases FROM asset_nodes n
      WHERE n.node_type = 'project' AND (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'`);
  const theoTen = new Map();
  for (const n of nut) {
    for (const t of [n.name, ...(n.aliases ?? [])]) {
      const k = chuan(t);
      if (k) theoTen.set(k, new Set([...(theoTen.get(k) ?? []), n.id]));
    }
  }
  const { rows: nhan } = await client.query(
    `SELECT DISTINCT ON (post_id) post_id, btrim(probabilities->'o'->'project'->>'v') AS v,
            probabilities->'o'->'project'->>'cc' AS cc, probabilities->'o'->'project'->>'trich_ok' AS trich_ok
       FROM silver_labels WHERE source_code = $1
      ORDER BY post_id, labeled_at DESC, label_id DESC`, [NGUON]);
  const ra = new Map();
  for (const n of nhan) {
    if (!n.v || !nhanDuocNhan(n)) continue;
    const ids = theoTen.get(chuan(n.v));
    if (ids?.size === 1) ra.set(n.post_id, [...ids][0]);
  }
  return ra;
}

/**
 * Rút dòng cũ của luật này trên chủ thể của lượt, TRƯỚC khi ghi dòng mới. Hai bước, hai lý do:
 *   (1) dòng mà cặp (mã thẻ, phiên bản thẻ) trong căn cứ không còn là cặp của một thẻ đã duyệt sống — thẻ được sửa, thẻ bị bác,
 *       hay nhóm được cấp thẻ mới sau khi bác (mã đổi mà phiên bản về 1) → lý do «the-doi-ban»;
 *   (2) dòng còn lại mà lượt này không phát biểu lại y hệt (chủ thể, trường, giá trị, căn cứ) → lý do «thay-boi-luot».
 * Không dựa vào `replaceOwn` của writeAssertions: nó khoá theo (chủ thể, trường, phương pháp) chứ không theo căn cứ, nên đổi
 * phiên bản mà giữ giá trị thì dòng mới bị ON CONFLICT nuốt lặng và căn cứ cũ sống mãi.
 * @param {{ dong: object[], moiChuThe: string[], the: Map<string, The> }} p
 * @returns {Promise<{ rutBan: number, rutLuot: number }>}
 */
export async function rutTheCu(client, { dong, moiChuThe, the }) {
  if (!moiChuThe.length) return { rutBan: 0, rutLuot: 0 };
  const cap = [...the.values()].map((t) => `${t.card_code}|${t.version}`);
  const r1 = await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = $4
      WHERE retracted_at IS NULL AND rule_id = $1 AND subject_key = ANY ($2::text[])
        AND NOT ((evidence ->> 'the') || '|' || (evidence ->> 'ban') = ANY ($3::text[]))`,
    [RULE_ID, moiChuThe, cap, LY_DO_RUT.doiBan]);
  const giu = dong.map((d) => [d.subject_key, d.field, d.value, d.evidence.the, d.evidence.ban, d.evidence.nguon_o].join("|"));
  const r2 = await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'thay-boi-luot'
      WHERE retracted_at IS NULL AND rule_id = $1 AND subject_key = ANY ($2::text[])
        AND NOT (concat_ws('|', subject_key, field, value, evidence ->> 'the', evidence ->> 'ban', evidence ->> 'nguon_o')
                 = ANY ($3::text[]))`,
    [RULE_ID, moiChuThe, giu]);
  return { rutBan: r1.rowCount, rutLuot: r2.rowCount };
}

/**
 * AC-8, khuôn S4-r3 (GS P4-199 «đổi khuôn»): bài nay KHÔNG nhận dự án từ thẻ nữa (thẻ bị bác, sửa sang dự án khác hay 2–3 dự
 * án, ô dự án bị lọc, hoà giải mức tin bỏ) mà dòng DV6 của nó đã bị một lượt trước rút với lý do `thay-bang-the-nhom`. Trả lại
 * bằng Ý ĐỊNH HIỆN TẠI của DV6 — gọi chính hàm thuần `tinhDuAn` của DV6 trên dữ liệu DV6 đọc — chứ không hồi sinh dòng đã rút:
 * dòng cũ có thể mang giá trị DV6 đã bỏ (sổ nhóm, nhãn đổi), và hồi sinh mọi bản rút làm bài mang hai dự án sống (S4-r2).
 * DV6 là nguồn ý định duy nhất; hàm này chỉ ghi dòng DV6 muốn, cho đúng tập bài ứng viên, bằng luật/lớp/phiên bản của DV6.
 * @param {string[]} chuThe subject_key các bài của lượt KHÔNG có dòng dự án của luật này sau bước sinh
 * @param {{ tin?: {offer_id: string, post_ids: string[]}[] }} [opt] tin của lượt (thay tin đọc từ DB — lượt chưa ghi tin mới)
 * @returns {Promise<{ chen: number, ungVien: number, khongMuon: string[] }>} số dòng ghi, số bài ứng viên, bài DV6 không còn muốn
 */
export async function traLaiDV6(client, chuThe, { tin } = {}) {
  if (!chuThe.length) return { chen: 0, ungVien: 0, khongMuon: [] };
  // Ứng viên: từng bị lượt TG2 rút dòng DV6, và hiện không còn dòng DV6 sống nào (DV6 chạy lại sau rút thì thôi).
  const { rows } = await client.query(
    `SELECT DISTINCT r.subject_key
       FROM field_assertions r
      WHERE r.retract_reason = $1 AND r.rule_id = ANY ($2::text[]) AND r.subject_key = ANY ($3::text[])
        AND r.field = $4
        AND NOT EXISTS (SELECT 1 FROM field_assertions s
                         WHERE s.retracted_at IS NULL AND s.subject_key = r.subject_key AND s.field = r.field
                           AND s.rule_id = ANY ($2::text[]))`,
    [LY_DO_RUT.thayDV6, LUAT_DV6, chuThe, ASSERTION_FIELD.project_node_id]);
  const ungVien = new Set(rows.map((r) => r.subject_key));
  if (!ungVien.size) return { chen: 0, ungVien: 0, khongMuon: [] };
  const du = await docDuLieuDV6(client);
  if (tin) du.tin = tin;
  const dong = tinhDuAnDV6(du).dong.filter((d) => ungVien.has(d.subject_key));
  let chen = 0;
  if (dong.length) {
    const cot = (k) => dong.map((d) => (k === "evidence" ? JSON.stringify(d[k] ?? {}) : d[k] == null ? null : String(d[k])));
    const r = await client.query(
      `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at, changed_by)
       SELECT s, f, v, t, m, mv, r, e, clock_timestamp(), 'tra-lai-tg2'
         FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::jsonb[])
              AS x(s, f, v, t, m, mv, r, e)
        WHERE NOT EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.retracted_at IS NULL AND fa.subject_key = x.s
                            AND fa.field = x.f AND fa.rule_id = x.r AND fa.value = x.v)
       ON CONFLICT DO NOTHING`,
      ["subject_key", "field", "value", "evidence_tier", "method", "method_version", "rule_id", "evidence"].map(cot));
    chen = r.rowCount;
  }
  const muon = new Set(dong.map((d) => d.subject_key));
  return { chen, ungVien: ungVien.size, khongMuon: [...ungVien].filter((k) => !muon.has(k)) };
}
