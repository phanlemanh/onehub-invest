// du-an-tren-tin-s03.mjs — dự án trên tin S03 từ sổ nhóm và tên bài tự nêu (_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten).
// Hàm thuần: nhận dữ liệu đã đọc, trả dòng phát biểu project_node_id cho bài (chủ thể S03:<post_id>), tin mâu thuẫn và bảng đếm.
// Hai nguồn: (i) nhóm có đúng một dự án trong sổ nhóm → suy ra theo luật; (ii) nhãn bạc nêu tên dự án với căn cứ chữ bài và
// đoạn trích đã kiểm → quan sát. Tin có hai dự án ứng viên trở lên không ghi bài nào (đưa người duyệt bằng bảng).
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "./vocab.generated.mjs";
import { khoaNhomThat } from "./eval-labels.mjs";
import { subjectKey } from "./assert.mjs";

export const NGUON = "S03";
export const METHOD_VERSION = "du-an-tren-tin-s03@1";
export const LY_DO_RUT = "xet-lai-so-nhom-danh-ba";
/** Hai luật của lệnh — chỉ phát biểu mang hai rule_id này do lệnh rút/thay. */
export const RULE = Object.freeze({ nhom: "du-an-nhom-mot-du-an", tenBai: "du-an-ten-bai" });
/** Lớp, phương pháp của từng luật (Cổng Phạm vi 13/11, Hỏi-3: tên bài là quan sát). */
export const LOP = Object.freeze({
  [RULE.nhom]: { evidence_tier: EVIDENCE_TIER.inferred, method: ASSERTION_METHOD.e1_rule },
  [RULE.tenBai]: { evidence_tier: EVIDENCE_TIER.observed, method: ASSERTION_METHOD.e2_llm },
});
/** Căn cứ nhãn được nhận (Hỏi-4: chỉ bài tự nêu có đoạn trích đã kiểm). */
export const CAN_CU_NHAN = Object.freeze([{ cc: "chu_bai", trich_ok: true }]);

const chuan = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
const laDung = (v) => v === true || v === "true";

/** Nhãn có thuộc tập căn cứ được nhận không. */
export function nhanDuocNhan(n, canCu = CAN_CU_NHAN) {
  return canCu.some((c) => n.cc === c.cc && (c.trich_ok === undefined || laDung(n.trich_ok) === c.trich_ok));
}

/** Dạng khoá nhóm: có tiền tố «…group:» hay khoá trần. */
function dangKhoa(k) {
  const s = String(k ?? "");
  if (!s) return null;
  return khoaNhomThat(s) === s ? "tran" : "co-tien-to";
}

/**
 * @param {{
 *   nhom: {id: string|number, group_key: string, project_node_ids: (string|number)[]}[],
 *   bai: {post_id: string, conversation_id: string|null}[],
 *   nhan: {label_id: string|number, post_id: string, model?: string, v: string, cc?: string, trich?: string, trich_ok?: boolean|string}[],
 *   nut: {id: string|number, name: string, aliases?: string[]|null}[],
 *   tin: {offer_id: string, post_ids: string[]|null}[],
 *   tangCao?: {subject_key: string, evidence_tier: string}[],
 *   canCu?: {cc: string, trich_ok?: boolean}[],
 * }} vao
 */
