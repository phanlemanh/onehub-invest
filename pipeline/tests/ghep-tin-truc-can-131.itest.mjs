// ghep-tin-truc-can-131.itest.mjs — PL36: migration 131 + 138, trường trục/căn trên tin, view offer_unit, offer_building nhanh (AC-4, AC-5, AC-7).
// Chạy: bash db/db-thu.sh oneinvest_suite_pl36 --chay node --test pipeline/tests/ghep-tin-truc-can-131.itest.mjs
// DB của riêng lượt; mỗi ca đổi dữ liệu trong BEGIN … ROLLBACK. GHEP_MIG_131, GHEP_MIG_138 trỏ bản đột biến cho probes của hồ sơ.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import pg from "pg";

import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-truc-can-doc.mjs";
import { dongPhatBieu, ghiGan } from "../lib/ghep-tin-truc-can-ghi.mjs";
import { RULE, khoaBiDanh, xetBai } from "../lib/ghep-tin-truc-can.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("ghep-tin-truc-can-131.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*");
const DOT_BIEN = { "131_": process.env.GHEP_MIG_131, "138_": process.env.GHEP_MIG_138 };
const mig = (t) => readFileSync(DOT_BIEN[t.slice(0, 4)] || new URL(`../../db/migrations/${t}`, import.meta.url), "utf8");
const TEP_131 = "131_ghep_truc_can_tren_tin.sql";
// 138 thay view offer_unit của 131 (căn đọc từ phát biểu, finding S4 vòng 3): luôn áp ngay sau 131.
const TEP_138 = "138_offer_unit_can_tu_phat_bieu.sql";
const ap131 = async () => { await c.query(mig(TEP_131)); await c.query(mig(TEP_138)); };
const SUB = "universal_property_sub_id";

let c, toa, truc, trucKhac, trucToaKhac, can, tin, obCu, coDuLieu, ketQuaThat;
before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  // DB chép từ máy thu đã có 117: nạp lại các tệp trước giữ trục phát biểu sống (sự cố 24/11).
  for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql"]) await c.query(await sqlNapLaiDayDu(c, mig(t)));
  obCu = (await c.query(`SELECT pg_get_viewdef('offer_building'::regclass) AS d`)).rows[0].d.replace(/;\s*$/, "");
  await ap131();
  const dong = async (sql, p = []) => (await c.query(sql, p)).rows;
  // Toà có từ hai trục đang hoạt động, và một trục có căn DUY NHẤT ở một tầng (finding S4 r2: ô «trục + căn ra căn» phải đo đúng
  // ô mức căn, không lặng lẽ thoái hoá thành ô «ra trục» khi tầng có hai căn).
  [toa] = await dong(`SELECT b.building_key, b.upi, s.stack_key, u.unit_key, u.floor
                        FROM buildings b JOIN stacks s USING (building_key) JOIN units u ON u.stack_key = s.stack_key
                       WHERE b.status = 'active' AND s.status = 'active' AND u.status = 'active' AND u.floor ~ '^[1-9][0-9]{0,2}[A-Z]?$'
                         AND (SELECT count(*) FROM stacks s2 WHERE s2.building_key = b.building_key AND s2.status = 'active') >= 2
                         AND (SELECT count(*) FROM units u2 WHERE u2.stack_key = s.stack_key AND u2.floor = u.floor AND u2.status = 'active') = 1
                       ORDER BY b.building_key, s.stack_key, u.floor, u.unit_key LIMIT 1`);
  coDuLieu = Boolean(toa);
  if (!coDuLieu) return;
  truc = toa.stack_key;
  can = { unit_key: toa.unit_key, floor: toa.floor };
  [{ stack_key: trucKhac }] = await dong(`SELECT stack_key FROM stacks WHERE building_key = $1 AND status = 'active' AND stack_key <> $2 ORDER BY 1 LIMIT 1`, [toa.building_key, truc]);
  [{ stack_key: trucToaKhac }] = await dong(`SELECT stack_key FROM stacks WHERE building_key <> $1 AND status = 'active' ORDER BY 1 LIMIT 1`, [toa.building_key]);
  tin = (await dong(`SELECT offer_id FROM sale_offers WHERE source = 'S03' ORDER BY offer_id LIMIT 1`))[0]?.offer_id;
});
after(async () => { await c?.end(); });

