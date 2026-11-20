// bi-danh-viet-tat-phan-khu.itest.mjs — DA51 bi-danh-viet-tat-phan-khu: chọn đích, thẻ, áp, đảo, thứ tự với DA46, bên đọc GT5,
// lượt dựng đêm + bộ soát cloud, lệnh kiểm sau. DB thử oneinvest_dbv_bdv_<pid> dựng từ db/migrations (cùng khung DA46); xoá khi xong.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { apNoi, daoNoi, dungKeHoachNoi } from "../phan-khu-s16.mjs";
import { khoaKhu } from "../lib/s16-phan-khu.mjs";
import { soatDuLieu, tokenS16 } from "../lib/s16-soat.mjs";
import { CAN_CU_BI_DANH, KHOA_META, chonDich, docTenPhanKhu, dungTuDien, tapPhanKhu } from "../lib/phan-khu-s16-bi-danh.mjs";
import { apBiDanh, daoBiDanh, doBiDanh, dungThe, kiemBiDanh } from "./bi-danh-viet-tat-phan-khu.mjs";

const TEN = `oneinvest_dbv_bdv_${process.pid}`;
const SNAP = "bdv__s16__ds";
let db, RULE16, soToa = 0, soTin = 0;

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN, { hetSo: 110 }) });
  await db.connect();
  apTep(TEN, join(GOC, "db/migrations/111_v_toa_nut_vung_s16.sql"));
  apTep(TEN, join(GOC, "db/migrations/114_v_toa_nut_vung_s16_bam.sql"));
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}')", [SNAP]);
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('bdv-s03', 'vn', 'S03', '{}')");
  RULE16 = (await db.query(`INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by)
                            VALUES ('S16', 'S16-danh-sach-khu', repeat('a', 64), 1, 'itest') RETURNING id::int AS id`)).rows[0].id;
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

const nut = async (type, slug, ten, parent = null, meta = {}, aliases = []) => (await db.query(
  `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
   VALUES ($1, $3, $2, $4, $6, '{}', 'SubdivisionName', $5) RETURNING id::int AS id`, [type, slug, ten, parent, meta, aliases])).rows[0].id;
const hang = async (id) => (await db.query("SELECT parent_id::int AS parent_id, aliases, meta FROM asset_nodes WHERE id = $1", [id])).rows[0];
const chup = async (ids) => Promise.all(ids.map(hang));
const demBang = async () => (await db.query(
  "SELECT (SELECT count(*)::int FROM asset_nodes) AS nut, (SELECT count(*)::int FROM project_link_rules) AS luat, (SELECT md5(string_agg(row_to_json(a)::text, '' ORDER BY id)) FROM asset_nodes a) AS dau")).rows[0];

/** Dự án thử với các nút phân khu; bảng tên tắt trỏ vào slug của dự án. */
async function duAn(ma) {
  const slug = `bdv-${ma}`;
  const P = await nut("project", slug, `Dự án ${ma}`);
  const sub = (ten, meta = {}, aliases = [ten.toLowerCase()], cha = P) => nut("subzone", `${slug}-${ten.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${++soToa}`, ten, cha, meta, aliases);
  const bang = (vts) => vts.map(([vt, ten]) => ({ vt, ten, du_an: slug }));
  return { P, slug, sub, bang };
}
const luatDuc = { nguon: "S16", s16_rule_id: 1, s16_khu_ids: [], s16_khu_rule: {} };

/** Tin S03 đang sống thuộc dự án `P`, chữ `text`. */
async function tin(P, text) {
  const id = `bdv-o-${++soTin}`, post = `bdv-p-${soTin}`;
  await db.query("INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, captured_at) VALUES ($1, 'bdv-s03', $2, now())", [post, text]);
  await db.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, confidence, first_seen, last_seen, n_reposts, post_ids,
                    source, field_provenance, offer_status) VALUES ($1, 'sale', 'apartment', 'medium', now(), now(), 1, $2, 'S03', '{}', 'active')`, [id, [post]]);
  // offer_project là view (105): dự án của tin suy từ phát biểu project_node_id của bài.
  await db.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at)
                    VALUES ($1, 'project_node_id', $2, 'inferred', 'e1_rule', 'du-an-nhom-mot-du-an', now())`, [`S03:${post}`, String(P)]);
  return id;
}

