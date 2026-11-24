// ghep-tin-truc-can-ghi.mjs — PL36 ghep-tin-vao-truc-can: ghi kết quả luật gắn thành phát biểu trên từng bài S03.
// Chạy cuối lượt nạp ngay sau bước gắn toà, trong giao dịch riêng: lỗi ở đây chỉ in một dòng cảnh báo, không làm hỏng lượt nạp.
import { subjectKey, writeAssertions } from "./assert.mjs";
import { RULE, TAT_CA_NGUON, subId } from "./ghep-tin-truc-can.mjs";
import { docDauVao, tinhGan } from "./ghep-tin-truc-can-doc.mjs";
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "./vocab.generated.mjs";

export const METHOD_VERSION = "ghep-can@1";
const LY_DO_RUT = "ghep-can-doi";

const chuan = (x) => (Array.isArray(x) ? x.map(chuan)
  : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, chuan(x[k])])) : x);
const khoaDong = (d) => JSON.stringify([d.subject_key, d.field, String(d.value), d.method, d.rule_id, chuan(d.evidence ?? {})]);

/** Dòng phát biểu muốn có: mỗi bài gắn được một dòng trục/căn, thêm một dòng tầng khi tầng suy từ mã căn. */
export function dongPhatBieu(ketQuaBai) {
  const ra = [];
  const dong = (post_id, field, value, rule_id, evidence) => ra.push({
    subject_key: subjectKey("S03", post_id), field, value, evidence_tier: EVIDENCE_TIER.inferred,
    method: ASSERTION_METHOD.e1_rule, method_version: METHOD_VERSION, rule_id, evidence,
  });
  for (const [post_id, x] of ketQuaBai) {
    if (!x.muc || !x.rule_id) continue;
    dong(post_id, ASSERTION_FIELD.universal_property_sub_id, subId(x), x.rule_id, x.can_cu ?? {});
    if (x.tangTuMa) dong(post_id, ASSERTION_FIELD.floor_raw, x.tangTuMa, RULE.tangTuMa, { ma: x.can_cu?.ma, nguon: "ma-can" });
  }
  return ra;
}

/**
 * Đưa các dòng sống của bốn rule_id về đúng `dong`: rút dòng không còn đúng rồi chèn dòng mới, trong một giao dịch.
 * Lượt khác đang giữ khoá thì bỏ lượt này.
 */
export async function ghiGan(client, dong) {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL statement_timeout = '60s'");
    const { rows: [{ duoc }] } = await client.query(`SELECT pg_try_advisory_xact_lock(hashtext('ghep-can')) AS duoc`);
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

/** Bước cuối lượt nạp S03, sau bước gắn toà. Không bao giờ ném: mọi lỗi thành đúng một dòng `JOB WARN [ghep-can]`. */
export async function buocGhepCan(client, { log = console.warn } = {}) {
  try {
    const { rows: [{ co }] } = await client.query(`SELECT to_regclass('public.offer_unit') IS NOT NULL AS co`);
    if (!co) return log("JOB WARN [ghep-can] chưa áp migration 131, bỏ qua lượt gắn");
    const vao = await docDauVao(client);
    const { ketQuaBai, dem } = tinhGan(vao);
    const dong = dongPhatBieu(ketQuaBai);
    // Đầu vào rỗng bất thường (bước gắn toà chưa chạy, danh bạ trống) thì giữ nguyên dữ liệu, không rút trọn các dòng đang sống.
    if (!dong.length) return log("JOB WARN [ghep-can] không có dòng nào để ghi, giữ nguyên dữ liệu");
    const r = await ghiGan(client, dong);
    if (r.bo_luot) return log("JOB WARN [ghep-can] lượt khác đang ghi, bỏ lượt này");
    console.log(`ghep-can: ${dem.truc + dem.can}/${dem.tong} bài gắn (trục ${dem.truc} · căn ${dem.can}) · chèn ${r.chen} · rút ${r.rut}`);
  } catch (e) {
    log(`JOB WARN [ghep-can] ${e.message}`);
  }
}