async function ca(fn) {
  await c.query("BEGIN");
  try { await fn(); } finally { await c.query("ROLLBACK"); }
}
const ghi = (bai, field, value, { rule_id = RULE.truc, resource_name = "Property", subject_key = `S03:${bai}`, evidence = { ma: "thu" } } = {}) => c.query(
  `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
   VALUES ($1, $2, $3, $4, 'inferred', 'e1_rule', 'ghep-can@1', $5, $6, now())`, [resource_name, subject_key, field, value, rule_id, evidence]);
const coToa = (bai, upi = toa.upi) => ghi(bai, "universal_property_id", upi, { rule_id: "ghep-toa-cot" });
const tinCo = (...bai) => c.query(`UPDATE sale_offer_records SET post_ids = $2 WHERE offer_id = $1`, [tin, bai]);
const doc = async () => (await c.query(`SELECT * FROM offer_unit WHERE offer_id = $1`, [tin])).rows;
const caDl = (ten, fn) => test(ten, async (t) => { if (!coDuLieu) return t.skip("DB không có toà có trục"); await ca(fn); });

// AC-4 — khuôn phát biểu
caDl("ghi-duoc-hai-muc-va-tang-tu-ma", async () => {
  await ghi("pl36t-a", SUB, `${truc}:*`, { rule_id: RULE.truc });
  await ghi("pl36t-b", SUB, `${truc}:${can.floor}`, { rule_id: RULE.ma });
  await ghi("pl36t-c", SUB, `${truc}:${can.floor}`, { rule_id: RULE.trucTang });
  await ghi("pl36t-d", "floor_raw", can.floor, { rule_id: RULE.tangTuMa });
  await coToa("pl36t-e");
});
caDl("tu-choi-truc-ngung-hoat-dong", async () => {
  await c.query(`UPDATE stacks SET status = 'retired' WHERE stack_key = $1`, [truc]);
  await assert.rejects(ghi("pl36t-f", SUB, `${truc}:*`), /universal_property_sub_id/);
});
caDl("tu-choi-sai-khuon", async () => {
  for (const v of [truc, `${truc}:09`, `${truc}:tang`, `bld_x:*`]) {
    await c.query("SAVEPOINT s");
    await assert.rejects(ghi("pl36t-g", SUB, v), /universal_property_sub_id/, `giá trị «${v}» phải bị từ chối`);
    await c.query("ROLLBACK TO SAVEPOINT s");
  }
});
caDl("tu-choi-resource-khac-property", async () => {
  await assert.rejects(ghi("x", SUB, `${truc}:*`, { resource_name: "Stack", subject_key: truc }), /universal_property_sub_id/);
});
test("tep-131-dinh-chinh-lui-cua-117", () => {
  const s = readFileSync(new URL(`../../db/migrations/${TEP_131}`, import.meta.url), "utf8");
  assert.match(s, /ĐÍNH CHÍNH 117:.*«Lùi»/s, "131 phải mang dòng đính chính chú thích «Lùi» của 117");
  assert.match(s, /lui-117\.sql/, "đính chính phải trỏ cách lùi đúng");
});
test("ap-lan-hai-khong-loi", async () => { await ap131(); });