test("BDV-1: chọn đích — một ứng viên, hai ứng viên bỏ nút luật đúc, nút nghỉ không bao giờ là đích, không có nút, dự án khác", async () => {
  const d = await duAn("c1");
  const khac = await duAn("c1khac");
  const ori = await d.sub("The Origami");
  const rbCu = await d.sub("The Rainbow");
  await d.sub("Rainbow", luatDuc);
  const ghNghi = await d.sub("The Glory Heights", { nghi: true });
  const ghCu = await d.sub("Glory Heights");
  await d.sub("Glory Heights Con", {}, [], ghCu);
  await d.sub("Twin", {}); await d.sub("The Twin", {});
  await khac.sub("The Beverly Solari");
  const { dong } = await dungThe(db, { bang: d.bang([["ori", "origami"], ["rb", "rainbow"], ["gh", "glory heights"], ["tw", "twin"], ["bs", "beverly solari"]]), dem: false });
  const theo = Object.fromEntries(dong.map((x) => [x.vt, [x.node_id, x.ly_do]]));
  assert.deepEqual(theo.ori, [ori, null], "một ứng viên ra đúng nút");
  assert.deepEqual(theo.rb, [rbCu, null], "hai ứng viên cùng tên: bỏ nút do luật S16 đúc");
  assert.notEqual(theo.gh[0], ghNghi, `nút nghỉ ${ghNghi} bị chọn làm đích`);
  assert.deepEqual(theo.gh, [ghCu, null], "nút nghỉ không là ứng viên, còn lại một nút");
  assert.deepEqual(theo.tw, [null, "nhieu-ung-vien"], "hai ứng viên cùng loại thì không gán");
  assert.deepEqual(theo.bs, [null, "khong-co-nut"], "nút cùng tên ở dự án khác không là ứng viên");
  // Hàm thuần: nút nghỉ duy nhất cùng tên ra «không có nút», không bao giờ thành đích.
  assert.deepEqual(chonDich([{ vt: "x", ten: "a", du_an: "p" }], [{ id: 9, name: "The A", du_an_slug: "p", nghi: true, luat_duc: false }])
    .map((x) => [x.node_id, x.ly_do]), [[null, "khong-co-nut"]], "nút nghỉ duy nhất phải ra không gán");
});

test("BDV-2: thẻ liệt đích và số tin, ca không gán kèm lý do, băm ổn định, đổi khi đích đổi, không ghi gì", async () => {
  const d = await duAn("c2");
  const ori = await d.sub("The Origami");
  await tin(d.P, "ban 2pn ori gia 3ty"); await tin(d.P, "cho thue ori 7tr"); await tin(d.P, "can ho khac khong co ten tat");
  const bang = d.bang([["ori", "origami"], ["zz", "khong ton tai"]]);
  const truoc = await demBang();
  const a = await dungThe(db, { bang }), b = await dungThe(db, { bang });
  assert.deepEqual(await demBang(), truoc, "dựng thẻ không được ghi dòng nào");
  assert.equal(a.bam, b.bam, "dựng hai lần phải cùng băm");
  assert.equal(a.soTin.get("ori"), 2, "số tin chứa ori");
  assert.match(a.markdown, new RegExp(`\\| ori \\| origami \\| ${ori} The Origami \\| ${d.slug} \\| 2 \\|`));
  assert.match(a.markdown, /\| zz \| khong ton tai \| .* \| không có nút phân khu mang tên này \|/);
  assert.match(a.markdown, new RegExp(`băm: ${a.bam}`));
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"nghi\": true}'::jsonb WHERE id = $1", [ori]);
  const c = await dungThe(db, { bang, dem: false });
  await db.query("UPDATE asset_nodes SET meta = meta - 'nghi' WHERE id = $1", [ori]);
  assert.notEqual(c.bam, a.bam, "băm phải đổi khi đích của một tên đổi");
});