export function tinhDuAn({ nhom, bai, nhan, nut, tin, tangCao = [], canCu = CAN_CU_NHAN }) {
  const dang = new Set();
  // (i) sổ nhóm: khoá thật → một dự án; khoá thật có hai dòng lệch dự án thì bỏ.
  // Khoá thật dùng được chỉ khi MỌI dòng sổ của nó ghi đúng một dự án và cùng một dự án; có dòng nhiều/không dự án hay
  // hai dự án khác nhau mà ít nhất một dòng một-dự-án → lệch, bỏ.
  const theoKhoa = new Map();
  for (const r of nhom) {
    const d = dangKhoa(r.group_key);
    if (d) dang.add(d);
    const k = khoaNhomThat(r.group_key);
    theoKhoa.set(k, [...(theoKhoa.get(k) ?? []), r]);
  }
  const soNhom = new Map();
  const lech = new Set();
  for (const [k, ds] of theoKhoa) {
    const mot = ds.filter((r) => (r.project_node_ids ?? []).length === 1);
    if (!mot.length) continue;
    const pids = new Set(mot.map((r) => String(r.project_node_ids[0])));
    if (mot.length !== ds.length || pids.size > 1) { lech.add(k); continue; }
    soNhom.set(k, { pid: [...pids][0], so_nhom_id: String(mot[0].id), nhom: k });
  }

  // (ii) tên → nút project (tên chuẩn hoá khớp tên hay bí danh).
  const theoTen = new Map();
  for (const n of nut) {
    for (const t of [n.name, ...(n.aliases ?? [])]) {
      const k = chuan(t);
      if (!k) continue;
      theoTen.set(k, new Set([...(theoTen.get(k) ?? []), String(n.id)]));
    }
  }

  const caoTheoBai = new Map();
  for (const r of tangCao) {
    const s = caoTheoBai.get(r.subject_key) ?? new Set();
    s.add(r.evidence_tier);
    caoTheoBai.set(r.subject_key, s);
  }
  const chan = (sk, rule) => {
    const s = caoTheoBai.get(sk);
    if (!s) return false;
    return rule === RULE.nhom ? s.has(EVIDENCE_TIER.fact) || s.has(EVIDENCE_TIER.observed) : s.has(EVIDENCE_TIER.fact);
  };

  const dem = { tin_s03: tin.length, bai_i: 0, bai_ii: 0, tin_i: 0, tin_ii: 0, trung: 0, tin_co_du_an: 0, mau_thuan: 0,
    con_lai: 0, bo_tang_cao: 0, ngoai_can_cu: 0, ten_mo_ho: 0, ten_khong_khop: 0, nhom_lech: lech.size, khoa_nhom_dang: [] };

  // Ứng viên của từng bài (đã lọc tầng cao).
  const ungVien = new Map(); // post_id → [{rule, pid, evidence}]
  for (const b of bai) {
    const d = dangKhoa(b.conversation_id);
    if (d) dang.add(d);
    const g = b.conversation_id == null ? null : soNhom.get(khoaNhomThat(b.conversation_id));
    if (!g) continue;
    const sk = subjectKey(NGUON, b.post_id);
    if (chan(sk, RULE.nhom)) { dem.bo_tang_cao++; continue; }
    ungVien.set(b.post_id, [{ rule: RULE.nhom, pid: g.pid, evidence: { nhom: g.nhom, so_nhom_id: g.so_nhom_id } }]);
  }
  for (const n of nhan) {
    const ids = theoTen.get(chuan(n.v));
    if (!ids) { dem.ten_khong_khop++; continue; }
    if (ids.size !== 1) { dem.ten_mo_ho++; continue; }
    if (!nhanDuocNhan(n, canCu)) { dem.ngoai_can_cu++; continue; }
    const sk = subjectKey(NGUON, n.post_id);
    if (chan(sk, RULE.tenBai)) { dem.bo_tang_cao++; continue; }
    const pid = [...ids][0];
    const ds = ungVien.get(n.post_id) ?? [];
    ds.push({ rule: RULE.tenBai, pid, evidence: { label_id: String(n.label_id), model: n.model ?? null, cc: n.cc ?? null, trich: n.trich ?? null } });
    ungVien.set(n.post_id, ds);
  }

  // Xét theo tin: hai dự án ứng viên trở lên → mâu thuẫn, mọi bài của tin bị chặn.
  const baiChan = new Set();
  const mauThuan = [];
  const tinTot = [];
  for (const t of tin) {
    const posts = t.post_ids ?? [];
    const uv = posts.flatMap((p) => ungVien.get(p) ?? []);
    const coI = uv.some((u) => u.rule === RULE.nhom);
    const coII = uv.some((u) => u.rule === RULE.tenBai);
    if (coI) dem.tin_i++;
    if (coII) dem.tin_ii++;
    if (coI && coII) dem.trung++;
    const pids = new Set(uv.map((u) => u.pid));
    const mau = pids.size > 1;
    if (mau) {
      dem.mau_thuan++;
      for (const p of posts) baiChan.add(p);
      mauThuan.push({ offer_id: t.offer_id, ung_vien: [...pids].sort(), nguon: [...new Set(uv.map((u) => `${u.rule}:${u.pid}`))].sort(), ly_do: "hai-du-an" });
    } else if (pids.size) tinTot.push(t);
  }

  const dong = [];
  const daGhi = new Set();
  for (const t of tinTot) {
    const tot = (t.post_ids ?? []).filter((p) => !baiChan.has(p) && (ungVien.get(p) ?? []).length);
    if (!tot.length) {
      // Mọi bài mang ứng viên của tin đều thuộc một tin mâu thuẫn khác → tin cũng đưa người duyệt, không rơi im lặng.
      const uv = (t.post_ids ?? []).flatMap((p) => ungVien.get(p) ?? []);
      dem.mau_thuan++;
      mauThuan.push({ offer_id: t.offer_id, ung_vien: [...new Set(uv.map((u) => u.pid))].sort(),
        nguon: [...new Set(uv.map((u) => `${u.rule}:${u.pid}`))].sort(), ly_do: "bai-chung-tin-mau-thuan" });
      continue;
    }
    dem.tin_co_du_an++;
    for (const p of tot) {
      if (daGhi.has(p)) continue;
      daGhi.add(p);
      for (const u of ungVien.get(p)) {
        if (u.rule === RULE.nhom) dem.bai_i++; else dem.bai_ii++;
        dong.push({
          subject_key: subjectKey(NGUON, p), field: ASSERTION_FIELD.project_node_id, value: u.pid,
          ...LOP[u.rule], method_version: METHOD_VERSION, rule_id: u.rule, evidence: u.evidence,
        });
      }
    }
  }
  dem.con_lai = dem.tin_s03 - dem.tin_co_du_an - dem.mau_thuan;
  dem.khoa_nhom_dang = [...dang].sort();
  return { dong, mauThuan, dem };
}