// AC-5 — một tin một mức (tin có toà qua phát biểu ghep-toa của chính các bài thử)
caDl("hai-bai-cung-truc-ra-truc", async () => {
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2");
  await ghi("pl36t-1", SUB, `${truc}:*`); await ghi("pl36t-2", SUB, `${truc}:*`, { rule_id: RULE.ma });
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc, r?.stack_key], ["gan", "truc", truc], "ô «hai-bai-cung-truc»");
});
caDl("truc-va-can-cung-truc-ra-can", async () => {
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2");
  await ghi("pl36t-1", SUB, `${truc}:*`); await ghi("pl36t-2", SUB, `${truc}:${can.floor}`, { rule_id: RULE.ma });
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc, r?.stack_key, r?.unit_key], ["gan", "can", truc, can.unit_key], "ô «truc-va-can-cung-truc»");
});
caDl("hai-truc-khac-nhau-xung-dot-giu-toa", async () => {
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2");
  await ghi("pl36t-1", SUB, `${truc}:*`); await ghi("pl36t-2", SUB, `${trucKhac}:*`);
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc, r?.building_key, r?.stack_key], ["xung_dot", "toa", toa.building_key, null], "ô «hai-truc»");
});
caDl("truc-ngoai-toa-xung-dot-giu-toa", async () => {
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  await ghi("pl36t-1", SUB, `${trucToaKhac}:*`);
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc], ["xung_dot", "toa"], "ô «truc-ngoai-toa»");
});
caDl("tin-chi-biet-toa-giu-toa", async () => {
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc], ["gan", "toa"], "ô «chi-toa»");
});
caDl("tin-xung-dot-o-offer-building-khong-co-dong", async () => {
  const [{ upi: upi2 } = {}] = (await c.query(`SELECT upi FROM buildings WHERE status = 'active' AND building_key <> $1 ORDER BY 1 LIMIT 1`, [toa.building_key])).rows;
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2", upi2);
  await ghi("pl36t-1", SUB, `${truc}:*`);
  assert.equal((await doc()).length, 0, "ô «xung-dot-o-offer-building»");
});
// Căn khớp qua bí danh mã căn (finding S4 vòng 3, AC-3 + AC-5): căn không có stack_key, floor trong danh bạ. Luật thật ra mức căn,
// bước ghi thật (dongPhatBieu) đưa unit_key vào phát biểu, view phải ra đúng căn ấy — không hạ về mức trục.
test("bi-danh-mot-can-di-tron-ghi-den-view", async (t) => {
  const [bd] = (await c.query(`
    SELECT u.unit_key, b.building_key, b.upi, s.stack_key
      FROM units u JOIN buildings b USING (building_key)
      JOIN LATERAL (SELECT stack_key FROM stacks s WHERE s.building_key = b.building_key AND s.status = 'active' ORDER BY 1 LIMIT 1) s ON true
     WHERE u.status = 'active' AND b.status = 'active' AND u.stack_key IS NULL AND u.floor IS NULL
       AND EXISTS (SELECT 1 FROM registry_aliases a WHERE a.object_key = u.unit_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL)
     ORDER BY 1 LIMIT 1`)).rows;
  if (!bd || !tin) return t.skip("DB không có căn chỉ biết qua bí danh");
  // Danh bạ một toà «BD»: trục 3 → trục thật của toà, không căn nào ở (trục, tầng); bí danh «BD1703» → căn chỉ có bí danh.
  const d = { tenToa: [{ ten: "BD", key: bd.building_key }], truc: new Map([[bd.building_key, new Map([["3", [bd.stack_key]]])]]),
    can: new Map(), biDanh: new Map([[khoaBiDanh("BD", "17", "3"), [bd.unit_key]]]) };
  const kq = xetBai({ toa: bd.building_key, ma: ["BD.17.03"] }, d);
  assert.deepEqual([kq.muc, kq.unit, kq.tang], ["can", bd.unit_key, "17"], "luật: mã khớp một bí danh phải ra căn ấy");
  await ca(async () => {
    await tinCo("pl36t-bd"); await coToa("pl36t-bd", bd.upi);
    for (const x of dongPhatBieu(new Map([["pl36t-bd", kq]]))) {
      if (x.field === SUB) await ghi("pl36t-bd", SUB, x.value, { rule_id: x.rule_id, evidence: x.evidence });
    }
    const [r] = await doc();
    assert.deepEqual([r?.status, r?.muc, r?.stack_key, r?.floor, r?.unit_key], ["gan", "can", bd.stack_key, "17", bd.unit_key],
      `ô «bi-danh-mot-can»: căn ${bd.unit_key} qua bí danh phải hiện ở offer_unit mức căn`);
  });
});
// Dòng mức căn ghi trước 138 (chưa mang unit) tra theo trục + tầng; floor danh bạ «09» khớp tầng «9» của phát biểu (finding S4
// vòng 3: view so chuỗi thô, luật JS chuẩn hoá bằng chuanTang).
caDl("tang-so-0-dau-trong-danh-ba-van-ra-can", async () => {
  const floor0 = `0${can.floor}`;
  await c.query(`UPDATE units SET floor = $2 WHERE unit_key = $1`, [can.unit_key, floor0]);
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  await ghi("pl36t-1", SUB, `${truc}:${can.floor}`, { rule_id: RULE.ma });
  const [r] = await doc();
  assert.deepEqual([r?.muc, r?.unit_key], ["can", can.unit_key], `ô «tang-09»: floor danh bạ «${floor0}» phải khớp tầng «${can.floor}»`);
});
caDl("rule-khac-khong-vao-view", async () => {
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  await ghi("pl36t-1", SUB, `${truc}:*`, { rule_id: "khac-pl36" });
  const [r] = await doc();
  assert.equal(r?.muc, "toa", "dòng rule_id khác không được tính");
});