test("BDV-3: băm lệch không ghi; băm đúng nối tên vào cuối, ghi meta và một dòng luật; tên có sẵn không lặp; áp lần hai không đổi", async () => {
  const d = await duAn("c3");
  const ori = await d.sub("The Origami", { s09_sector_ids: ["x"] }, ["the origami", "origami"]);
  const rb = await d.sub("The Rainbow", {}, ["the rainbow", "rb"]);
  const bang = d.bang([["ori", "origami"], ["rb", "rainbow"]]);
  const truoc = await demBang();
  await assert.rejects(() => apBiDanh(db, { bam: "b".repeat(64), nguoi: "Mạnh", bang }), /^Error: bam-lech/);
  assert.deepEqual(await demBang(), truoc, "băm lệch: không dòng nào đổi");
  const { bam } = await dungThe(db, { bang, dem: false });
  const kq = await apBiDanh(db, { bam, nguoi: "Mạnh", bang });
  assert.equal(kq.khongDoi, false);
  const o = await hang(ori);
  assert.deepEqual(o.aliases, ["the origami", "origami", "ori"], "tên nối vào cuối, bí danh cũ giữ thứ tự");
  assert.deepEqual(o.meta, { s09_sector_ids: ["x"], [KHOA_META]: { [kq.rule_id]: ["ori"] } }, "meta giữ khoá cũ, thêm dấu lượt");
  const r = await hang(rb);
  assert.deepEqual(r.aliases, ["the rainbow", "rb"], "tên đã có không lặp");
  assert.equal(r.meta[KHOA_META], undefined, "tên đã có không vào danh sách thêm");
  const { rows: luat } = await db.query("SELECT source, can_cu, mau_bam, so_ma, decided_by FROM project_link_rules WHERE id = $1", [kq.rule_id]);
  assert.deepEqual(luat, [{ source: "S03", can_cu: CAN_CU_BI_DANH, mau_bam: bam, so_ma: 1, decided_by: "Mạnh" }]);
  assert.equal((await demBang()).luat, truoc.luat + 1, "đúng một dòng luật");
  const sau = await demBang();
  const lai = await apBiDanh(db, { bam, nguoi: "Mạnh", bang });
  assert.equal(lai.khongDoi, true, "áp lần hai không đổi");
  assert.deepEqual(await demBang(), sau, "áp lần hai: 0 dòng đổi");
});

test("BDV-4: đảo trả nguyên aliases và meta, ghi người và giờ; đảo nhầm mã luật khác bị từ chối", async () => {
  const d = await duAn("c4");
  const a = await d.sub("The Origami", { s09_sector_ids: ["y"] });
  const b = await d.sub("The Glory Heights");
  const c = await d.sub("The Rainbow", {}, ["the rainbow", "rb"]);
  const bang = d.bang([["ori", "origami"], ["gh", "glory heights"], ["rb", "rainbow"]]);
  const truoc = await chup([a, b, c]);
  const { bam } = await dungThe(db, { bang, dem: false });
  const { rule_id } = await apBiDanh(db, { bam, nguoi: "Mạnh", bang });
  const dauLuat = await demBang();
  await assert.rejects(() => daoBiDanh(db, { ruleId: RULE16, nguoi: "Mạnh" }), /^Error: khong-phai-luot-bi-danh/);
  assert.deepEqual(await demBang(), dauLuat, "đảo nhầm mã: 0 dòng đổi");
  await daoBiDanh(db, { ruleId: rule_id, nguoi: "Mạnh" });
  assert.deepEqual(await chup([a, b, c]), truoc, "đảo phải trả nguyên aliases và meta, kể cả tên tắt đã có sẵn trước khi áp");
  const { rows: [l] } = await db.query("SELECT dao_by, dao_at FROM project_link_rules WHERE id = $1", [rule_id]);
  assert.equal(l.dao_by, "Mạnh"); assert.ok(l.dao_at, "dòng luật phải ghi giờ đảo");
  await assert.rejects(() => daoBiDanh(db, { ruleId: rule_id, nguoi: "Mạnh" }), /^Error: da-dao/);
});

/** Cặp DA46 trong dự án: nút giữ lại «The Glory Heights» có bằng chứng S09, nút luật đúc «Glory Heights» mang khu K1 và 3 toà. */
async function capDa46(ma) {
  const d = await duAn(ma);
  const duAnS16 = `pk-${ma}`;
  const noi = { [ma]: d.slug };
  const sec = `sec-${ma}`;
  const cu = await d.sub("The Glory Heights", { s09_sector_ids: [sec] });
  await db.query("INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, $2, 'K1', 'Glory Heights')", [SNAP, duAnS16]);
  const moi = await d.sub("Glory Heights", { nguon: "S16", s16_rule_id: RULE16, s16_khu_ids: [khoaKhu(duAnS16, "K1")], s16_khu_rule: { [khoaKhu(duAnS16, "K1")]: RULE16 } }, ["glory heights"]);
  const snap = `bdv-s09-${ma}`;
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S09', '{}')", [snap]);
  const khoi = [0, 1, 2].map((i) => ({ id: `b${i}`, block_code: `C1.0${i + 1}`, sector_uuid: sec }));
  await db.query("INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ($1, $2, 'du-an', $3)", [snap, `p${ma}`,
    { chiTiet: { meta: { code: "200" }, data: { id: `p${ma}`, insight_by_block: khoi } } }]);
  for (const k of khoi) {
    const key = `bld_${String(++soToa).padStart(26, "0")}`;
    await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [key, d.P]);
    await db.query("INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, $2, 'K1', 'K1', $3, $3)", [SNAP, duAnS16, `T${soToa}`]);
    await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')", [key, `${duAnS16}/T${soToa}`]);
    await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S09')", [key, `p${ma}/${k.id}`]);
  }
  return { d, cu, moi, noi, bang: d.bang([["gh", "glory heights"]]) };
}
const noiDa46 = async (x) => apNoi(db, { bam: (await dungKeHoachNoi(db, { noi: x.noi })).bam, nguoi: "Mạnh", noi: x.noi });
const apGh = async (x) => apBiDanh(db, { bam: (await dungThe(db, { bang: x.bang, dem: false })).bam, nguoi: "Mạnh", bang: x.bang });

