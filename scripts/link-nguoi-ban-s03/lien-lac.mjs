// lien-lac.mjs — E7 (AC-7, backend-effect): bộ ghi liên lạc hồ sơ thật (pipeline/lib/lien-lac-ho-so.mjs) trên DB thử có 079, 080,
// trong một giao dịch ROLLBACK. Dữ liệu tra là mã tài khoản S03 thật của DB thử cộng username giả; không in mã hay username.
import { nap079 } from "../../pipeline/lib/nap-079.mjs";
import { RULE_HO_SO, nap080 } from "../../pipeline/lib/nap-080.mjs";
import { LY_DO_BO, LY_DO_DOI, ghiLienLacHoSo } from "../../pipeline/lib/lien-lac-ho-so.mjs";
import { boKiem, trongGiaoDich } from "./chung.mjs";

const im = () => {};

async function dem(c) {
  const q = async (sql) => (await c.query(sql)).rows[0];
  return {
    bi_danh: (await q("SELECT count(*)::int n FROM registry_aliases")).n,
    nguoi: (await q("SELECT count(*)::int n, count(*) FILTER (WHERE status = 'merged')::int g FROM parties")),
    sdt: (await q(`SELECT md5(coalesce(string_agg(id || '|' || value || '|' || coalesce(retracted_at::text, ''), ',' ORDER BY id), '')) h
                     FROM party_contacts WHERE kind = 'sdt'`)).h,
    tin: (await q(`SELECT md5(coalesce(string_agg(offer_id || '|' || coalesce(seller_phone, '') || '|' || coalesce(field_provenance::text, ''),
                     ',' ORDER BY offer_id), '')) h FROM sale_offer_records`)).h,
  };
}

const lienLacHoSo = async (c) => (await c.query(
  `SELECT id, party_key, kind, value, evidence_tier, method, rule_id, evidence, retracted_at, retract_reason
     FROM party_contacts WHERE rule_id = $1 ORDER BY id`, [RULE_HO_SO])).rows;

let lan = 0;
async function themStg(c, dong) {
  for (const d of dong) {
    lan++;
    await c.query(`INSERT INTO stg_s03_ho_so (source_id, ma_tai_khoan, username, loai, captured_at) VALUES ($1, $2, $3, $4, $5)`,
      [`${d.ma}__lnb-${lan}`, d.ma, d.username ?? "", d.loai, d.luc]);
  }
}