// AC-5 đầu–cuối: luật thật ghi trên dữ liệu của bản chép, rồi view khớp từng tin; 0 tin hai căn.
// Không bọc BEGIN … ROLLBACK: ghiGan tự mở giao dịch; DB của riêng lượt bị xoá khi lệnh dừng.
// Bộ dò «một tin hai dòng»: cùng câu cho view thật và cho bản sao có cấy dòng trùng (chiều đỏ của ô).
const haiDong = async (nguon, p = []) => (await c.query(`SELECT offer_id FROM (${nguon}) u GROUP BY 1 HAVING count(*) > 1 ORDER BY 1 LIMIT 5`, p)).rows.map((r) => r.offer_id);
test("dau-cuoi-luat-that-va-view-khop", async (t) => {
  if (!coDuLieu) return t.skip("DB không có toà có trục");
  // Rút dòng ghep-can-* có sẵn của bản chép: lượt gắn phải tự chèn lại, không dựa vào dòng cũ (finding r1, hình dạng 4).
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl36-dau-cuoi' WHERE retracted_at IS NULL AND rule_id LIKE 'ghep-can-%'`);
  const vao = await docDauVao(c);
  const { ketQuaBai } = tinhGan(vao);
  const r = await ghiGan(c, dongPhatBieu(ketQuaBai));
  if (r.bo_luot) throw new Error("khoá đang bị giữ");
  assert.ok(r.chen > 0, "lượt gắn thật không chèn dòng nào trên bản chép");
  ketQuaThat = ketQuaBai;
  // «Không xung đột» suy từ PHÁT BIỂU, không từ đầu ra của view đang kiểm (finding S4 r2, hình dạng 3): tin mức toà ở
  // offer_building có dòng ghep-can-* sống mà mọi dòng chỉ một trục, trục thuộc toà của tin → đúng một dòng offer_unit gan, mức
  // trục hay căn, stack_key bằng trục đó; ngược lại (hai trục, trục toà khác) → một dòng xung_dot giữ mức toà.
  const { rows: tin } = await c.query(`
    WITH p AS (
      SELECT o.offer_id, array_agg(DISTINCT split_part(f.value, ':', 1) ORDER BY split_part(f.value, ':', 1)) AS truc
        FROM field_assertions f
        JOIN sale_offers o ON f.subject_key = ANY (SELECT 'S03:' || p FROM unnest(o.post_ids) p)
       WHERE f.retracted_at IS NULL AND f.field = $1 AND f.rule_id IN ('ghep-can-truc', 'ghep-can-ma', 'ghep-can-truc-tang')
       GROUP BY 1)
    SELECT p.offer_id, p.truc, ob.building_key AS toa,
           (SELECT array_agg(DISTINCT s.building_key) FROM stacks s WHERE s.stack_key = ANY (p.truc) AND s.status = 'active') AS toa_truc,
           (SELECT count(*) FROM offer_unit u WHERE u.offer_id = p.offer_id)::int AS n,
           u.status, u.muc, u.stack_key
      FROM p JOIN offer_building ob ON ob.offer_id = p.offer_id AND ob.status = 'gan' AND ob.muc = 'toa'
      LEFT JOIN offer_unit u ON u.offer_id = p.offer_id`, [SUB]);
  const khongXd = (x) => x.truc.length === 1 && x.toa_truc?.length === 1 && x.toa_truc[0] === x.toa;
  const dung = (x) => x.n === 1 && (khongXd(x)
    ? x.status === "gan" && ["truc", "can"].includes(x.muc) && x.stack_key === x.truc[0]
    : x.status === "xung_dot" && x.muc === "toa" && x.stack_key === null);
  const sai = tin.filter((x) => !dung(x));
  const muc = Object.fromEntries(["truc", "can"].map((m) => [m, tin.filter((x) => khongXd(x) && x.muc === m).length]));
  const xd = tin.filter((x) => !khongXd(x)).length;
  console.log(`đầu–cuối: chèn ${r.chen} · ${tin.length} tin có dòng ghep-can (không xung đột: trục ${muc.truc} · căn ${muc.can}; xung đột ${xd}) · lệch ${sai.length}`);
  assert.ok(muc.truc + muc.can > 0, "ô đầu–cuối rỗng: không tin nào ở mức trục hay căn sau lượt gắn thật");
  assert.deepEqual(sai.map((x) => x.offer_id), [], `tin lệch mức hay stack_key: ${sai.slice(0, 5).map((x) => `${x.offer_id} [${x.truc}] → ${x.status}/${x.muc}/${x.stack_key} (${x.n} dòng)`).join(", ")}`);
  assert.deepEqual(await haiDong("SELECT * FROM offer_unit"), [], "một tin chỉ một dòng ở offer_unit (0 tin gắn hai căn)");
});
test("dau-cuoi-ba-bai-rut-tu-ban-chep", async (t) => {
  // E5 (finding S4 r2): ba bài thật của bản chép sau lượt gắn thật — cùng trục; trục + tầng (mức căn); hai trục cùng toà → xung_dot.
  if (!coDuLieu || !ketQuaThat) return t.skip("chưa có kết quả lượt gắn thật");
  const ds = [...ketQuaThat];
  const baiTruc = ds.find(([, x]) => x.muc === "truc");
  const baiCan = ds.find(([, x]) => x.muc === "can");
  const baiTrucKhac = baiTruc && ds.find(([, x]) => x.muc && x.toa === baiTruc[1].toa && x.stack !== baiTruc[1].stack);
  assert.ok(baiTruc && baiCan && baiTrucKhac, "bản chép cần một bài mức trục, một bài mức căn và hai bài khác trục cùng toà");
  await ca(async () => {
    await tinCo(baiTruc[0]);
    assert.deepEqual((await doc()).map((r) => [r.status, r.muc, r.stack_key]), [["gan", "truc", baiTruc[1].stack]], `ô «cùng trục» bài ${baiTruc[0]}`);
    await tinCo(baiCan[0]);
    assert.deepEqual((await doc()).map((r) => [r.status, r.muc, r.stack_key, r.unit_key]), [["gan", "can", baiCan[1].stack, baiCan[1].unit]], `ô «trục + tầng» bài ${baiCan[0]}`);
    await tinCo(baiTruc[0], baiTrucKhac[0]);
    assert.deepEqual((await doc()).map((r) => [r.status, r.muc, r.stack_key]), [["xung_dot", "toa", null]], `ô «hai trục» bài ${baiTruc[0]}, ${baiTrucKhac[0]}`);
  });
});
test("dau-cuoi-bo-do-hai-can-bao-dung-offer-id", async (t) => {
  if (!coDuLieu) return t.skip("DB không có toà có trục");
  // Chiều đỏ của «0 tin hai căn»: cấy một dòng trùng của một tin vào bản sao của view, bộ dò phải báo đúng offer_id đó.
  const [{ offer_id } = {}] = (await c.query(`SELECT offer_id FROM offer_unit ORDER BY offer_id LIMIT 1`)).rows;
  assert.ok(offer_id, "offer_unit rỗng trên bản chép");
  assert.deepEqual(await haiDong("SELECT * FROM offer_unit UNION ALL SELECT * FROM offer_unit WHERE offer_id = $1", [offer_id]), [offer_id]);
});

