// gan-sdt-qua-nguoi.mjs (lib) — lõi gán số qua người đăng (enrich-nguoi-s03). Lệnh chạy tay ở pipeline/gan-sdt-qua-nguoi.mjs;
// bước đêm (refresh-bait-gap, transform-zalo) import từ đây vì chỉ được import lib.
import { createHash } from "node:crypto";

import { RULE_QUA_NGUOI } from "./danh-ba-nguoi.mjs";
import { inKhongSo } from "./in-khong-so.mjs";
import { docNguoiCuaTaiKhoan, docSoNguoi } from "./lien-lac-nguoi.mjs";
import { daCoPhanGiu068 } from "./nap-068.mjs";
import { daCoBang079, daCoNhan079 } from "./nap-079.mjs";
import { ASSERTION_METHOD, EVIDENCE_TIER } from "./vocab.generated.mjs";

/** Băm SĐT giống transform-zalo: 32 ký tự đầu sha256 của số E.164. */
export const bamSo = (so) => createHash("sha256").update(so).digest("hex").slice(0, 32);

const SQL_TIN = `SELECT offer_id, seller_ref, seller_phone, seller_phone_hash, field_provenance -> 'seller_phone' AS fp
                   FROM sale_offer_records WHERE source = 'S03'`;
const SQL_GHI = `UPDATE sale_offer_records r SET
                   seller_phone = x.so,
                   seller_phone_hash = x.bam,
                   field_provenance = CASE WHEN x.fp IS NULL THEN r.field_provenance - 'seller_phone'
                                           ELSE r.field_provenance || jsonb_build_object('seller_phone', x.fp) END
                   FROM unnest($1::text[], $2::text[], $3::text[], $4::jsonb[]) AS x(id, so, bam, fp)
                  WHERE r.offer_id = x.id AND r.source = 'S03'`;

/** Hai dấu xuất xứ bằng nhau bất kể thứ tự khoá (jsonb sắp lại khoá khi lưu). */
const cungDau = (a, b) => {
  const chuan = (o) => JSON.stringify(Object.keys(o ?? {}).sort().map((k) => [k, o[k]]));
  return chuan(a) === chuan(b);
};

/**
 * Việc cho từng tin S03. Thuần.
 * @param {{ offer_id, seller_ref, seller_phone, seller_phone_hash, fp }[]} tins
 * @param {Map<string, string|null> | undefined} rieng số riêng của tin do transform vừa ghi (vắng: suy từ dấu)
 * @param {Map<string, string>} nguoiCuaTaiKhoan sender_id → Người cuối chuỗi gộp
 * @param {Map<string, {value, rule_id, contact_id}>} soNguoi Người → số đã chọn
 * @param {{ ghiSuyMoi: boolean }} o false khi view chưa nhận dấu (079): không ghi số suy mới, vẫn rút
 * @returns {{ offer_id, so, bam, fp, viec: "gan"|"rut"|"bo_dau", rule_id?: string }[]} chỉ dòng đổi
 */
export function quyetGan(tins, rieng, nguoiCuaTaiKhoan, soNguoi, { ghiSuyMoi }) {
  const doi = [];
  for (const t of tins) {
    const dangSuy = t.fp?.rule_id === RULE_QUA_NGUOI;
    const soRieng = rieng?.has(t.offer_id) ? rieng.get(t.offer_id) : dangSuy ? null : t.seller_phone;
    if (soRieng) {
      if (dangSuy) doi.push({ offer_id: t.offer_id, so: soRieng, bam: bamSo(soRieng), fp: null, viec: "bo_dau" });
      continue;
    }
    const party_key = t.seller_ref ? nguoiCuaTaiKhoan.get(t.seller_ref) : undefined;
    const chon = party_key ? soNguoi.get(party_key) : undefined;
    if (chon && (ghiSuyMoi || (dangSuy && t.seller_phone === chon.value))) {
      const fp = { tier: EVIDENCE_TIER.inferred, method: ASSERTION_METHOD.e1_rule, rule_id: RULE_QUA_NGUOI,
        party_key, contact_id: chon.contact_id == null ? null : String(chon.contact_id), contact_rule: chon.rule_id, measured: false };
      const bam = bamSo(chon.value);
      if (t.seller_phone === chon.value && t.seller_phone_hash === bam && cungDau(t.fp, fp)) continue;
      doi.push({ offer_id: t.offer_id, so: chon.value, bam, fp, viec: "gan", rule_id: chon.rule_id });
      continue;
    }
    if (dangSuy) doi.push({ offer_id: t.offer_id, so: null, bam: null, fp: null, viec: "rut" });
  }
  return doi;
}

/**
 * Gán số qua người đăng cho mọi tin S03, kể cả tin đã nghỉ. Trả số đếm, không trả số điện thoại.
 * Chưa áp 068 (hàm phân xử không giữ khoá seller_phone) → không ghi. Chưa áp 079 (chưa bảng liên lạc) → không ghi.
 * View chưa nhận dấu (079 bị ghi đè) → không ghi số suy mới, vẫn rút và bỏ dấu.
 * @param {import("pg").Client} client
 * @param {{ rieng?: Map<string, string|null> }} [o]
 */
export async function ganSdtQuaNguoi(client, { rieng, out = console.log } = {}) {
  const rong = { doi: 0, gan: 0, rut: 0, bo_dau: 0, theo_rule: {} };
  if (!(await daCoPhanGiu068(client))) {
    out("gán số qua người đăng: CHUA-AP-068 — hàm phân xử chưa giữ khoá seller_phone, lượt này không ghi");
    return { ...rong, bo_qua: "CHUA-AP-068" };
  }
  if (!(await daCoBang079(client))) {
    out("gán số qua người đăng: CHUA-AP-079 — chưa có bảng party_contacts, lượt này không ghi");
    return { ...rong, bo_qua: "CHUA-AP-079" };
  }
  const coNhan = await daCoNhan079(client);
  if (!coNhan) out("gán số qua người đăng: CHUA-AP-079 — view sale_offers chưa nhận dấu, lượt này không ghi số suy mới");
  const tins = (await client.query(SQL_TIN)).rows;
  const doi = quyetGan(tins, rieng, await docNguoiCuaTaiKhoan(client), await docSoNguoi(client), { ghiSuyMoi: coNhan });
  if (doi.length) {
    await client.query(SQL_GHI, [doi.map((d) => d.offer_id), doi.map((d) => d.so), doi.map((d) => d.bam),
      doi.map((d) => (d.fp ? JSON.stringify(d.fp) : null))]);
  }
  const dem = (v) => doi.filter((d) => d.viec === v).length;
  const theo_rule = {};
  for (const d of doi) if (d.viec === "gan") theo_rule[d.rule_id] = (theo_rule[d.rule_id] ?? 0) + 1;
  const kq = { doi: doi.length, gan: dem("gan"), rut: dem("rut"), bo_dau: dem("bo_dau"), theo_rule, bo_qua: coNhan ? null : "CHUA-AP-079" };
  out(inKhongSo(dongGan(kq)));
  return kq;
}

/** Một dòng log theo bậc, không mang số điện thoại. */
export function dongGan(kq) {
  const bac = Object.entries(kq.theo_rule).map(([r, n]) => `${r}=${n}`).join(" ") || "0";
  return `gán số qua người đăng: đổi ${kq.doi} · gán ${kq.gan} (${bac}) · rút ${kq.rut} · bỏ dấu ${kq.bo_dau}`;
}