export async function chay() {
  const k = boKiem("lien-lac");
  await trongGiaoDich(async (c) => {
    await nap079(c);
    await nap080(c);

    // Thiếu 079 / 080 → in mã, không ghi (savepoint, rồi lùi lại).
    for (const [ma, pha] of [["CHUA-AP-080", "DROP VIEW stg_s03_ho_so_moi_nhat"], ["CHUA-AP-079", "ALTER TABLE party_contacts RENAME TO party_contacts_an"]]) {
      await c.query("SAVEPOINT thieu");
      await c.query(pha);
      const dong = [];
      const r = await ghiLienLacHoSo(c, { runId: "lnb-thieu", out: (s) => dong.push(s) });
      k.kiem(`thiếu migration phải trả ${ma}`, r.bo_qua === ma && dong.some((s) => s.includes(ma)));
      await c.query("ROLLBACK TO SAVEPOINT thieu");
    }

    // Năm Người S03 thật có mã toàn chữ số, khác nhau.
    const nguoi = (await c.query(
      `SELECT DISTINCT ON (a.object_key) a.value AS ma, a.object_key AS p
         FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key AND p.status = 'active'
        WHERE a.retired_at IS NULL AND a.source = 'S03' AND a.kind = 'tai_khoan_nguon' AND a.value ~ '^[0-9]+$'
        ORDER BY a.object_key, a.value LIMIT 5`)).rows;
    if (nguoi.length < 5) throw new Error("DB thử cần ≥ 5 Người S03 có mã tài khoản");
    const [n1, n2, n3, n4, n5] = nguoi;
    // Người đã gộp: n3 gộp vào n4 — liên lạc của mã n3 phải về n4.
    await c.query("UPDATE parties SET status = 'merged', merged_into = $2 WHERE party_key = $1", [n3.p, n4.p]);
    // Liên lạc khác luật của cùng Người (hitl) — không được đụng.
    const hitl = (await c.query(
      `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, evidence, run_id)
       VALUES ($1, 'sdt', '+84912000001', 'fact', 'hitl', 'so_tren_tin', '{}', 'lnb-hitl') RETURNING id`, [n1.p])).rows[0].id;
    const truoc = await dem(c);

    const t0 = new Date(Date.now() - 3 * 864e5);
    const t1 = new Date(Date.now() - 2 * 864e5);
    await themStg(c, [
      { ma: n1.ma, username: "lnb.u1", loai: "co-username", luc: t1 },
      { ma: n2.ma, username: "lnb.u2cu", loai: "co-username", luc: t0 }, // dòng cũ hơn của cùng mã — phải lấy dòng mới
      { ma: n2.ma, username: "lnb.u2", loai: "co-username", luc: t1 },
      { ma: n3.ma, username: "lnb.u3", loai: "co-username", luc: t1 },
      { ma: n4.ma, username: "", loai: "khong-ro", luc: t1 },
      { ma: n5.ma, username: "", loai: "khong-username", luc: t1 },
      { ma: "999000000000000001", username: "lnb.lac", loai: "co-username", luc: t1 }, // không khớp Người
      { ma: `${n1.ma}_0`, username: "lnb.hau-to", loai: "co-username", luc: t1 }, // userId mang hậu tố — lệch mã
      { ma: "999000000000000002", username: "lnb.link/x", loai: "co-username", luc: t0 }, // không khớp Người
    ]);
    const r1 = await ghiLienLacHoSo(c, { runId: "lnb-1", out: im });
    const ll1 = await lienLacHoSo(c);
    k.kiem(`lượt 1 thêm đúng 3 liên lạc (thêm ${r1.them})`, r1.them === 3 && ll1.length === 3);
    k.kiem("lượt 1 đếm không khớp Người 2, mã sai khuôn 1, không rõ 1, không username 1",
      r1.khong_nguoi === 2 && r1.ma_sai_khuon === 1 && r1.khong_ro === 1 && r1.khong_username === 1);
    const theo = (u) => ll1.find((l) => l.value === u);
    k.kiem("mã n1 → Người n1, username trần", theo("lnb.u1")?.party_key === n1.p);
    k.kiem("lấy dòng mới nhất của mã (không ghi username cũ)", theo("lnb.u2")?.party_key === n2.p && !theo("lnb.u2cu"));
    k.kiem("Người đã gộp → ghi vào Người đích", theo("lnb.u3")?.party_key === n4.p);
    k.kiem("mọi liên lạc: chat_profile, fact, source_field, bằng chứng có mã và thời điểm", ll1.every((l) =>
      l.kind === "chat_profile" && l.evidence_tier === "fact" && l.method === "source_field" && l.rule_id === RULE_HO_SO
      && typeof l.evidence?.ma_tai_khoan === "string" && l.evidence?.captured_at && !/[/:]/.test(l.value)));

    const r2 = await ghiLienLacHoSo(c, { runId: "lnb-2", out: im });
    k.kiem(`chạy lại thêm 0 (thêm ${r2.them}, rút ${r2.rut_doi + r2.rut_bo})`, r2.them === 0 && r2.rut_doi === 0 && r2.rut_bo === 0 && r2.giu === 3);

    const t2 = new Date(Date.now() - 864e5);
    await themStg(c, [
      { ma: n1.ma, username: "lnb.u1moi", loai: "co-username", luc: t2 },
      { ma: n2.ma, username: "", loai: "khong-tim-thay", luc: t2 },
      { ma: n3.ma, username: "", loai: "khong-username", luc: t2 },
    ]);
    const r3 = await ghiLienLacHoSo(c, { runId: "lnb-3", out: im });
    const ll3 = await lienLacHoSo(c);
    const cu1 = ll3.find((l) => l.value === "lnb.u1");
    const cu2 = ll3.find((l) => l.value === "lnb.u2");
    k.kiem("username đổi → rút cũ lý do doi-username, thêm mới",
      cu1?.retract_reason === LY_DO_DOI && ll3.some((l) => l.value === "lnb.u1moi" && l.retracted_at === null && l.party_key === n1.p));
    k.kiem("tra lại ra khong-tim-thay → rút lý do bo-username", cu2?.retract_reason === LY_DO_BO);
    const cu3 = ll3.find((l) => l.value === "lnb.u3");
    k.kiem("tra lại ra khong-username → rút lý do bo-username", cu3?.retract_reason === LY_DO_BO);
    k.kiem("lượt 3: thêm 1, rút đổi 1, rút bỏ 2", r3.them === 1 && r3.rut_doi === 1 && r3.rut_bo === 2);
    k.kiem("liên lạc hitl khác luật của cùng Người còn nguyên",
      (await c.query("SELECT retracted_at FROM party_contacts WHERE id = $1", [hitl])).rows[0].retracted_at === null);

    const sau = await dem(c);
    k.kiem("số bí danh không đổi", sau.bi_danh === truoc.bi_danh);
    k.kiem("số Người không đổi", sau.nguoi.n === truoc.nguoi.n && sau.nguoi.g === truoc.nguoi.g);
    k.kiem("liên lạc sdt không đổi", sau.sdt === truoc.sdt);
    k.kiem("sale_offers không đổi", sau.tin === truoc.tin);
  });
  return k.ketThuc();
}