test("BDV-5: thứ tự với DA46 — áp trước, áp sau, đảo DA46 sau áp: nút giữ lại mang tên tắt, nút nghỉ không mang", async () => {
  const truocSau = await capDa46("t1");
  const r1 = await apGh(truocSau);
  const n1 = await noiDa46(truocSau);
  assert.ok(n1.rule_id, "đối chứng: lượt nối DA46 phải thật sự nối cặp");
  assert.ok((await hang(truocSau.cu)).aliases.includes("gh"), "áp trước rồi nối: nút giữ lại mang gh");
  assert.ok(!(await hang(truocSau.moi)).aliases.includes("gh"), "nút nghỉ không mang gh");

  const sauTruoc = await capDa46("t2");
  await noiDa46(sauTruoc);
  const r2 = await apGh(sauTruoc);
  assert.ok((await hang(sauTruoc.cu)).aliases.includes("gh"), "nối rồi áp: nút giữ lại mang gh");
  assert.ok(!(await hang(sauTruoc.moi)).aliases.includes("gh"), "nối rồi áp: nút nghỉ không mang gh");

  // Đảo DA46 sau khi áp bí danh: gh còn trên nút giữ lại.
  await daoNoi(db, { ruleId: n1.rule_id, nguoi: "Mạnh" });
  assert.ok((await hang(truocSau.cu)).aliases.includes("gh"), "đảo DA46 không được gỡ gh");
  // Đảo bí danh không gỡ bí danh DA46 dồn về.
  const coDa46 = (await hang(sauTruoc.cu)).aliases;
  assert.ok(coDa46.includes("glory heights"), "đối chứng: DA46 đã dồn bí danh của nút mới về nút giữ lại");
  await daoBiDanh(db, { ruleId: r2.rule_id, nguoi: "Mạnh" });
  assert.deepEqual((await hang(sauTruoc.cu)).aliases, coDa46.filter((x) => x !== "gh"), "đảo bí danh chỉ gỡ gh, giữ bí danh DA46 dồn về");
  assert.ok(r1.rule_id);
});

test("BDV-6: bên đọc GT5 qua docTenPhanKhu ra đúng phân khu; dự án khác, dính chữ số, nút nghỉ không ra", async () => {
  const d = await duAn("c6");
  const khac = await duAn("c6khac");
  await d.sub("The Origami");
  await d.sub("The Rainbow"); await d.sub("Rainbow", luatDuc);
  const nghi = await d.sub("The Twin", { nghi: true }, ["the twin", "tw"]);
  const bang = d.bang([["ori", "origami"], ["rb", "rainbow"]]);
  await apBiDanh(db, { bam: (await dungThe(db, { bang, dem: false })).bam, nguoi: "Mạnh", bang });
  const dong = await docTenPhanKhu(db);
  assert.ok(!dong.some((r) => Number(r.nut) === nghi), `nút nghỉ ${nghi} không được vào từ điển`);
  const td = dungTuDien(dong);
  const P = String(d.P), K = String(khac.P);
  assert.deepEqual(tapPhanKhu("ban 2pn ori 6tr", td.get(P)), [`${P}:origami`], "tên tắt ra đúng phân khu");
  assert.deepEqual(tapPhanKhu("ban 2pn the origami 6tr", td.get(P)), [`${P}:origami`], "đối chứng dương: tên đầy đủ ra cùng khoá");
  assert.deepEqual(tapPhanKhu("2pn rb 7tr", td.get(P)), tapPhanKhu("2pn rainbow 7tr", td.get(P)), "rb và rainbow ra cùng khoá khi còn hai nút cùng tên");
  assert.deepEqual(tapPhanKhu("2pn rb 7tr", td.get(P)), [`${P}:rainbow`]);
  assert.deepEqual(tapPhanKhu("ban 2pn ori 6tr", td.get(K)), [], "tin dự án khác không ra phân khu");
  assert.deepEqual(tapPhanKhu("2pn ori1 6tr", td.get(P)), [], "dính chữ số không khớp");
  assert.deepEqual(tapPhanKhu("2pn tw 6tr", td.get(P)), [], "tên trên nút nghỉ không khớp");
});

