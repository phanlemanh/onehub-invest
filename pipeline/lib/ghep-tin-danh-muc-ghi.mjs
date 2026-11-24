// ghep-tin-danh-muc-ghi.mjs — PL20 ghep-tin-vao-danh-muc: ghi kết quả luật gắn thành phát biểu trên từng bài S03.
// Chạy cuối lượt nạp, trong giao dịch riêng: lỗi ở đây chỉ in một dòng cảnh báo, không làm hỏng lượt nạp (thiết kế §3 «Chạy định kỳ»).
import { subjectKey, writeAssertions } from "./assert.mjs";
import { RULE, TAT_CA_NGUON } from "./ghep-tin-danh-muc.mjs";
import { docDauVao, tinhGan } from "./ghep-tin-danh-muc-doc.mjs";
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "./vocab.generated.mjs";

export const METHOD_VERSION = "ghep-toa@1";
const LY_DO_RUT = "ghep-toa-doi";

/** JSON có khoá sắp xếp, để so căn cứ đọc từ jsonb với căn cứ vừa tính. */
const chuan = (x) => (Array.isArray(x) ? x.map(chuan)
  : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, chuan(x[k])])) : x);
const khoaDong = (d) => JSON.stringify([d.subject_key, d.field, String(d.value), d.method, d.rule_id, chuan(d.evidence ?? {})]);

/**
 * Dòng phát biểu muốn có: mức toà ghi UPI của toà, mức vùng ghi id nút; mỗi bài gắn được một dòng.
 * @param {Map<string, {muc?: 'toa'|'vung', k?: string|number, rule_id?: string, can_cu?: object, du_an?: string}>} ketQuaBai
 * @param {Map<string, {upi: Map<string, string>}>} danhBa danh bạ theo dự án
 */
export function dongPhatBieu(ketQuaBai, danhBa) {
  const ra = [];
  for (const [post_id, x] of ketQuaBai) {
    if (!x.muc || !x.rule_id) continue;
    const laToa = x.muc === "toa";
    ra.push({
      subject_key: subjectKey("S03", post_id),
      field: laToa ? ASSERTION_FIELD.universal_property_id : ASSERTION_FIELD.subzone_node_id,
      value: laToa ? danhBa.get(String(x.du_an)).upi.get(x.k) : String(x.k),
      evidence_tier: EVIDENCE_TIER.inferred,
      method: x.rule_id === RULE.model ? ASSERTION_METHOD.e2_llm : ASSERTION_METHOD.e1_rule,
      method_version: METHOD_VERSION,
      rule_id: x.rule_id,
      evidence: x.can_cu ?? {},
    });
  }
  return ra;
}

/**
 * Đưa các dòng sống của bốn rule_id về đúng `dong`: rút dòng không còn đúng rồi chèn dòng mới, trong một giao dịch.
 * Lượt khác đang giữ khoá thì bỏ lượt này.
 * @returns {Promise<{chen: number, rut: number, bo_luot?: boolean}>}
 */
export async function ghiGan(client, dong) {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL statement_timeout = '60s'");
    const { rows: [{ duoc }] } = await client.query(`SELECT pg_try_advisory_xact_lock(hashtext('ghep-toa')) AS duoc`);
    if (!duoc) {
      await client.query("ROLLBACK");
      return { chen: 0, rut: 0, bo_luot: true };
    }
    const { rows: song } = await client.query(
      `SELECT id, subject_key, field, value, method, rule_id, evidence FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [[...TAT_CA_NGUON]]);
    const muon = new Map(dong.map((d) => [khoaDong(d), d]));
    const daCo = new Set(), rutId = [];
    for (const d of song) {
      const k = khoaDong(d);
      if (muon.has(k) && !daCo.has(k)) daCo.add(k); else rutId.push(d.id);
    }
    if (rutId.length) {
      await client.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = $2 WHERE id = ANY ($1::bigint[])`, [rutId, LY_DO_RUT]);
    }
    const { inserted } = await writeAssertions(client, [...muon].filter(([k]) => !daCo.has(k)).map(([, d]) => d));
    await client.query("COMMIT");
    return { chen: inserted, rut: rutId.length };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

/** Bước cuối lượt nạp S03. Không bao giờ ném: mọi lỗi thành đúng một dòng `JOB WARN [ghep-toa]`. */
export async function buocGhepToa(client, { log = console.warn } = {}) {
  try {
    const { rows: [{ co }] } = await client.query(`SELECT to_regclass('public.offer_building') IS NOT NULL AS co`);
    if (!co) return log("JOB WARN [ghep-toa] chưa áp migration 117, bỏ qua lượt gắn");
    const vao = await docDauVao(client);
    const { ketQuaBai, dem } = tinhGan(vao);
    const dong = dongPhatBieu(ketQuaBai, vao.danhBa);
    // Đầu vào rỗng bất thường thì giữ nguyên dữ liệu, không rút trọn các dòng đang sống.
    if (!dong.length) return log("JOB WARN [ghep-toa] không có dòng nào để ghi, giữ nguyên dữ liệu");
    const r = await ghiGan(client, dong);
    if (r.bo_luot) return log("JOB WARN [ghep-toa] lượt khác đang ghi, bỏ lượt này");
    console.log(`ghep-toa: ${dem.gan}/${dem.tong} tin gắn · ${dem.xung_dot} xung đột · chèn ${r.chen} · rút ${r.rut}`);
  } catch (e) {
    log(`JOB WARN [ghep-toa] ${e.message}`);
  }
}