/** Đọc dữ liệu đầu vào từ DB (chỉ đọc), từng câu một trên cùng client. */
export async function docDuLieu(client) {
  const q = async (sql, p = []) => (await client.query(sql, p)).rows;
  const nhom = await q(`SELECT id, group_key, project_node_ids FROM collection_units WHERE source_code = $1`, [NGUON]);
  const bai = await q(`SELECT DISTINCT ON (post_id) post_id, conversation_id FROM stg_zalo_posts
                        ORDER BY post_id, captured_at DESC NULLS LAST`);
  const nhan = await q(`SELECT DISTINCT ON (post_id) label_id, post_id, model, btrim(probabilities->'o'->'project'->>'v') AS v,
                               probabilities->'o'->'project'->>'cc' AS cc, probabilities->'o'->'project'->>'trich' AS trich,
                               probabilities->'o'->'project'->>'trich_ok' AS trich_ok
                          FROM silver_labels WHERE source_code = $1
                         ORDER BY post_id, labeled_at DESC, label_id DESC`, [NGUON]);
  const nut = await q(`SELECT id, name, aliases FROM asset_nodes WHERE node_type = 'project'`);
  const tin = await q(`SELECT offer_id, post_ids FROM sale_offer_records WHERE source = $1`, [NGUON]);
  const tangCao = await q(`SELECT subject_key, evidence_tier FROM field_assertions
                            WHERE field = $1 AND retracted_at IS NULL AND subject_key LIKE $2
                              AND coalesce(rule_id, '') <> ALL ($3::text[])`,
    [ASSERTION_FIELD.project_node_id, `${NGUON}:%`, Object.values(RULE)]);
  return { nhom, bai, nhan: nhan.filter((n) => n.v), nut, tin, tangCao };
}