test("BDV-7: lượt dựng đêm chạy hai lần giữ tên tắt và số nút; bộ soát S16 sạch, cấy mã khu thô thì dừng", async () => {
  const x = await capDa46("d7");
  await noiDa46(x);
  await db.query("INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, 'pk-d7', 'KHUTHOBDV', 'Khu thô')", [SNAP]);
  await apGh(x);
  const truoc = (await demBang()).nut;
  for (const lan of [1, 2]) {
    const kq = await dung(db, { khuSlugs: [x.d.slug], isoTheo: () => "VN-HN", noiS09: {}, noiS16: {}, log: () => {}, runId: `bdv-${lan}` });
    assert.equal(kq.khoa_moi, 0, `lần ${lan}: không được có khoá mới`);
    assert.ok((await hang(x.cu)).aliases.includes("gh"), `lần ${lan}: gh phải còn trên nút đích`);
  }
  assert.equal((await demBang()).nut, truoc, "số nút không đổi");
  const soat = async () => soatDuLieu(new Map([["asset_nodes", (await db.query("SELECT row_to_json(x)::text AS j FROM asset_nodes x")).rows.map((r) => r.j)]]), await tokenS16(db));
  assert.equal(await soat(), null, "bộ soát S16 phải sạch sau khi áp bí danh");
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"thu_tho\":\"KHUTHOBDV\"}'::jsonb WHERE id = $1", [x.cu]);
  const hit = await soat();
  await db.query("UPDATE asset_nodes SET meta = meta - 'thu_tho' WHERE id = $1", [x.cu]);
  assert.deepEqual([hit?.bang, hit?.cot], ["asset_nodes", "meta"], "cấy mã khu thô thì bộ soát phải dừng ở asset_nodes.meta");
});

test("BDV-8: lệnh kiểm đạt khi đúng; thoát lỗi nêu id khi thiếu tên hoặc nút đích nghỉ", async () => {
  const d = await duAn("c8");
  const a = await d.sub("The Origami");
  const b = await d.sub("The Glory Heights");
  const bang = d.bang([["ori", "origami"], ["gh", "glory heights"]]);
  const { rule_id } = await apBiDanh(db, { bam: (await dungThe(db, { bang, dem: false })).bam, nguoi: "Mạnh", bang });
  assert.deepEqual(await kiemBiDanh(db, { ruleId: rule_id }), { ok: true, loi: [], da_dao: false });
  await db.query("UPDATE asset_nodes SET aliases = array_remove(aliases, 'ori') WHERE id = $1", [a]);
  assert.deepEqual((await kiemBiDanh(db, { ruleId: rule_id })).loi, [{ loai: "thieu-ten", node_id: a, vt: "ori" }], "thiếu tên phải nêu đúng nút");
  await db.query("UPDATE asset_nodes SET aliases = array_append(aliases, 'ori') WHERE id = $1", [a]);
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"nghi\": true}'::jsonb WHERE id = $1", [b]);
  assert.deepEqual((await kiemBiDanh(db, { ruleId: rule_id })).loi, [{ loai: "nut-nghi", node_id: b }], "nút đích nghỉ phải nêu đúng nút");
  await db.query("UPDATE asset_nodes SET meta = meta - 'nghi' WHERE id = $1", [b]);
  await assert.rejects(() => kiemBiDanh(db, { ruleId: RULE16 }), /^Error: luot-bi-danh-khong-co/);
});

test("BDV-9 (lệnh đo trên fixture): tăng đúng số tin chỉ đọc được nhờ tên tắt, theo từng tên, 0 mất phân khu cũ", async () => {
  const d = await duAn("c9");
  await d.sub("The Origami"); await d.sub("The Glory Heights");
  await tin(d.P, "2pn ori 6tr"); await tin(d.P, "2pn gh 9tr"); await tin(d.P, "2pn the origami 7tr"); await tin(d.P, "2pn ori va the glory heights");
  const bang = d.bang([["ori", "origami"], ["gh", "glory heights"]]);
  const { rule_id } = await apBiDanh(db, { bam: (await dungThe(db, { bang, dem: false })).bam, nguoi: "Mạnh", bang });
  const kq = await doBiDanh(db, { ruleId: rule_id, bang });
  assert.equal(kq.sau - kq.truoc, 2, "hai tin chỉ đọc được nhờ tên tắt");
  assert.deepEqual(kq.theoTen, { ori: 1, gh: 1 });
  assert.equal(kq.mat, 0, "không tin nào mất phân khu cũ");
});