// AC-7 — offer_building giữ nguyên đầu ra, nhanh; offer_unit nhanh
const bam = async (sql) => (await c.query(`SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h, count(*)::int AS n FROM (${sql}) x`)).rows[0];
const giay = async (sql) => { const t = Date.now(); await c.query(sql); return (Date.now() - t) / 1000; };
test("offer-building-dau-ra-giu-nguyen", async () => {
  const [cu, moi] = [await bam(obCu), await bam("SELECT * FROM offer_building")];
  // Lệch thì gọi tên offer_id (finding S4 r2, AC-7): so từng dòng dạng chữ theo hai chiều.
  const lech = cu.h === moi.h ? [] : (await c.query(`SELECT DISTINCT offer_id FROM (
      (SELECT x.offer_id, x::text t FROM (${obCu}) x EXCEPT ALL SELECT y.offer_id, y::text FROM offer_building y)
      UNION ALL (SELECT y.offer_id, y::text FROM offer_building y EXCEPT ALL SELECT x.offer_id, x::text FROM (${obCu}) x)) d
      ORDER BY 1 LIMIT 5`)).rows.map((r) => r.offer_id);
  assert.deepEqual(lech, [], `offer_building sau 131 khác 117 ở offer_id ${lech.join(", ")}`);
  assert.deepEqual(moi, cu, `offer_building sau 131 khác 117: ${cu.n} → ${moi.n} dòng`);
});
// Chiều đỏ của MATERIALIZED đo bằng kế hoạch, không bằng đồng hồ (GS phán 27/11): DB lượt vừa khôi phục chạy nhanh cả khi bỏ
// MATERIALIZED (M5 0,37 giây), còn DB máy thu mất 43 giây — thời gian phụ thuộc máy, dữ liệu; bước vật thể hoá thì xác định.
const coBuoc = (nut, ten) => nut?.["Subplan Name"] === ten || (nut?.Plans ?? []).some((x) => coBuoc(x, ten));
test("offer-building-ke-hoach-giu-buoc-vat-the-hoa-toa-vung", async () => {
  const { rows: [{ "QUERY PLAN": [{ Plan }] }] } = await c.query("EXPLAIN (FORMAT JSON) SELECT count(*) FROM offer_building");
  assert.ok(coBuoc(Plan, "CTE toa_vung"), "offer_building: kế hoạch thiếu bước «CTE toa_vung» (v_toa_nut_vung không còn được vật thể hoá một lần)");
});
test("offer-building-va-offer-unit-nhanh", { timeout: 600_000 }, async () => {
  // DB của lượt vừa khôi phục chưa có thống kê nên planner chọn kế hoạch khác DB máy thu (đo 27/11: bỏ MATERIALIZED ở toa_vung
  // trên DB máy thu 43 giây, trên DB lượt chưa ANALYZE dưới 1 giây — đột biến bo-materialized không đỏ). ANALYZE trước khi đo
  // để thời gian phản ánh kế hoạch của DB máy thu.
  await c.query("ANALYZE");
  const tOb = await giay("SELECT count(*) FROM offer_building");
  const tOu = await giay("SELECT count(*) FROM offer_unit");
  const tSau = await giay("SELECT * FROM offer_unit WHERE muc <> 'toa'");
  console.log(`thời gian: offer_building ${tOb}s · offer_unit ${tOu}s · offer_unit mức sâu ${tSau}s`);
  assert.ok(tOb < 10, `offer_building count(*) ${tOb}s ≥ 10s`);
  assert.ok(tOu < 15 && tSau < 15, `offer_unit ${tOu}s / ${tSau}s ≥ 15s`);
});
