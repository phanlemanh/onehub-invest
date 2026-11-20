// phan-khu-s16-noi.itest.mjs — DA46 noi-phan-khu-trung-s16: bước khớp phân khu S16 theo cây và bằng chứng S09, thẻ nối, áp, đảo,
// lượt dựng đêm, bộ soát cloud, lệnh kiểm sau áp. DB thử oneinvest_dbv_nps_<pid> dựng từ db/migrations; xoá khi xong.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/phan-khu-s16-noi.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { apNoi, daoNoi, dungKeHoachNoi, dungTheLuat, kiemNoi } from "../phan-khu-s16.mjs";
import { keHoachNoi, khoaKhu } from "../lib/s16-phan-khu.mjs";
import { soatDuLieu, tokenS16 } from "../lib/s16-soat.mjs";

const TEN = `oneinvest_dbv_nps_${process.pid}`;
const SNAP = "nps__s16__ds";
let db, RULE, soToa = 0;

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN, { hetSo: 110 }) });
  await db.connect();
  apTep(TEN, join(GOC, "db/migrations/111_v_toa_nut_vung_s16.sql"));
  apTep(TEN, join(GOC, "db/migrations/114_v_toa_nut_vung_s16_bam.sql"));
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}')", [SNAP]);
  RULE = (await db.query(`INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by)
                          VALUES ('S16', 'S16-danh-sach-khu', repeat('a', 64), 1, 'itest') RETURNING id::int AS id`)).rows[0].id;
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

const nut = async (type, slug, ten, parent = null, meta = {}, aliases = []) => (await db.query(
  `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
   VALUES ($1, $3, $2, $4, $6, '{}', 'SubdivisionName', $5) RETURNING id::int AS id`, [type, slug, ten, parent, meta, aliases])).rows[0].id;

/** Dự án thử: mã không có dấu gạch, để `pk-<mã>` khớp đuôi của bảng nối. */
async function duAn(ma) {
  const slug = `nps-${ma}`;
  const P = await nut("project", slug, `Dự án ${ma}`);
  const duAnS16 = `pk-${ma}`;
  const c = { P, slug, ma, duAnS16, noi: { [ma]: slug }, sub: 0 };
  c.ten = (s) => `${ma}-${s}`;
  c.khoa = (khu) => khoaKhu(duAnS16, khu);
  c.khu = (khu, ten) => db.query("INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, $2, $3, $4)", [SNAP, duAnS16, khu, ten]);
  return c;
}
const bk = (n) => `bld_${String(n).padStart(26, "0")}`;

/** Toà có bí danh S16 trong một khu; `s09` = mã khối S09 đã nạp bằng napS09. */
async function toa(c, khu, s09 = null, region = c.P) {
  const key = bk(++soToa);
  const toaId = `T${soToa}`;
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [key, region]);
  await db.query("INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, $2, $3, $3, $4, $4)", [SNAP, c.duAnS16, khu, toaId]);
  await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')", [key, `${c.duAnS16}/${toaId}`]);
  if (s09) await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S09')", [key, `p${c.ma}/${s09}`]);
  return key;
}
/** Nạp danh sách khối S09 của dự án thử: [{id, code, sector}]. */
async function napS09(c, khoi) {
  const snap = `nps-s09-${c.ma}`;
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S09', '{}')", [snap]);
  await db.query("INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ($1, $2, 'du-an', $3)", [snap, `p${c.ma}`,
    { chiTiet: { meta: { code: "200" }, data: { id: `p${c.ma}`, insight_by_block: khoi.map((k) => ({ id: k.id, block_code: k.code, sector_uuid: k.sector })) } } }]);
}
/** Nút do luật S16 đúc, mang các khoá khu. */
const nutLuat = (c, slug, ten, khus, aliases = [ten.toLowerCase()]) => nut("subzone", c.ten(slug), ten, c.P,
  { nguon: "S16", s16_rule_id: RULE, s16_khu_ids: khus.map(c.khoa), s16_khu_rule: Object.fromEntries(khus.map((k) => [c.khoa(k), RULE])) }, aliases);

/** Một cặp hoàn chỉnh: nút cũ loại `loai` có bằng chứng S09, nút mới của luật mang khu K1, `n` toà. */
async function cap(ma, { loai = "con", n = 3, metaCu = {} } = {}) {
  const c = await duAn(ma);
  const sec = `sec-${ma}`;
  let cu;
  if (loai === "cum") {
    const cha = await nut("subzone", c.ten("cha"), "Phân khu cha", c.P, { s09_sector_ids: [sec] });
    cu = await nut("subzone", c.ten("cu"), "C1", cha, { s09_cum: "C1", s09_sector_id: sec, ...metaCu });
  } else {
    cu = await nut(loai === "building" ? "building" : "subzone", c.ten("cu"), "Nơi cũ", c.P, { s09_sector_ids: [sec], ...metaCu }, ["noi cu"]);
  }
  await c.khu("K1", "Nơi mới");
  const moi = await nutLuat(c, "moi", "Nơi mới", ["K1"]);
  const khoi = Array.from({ length: n }, (_, i) => ({ id: `b${i}`, code: `C1.0${i + 1}`, sector: sec }));
  await napS09(c, khoi);
  const toaKeys = [];
  for (const k of khoi) toaKeys.push(await toa(c, "K1", k.id));
  return { c, cu, moi, toaKeys };
}
const hang = async (id) => (await db.query("SELECT parent_id::int AS parent_id, aliases, meta FROM asset_nodes WHERE id = $1", [id])).rows[0];
const nutVung = async (key) => (await db.query("SELECT region_node_id::int AS id FROM v_toa_nut_vung WHERE building_key = $1", [key])).rows[0].id;
const demBang = async () => {
  const { rows: [r] } = await db.query("SELECT (SELECT count(*)::int FROM asset_nodes) AS nut, (SELECT count(*)::int FROM project_link_rules) AS luat");
  return r;
};
const theo = (dong, c, khu) => dong.find((d) => d.du_an === c.duAnS16 && d.khu_id === khu);

test("NPS-1: khoá khu ở nút cháu và nút building ra đã gán; nút nghỉ mang khoá không được tính", async () => {
  const c = await duAn("a1");
  const cha = await nut("subzone", c.ten("cha"), "Cha", c.P);
  const chau = await nut("subzone", c.ten("chau"), "Cháu", cha, { s16_khu_ids: [c.khoa("K1")] });
  const bd = await nut("building", c.ten("bd"), "Toà lớn", c.P, { s16_khu_ids: [c.khoa("K2")] });
  await nut("subzone", c.ten("nghi"), "Nghỉ", c.P, { nghi: true, s16_khu_ids: [c.khoa("K3")] });
  await c.khu("K1", "Khu một"); await c.khu("K2", "Khu hai"); await c.khu("K3", "Khu ba");
  const { dong } = await dungTheLuat(db, { noi: c.noi });
  assert.deepEqual([theo(dong, c, "K1").nut, theo(dong, c, "K1").node_id], ["da-co", chau], "khu K1 bị đúc lại dù khoá nằm ở nút cháu");
  assert.deepEqual([theo(dong, c, "K2").nut, theo(dong, c, "K2").node_id], ["da-co", bd], "khu K2 bị đúc lại dù khoá nằm ở nút building");
  assert.equal(theo(dong, c, "K3").nut, "moi", "nút nghỉ mang khoá không được tính là đã gán");
});

test("NPS-2: chỉ khớp trọn 1–1 từ 3 toà chung mới tự nhận nút cũ, ca còn lại cảnh báo", async () => {
  const c = await duAn("a2");
  const pk = (slug, ten, sec, cha = c.P) => nut("subzone", c.ten(slug), ten, cha, { s09_sector_ids: [sec] });
  const sA = await pk("sa", "Tên khác hẳn", "a2-a");
  const sB = await pk("sb", "Phân khu B", "a2-b");
  const cum = await nut("subzone", c.ten("cum"), "C7", sB, { s09_cum: "C7", s09_sector_id: "a2-b" });
  const r1 = await pk("r1", "Rẽ một", "a2-r1"), r2 = await pk("r2", "Rẽ hai", "a2-r2");
  const nIt = await pk("it", "Ít toà", "a2-it"), nSan = await pk("san", "Dưới sàn", "a2-s"), nN = await pk("n", "Bị chia nhỏ", "a2-n");
  const sC = await pk("sc", "Khu trùng tên", "a2-c");
  const ba = (ma, sec, code = "Q") => [1, 2, 3].map((i) => ({ id: `${ma}${i}`, code: `${code}${ma}${i}`, sector: sec }));
  const khoi = [...ba("a", "a2-a"), ...[1, 2, 3].map((i) => ({ id: `c${i}`, code: `C7.0${i}`, sector: "a2-b" })),
    { id: "r1", code: "R1", sector: "a2-r1" }, { id: "r2", code: "R2", sector: "a2-r2" },
    { id: "it1", code: "I1", sector: "a2-it" }, { id: "it2", code: "I2", sector: "a2-it" }, ...ba("s", "a2-s"), ...ba("m", "a2-n"), ...ba("p", "a2-n"),
    { id: "u1", code: "U1", sector: "a2-c" }];
  await napS09(c, khoi);
  for (const [k, ten] of [["MOT", "Khu một nơi"], ["CUM", "Khu cụm"], ["RE", "Khu rẽ"], ["IT", "Khu ít toà"], ["SAN", "Khu dưới sàn"], ["N1", "Khu chia một"], ["N2", "Khu chia hai"], ["KHONG", "Khu không S09"], ["TEN", "Khu trùng tên"]]) await c.khu(k, ten);
  for (const b of ["a1", "a2", "a3"]) await toa(c, "MOT", b);
  for (const b of ["c1", "c2", "c3"]) await toa(c, "CUM", b);
  await toa(c, "RE", "r1"); await toa(c, "RE", "r2");
  await toa(c, "IT", "it1"); await toa(c, "IT", "it2");
  for (const b of ["s1", "s2", "s3"]) await toa(c, "SAN", b);
  for (let i = 0; i < 4; i++) await toa(c, "SAN");
  for (const b of ["m1", "m2", "m3"]) await toa(c, "N1", b);
  for (const b of ["p1", "p2", "p3"]) await toa(c, "N2", b);
  await toa(c, "KHONG");
  await toa(c, "TEN", "u1");
  const { dong, markdown } = await dungTheLuat(db, { noi: c.noi });
  const kq = (k) => [theo(dong, c, k).nut, theo(dong, c, k).node_id, theo(dong, c, k).canh_bao?.ly_do ?? null];
  assert.deepEqual(kq("MOT"), ["san", sA, null], "khớp trọn 1–1 từ 3 toà thì khu nhận nút đó");
  assert.deepEqual(kq("CUM"), ["san", cum, null], "cụm phải thắng phân khu cha");
  assert.deepEqual(kq("RE"), ["moi", null, "re-hai-nut"], "toà rẽ hai nút thì không tự nhận, phải cảnh báo");
  assert.deepEqual(theo(dong, c, "RE").canh_bao.nut, [r1, r2].sort((a, b) => a - b), "cảnh báo phải nêu đủ hai nút");
  assert.deepEqual(kq("IT"), ["moi", null, "it-chung"], "dưới 3 toà chung thì không tự nhận");
  assert.deepEqual(theo(dong, c, "IT").canh_bao.nut, [nIt]);
  assert.deepEqual(kq("SAN"), ["moi", null, "duoi-san"], "3/7 toà có S09 chưa đủ sàn một nửa");
  assert.deepEqual(theo(dong, c, "SAN").canh_bao.nut, [nSan]);
  assert.deepEqual(kq("N1"), ["moi", null, "nhieu-ban-ghi"], "hai khu cùng về một nút thì S16 chia nhỏ hơn, không được gộp");
  assert.deepEqual(kq("N2"), ["moi", null, "nhieu-ban-ghi"], "hai khu cùng về một nút thì S16 chia nhỏ hơn, không được gộp");
  assert.deepEqual(theo(dong, c, "N1").canh_bao.nut, [nN]);
  assert.deepEqual(kq("KHONG"), ["moi", null, null], "không có S09 thì đúc mới, không cảnh báo");
  assert.deepEqual(kq("TEN"), ["san", sC, "it-chung"], "dưới sàn thì vẫn giữ luật so tên, kèm cảnh báo");
  assert.match(markdown, /Cảnh báo: khu có toà trùng phân khu đã có/, "thẻ luật phải có mục cảnh báo");
  assert.match(markdown, /Khu chia một \| Bị chia nhỏ \| 3\/3 \| phân khu này nhận toà từ nhiều khu/, "dòng cảnh báo phải nêu phân khu, số toà và lý do");
});

test("NPS-3: thẻ nối liệt đúng cặp, ca không nối kèm lý do, băm đổi theo cặp, không ghi gì", async () => {
  const c = await duAn("a3");
  const cu = await nut("subzone", c.ten("cu"), "Nơi cũ", c.P, { s09_sector_ids: ["a3-a"] });
  await nut("subzone", c.ten("cu2"), "Nơi khác", c.P, { s09_sector_ids: ["a3-b"] });
  await nut("subzone", c.ten("cu3"), "Nơi ba", c.P, { s09_sector_ids: ["a3-r"] });
  const ganCu = await nut("subzone", c.ten("gan"), "The Rainbow", c.P);
  await napS09(c, [{ id: "a", code: "Q1", sector: "a3-a" }, { id: "b", code: "Q2", sector: "a3-a" }, { id: "d", code: "Q3", sector: "a3-a" }, { id: "r1", code: "R1", sector: "a3-r" }, { id: "r2", code: "R2", sector: "a3-b" }]);
  for (const [k, ten] of [["K1", "Nơi mới"], ["K2", "Khu rẽ"], ["K3", "The Sapphire"], ["K4", "Sapphire"], ["K5", "Rainbow"]]) await c.khu(k, ten);
  const moi = await nutLuat(c, "moi", "Nơi mới", ["K1"]);
  const re = await nutLuat(c, "re", "Khu rẽ", ["K2"]);
  const sa = await nutLuat(c, "sa", "The Sapphire", ["K3"]);
  const sb = await nutLuat(c, "sb", "Sapphire", ["K4"]);
  const ra = await nutLuat(c, "ra", "Rainbow", ["K5"]);
  await toa(c, "K1", "a"); await toa(c, "K1", "b"); await toa(c, "K1", "d"); await toa(c, "K1");
  await toa(c, "K2", "r1"); await toa(c, "K2", "r2");
  await toa(c, "K3"); await toa(c, "K5");
  const truoc = await demBang();
  const kh = await dungKeHoachNoi(db, { noi: c.noi });
  assert.deepEqual(kh.cap.map((x) => [x.moi_id, x.cu_id, x.co_s09, x.tong_toa]), [[moi, cu, 3, 4]], "chỉ một cặp có đủ bằng chứng");
  const ly = Object.fromEntries(kh.khong_noi.map((k) => [k.moi_id, [k.ly_do, k.voi_id]]));
  assert.deepEqual(ly[re], ["re-hai-nut", null], "ca rẽ hai nút phải nằm ở mục không nối");
  assert.deepEqual(ly[sa] ?? ly[sb], ly[sa] ? ["gan-ten", sb] : ["khong-toa", sa], "cặp gần tên giữa hai nút mới");
  assert.deepEqual(ly[ra], ["gan-ten", ganCu], "gần tên với nút cũ, có toà nhưng không có bằng chứng");
  assert.match(kh.markdown, /Toà có S09 \/ tổng toà/);
  assert.match(kh.markdown, /3\/4/);
  assert.doesNotMatch(kh.markdown, /K1|T\d+\b/, "thẻ không in mã khu hay mã toà");
  assert.deepEqual(await demBang(), truoc, "dựng thẻ không được ghi");
  const a = keHoachNoi([{ id: 1, du_an_node_id: 9, name: "A", khoa: ["k"] }], new Map([["k", { tong_toa: 3, co_s09: 3, nut: [5] }]]), []);
  const b = keHoachNoi([{ id: 1, du_an_node_id: 9, name: "A", khoa: ["k"] }], new Map([["k", { tong_toa: 3, co_s09: 3, nut: [6] }]]), []);
  assert.notEqual(a.bam, b.bam, "băm phải đổi khi nút đích đổi");
});

test("NPS-4: băm lệch không ghi; băm đúng nối về nút cũ, giữ id, áp lần hai không đổi", async () => {
  const { c, cu, moi, toaKeys } = await cap("a4");
  const truoc = await demBang();
  await assert.rejects(() => apNoi(db, { bam: "0".repeat(64), nguoi: "t", noi: c.noi }), /^Error: bam-lech/);
  assert.deepEqual(await demBang(), truoc, "băm lệch không được ghi dòng nào");
  assert.equal((await hang(moi)).parent_id, c.P, "băm lệch không được đổi nút");
  for (const k of toaKeys) assert.equal(await nutVung(k), moi, "trước khi áp toà còn ở nút mới");
  const { bam } = await dungKeHoachNoi(db, { noi: c.noi });
  const kq = await apNoi(db, { bam, nguoi: "Mạnh", noi: c.noi });
  assert.equal(kq.so, 1);
  const hMoi = await hang(moi), hCu = await hang(cu);
  assert.equal(hMoi.parent_id, cu, "nút mới phải thành con của nút giữ lại");
  assert.equal(hMoi.meta.nghi, true);
  assert.deepEqual(hMoi.meta.s16_khu_ids, [], "nút nghỉ không còn khoá khu");
  assert.deepEqual(hCu.meta.s16_khu_ids, [c.khoa("K1")], "khoá khu phải về nút cũ");
  assert.ok(hCu.aliases.includes("nơi mới"), "bí danh phải về nút cũ");
  for (const k of toaKeys) assert.equal(await nutVung(k), cu, "toà phải về nút cũ qua view");
  const sau = await demBang();
  assert.equal(sau.luat, truoc.luat + 1, "đúng một dòng luật");
  assert.equal(sau.nut, truoc.nut, "không thêm hay xoá nút");
  const lan2 = await apNoi(db, { bam, nguoi: "Mạnh", noi: c.noi });
  assert.equal(lan2.khongDoi, true, "áp lần hai không đổi gì");
  assert.deepEqual(await demBang(), sau);
  assert.deepEqual(await hang(cu), hCu, "áp lần hai không đổi nút giữ lại");
});

test("NPS-5: đảo trả nguyên nút cha, meta, bí danh, view; đảo lần hai bị từ chối", async () => {
  const { c, cu, moi, toaKeys } = await cap("a5", { metaCu: { s16_khu_ids: ["khoa-san-co"], s16_khu_rule: { "khoa-san-co": RULE } } });
  await c.khu("K2", "Nơi mới hai");
  await db.query(`UPDATE asset_nodes SET meta = jsonb_set(jsonb_set(meta, '{s16_khu_ids}', meta -> 's16_khu_ids' || to_jsonb($2::text)),
                  '{s16_khu_rule}', meta -> 's16_khu_rule' || jsonb_build_object($2::text, $3::int)) WHERE id = $1`, [moi, c.khoa("K2"), RULE]);
  const hai = await cap("a5b");
  const chup = async (ds) => Promise.all(ds.map(hang));
  const truocNut = await chup([cu, moi]);
  const truocView = await Promise.all(toaKeys.map(nutVung));
  const { bam, cap: dsCap } = await dungKeHoachNoi(db, { noi: c.noi });
  assert.deepEqual(dsCap[0].khoa, [c.khoa("K1"), c.khoa("K2")].sort(), "nút mới hai khoá phải chuyển đủ");
  const { rule_id: ruleId } = await apNoi(db, { bam, nguoi: "Mạnh", noi: c.noi });
  assert.deepEqual((await hang(cu)).meta.s16_khu_ids.slice(0, 1), ["khoa-san-co"], "khoá sẵn có của nút giữ lại phải còn");
  await daoNoi(db, { ruleId, nguoi: "Mạnh" });
  assert.deepEqual(await chup([cu, moi]), truocNut, "đảo phải trả nguyên nút cha, meta, bí danh");
  assert.deepEqual(await Promise.all(toaKeys.map(nutVung)), truocView, "view toà phải trùng trước khi áp");
  const { rows: [l] } = await db.query("SELECT dao_by, dao_at FROM project_link_rules WHERE id = $1", [ruleId]);
  assert.equal(l.dao_by, "Mạnh"); assert.ok(l.dao_at, "dòng luật phải ghi giờ đảo");
  await assert.rejects(() => daoNoi(db, { ruleId, nguoi: "Mạnh" }), /^Error: da-dao/);
  // Nút cũ không có khoá khu từ trước: sau đảo không để lại mảng rỗng.
  const b0 = await hang(hai.cu);
  const k2 = await dungKeHoachNoi(db, { noi: hai.c.noi });
  const r2 = await apNoi(db, { bam: k2.bam, nguoi: "Mạnh", noi: hai.c.noi });
  await daoNoi(db, { ruleId: r2.rule_id, nguoi: "Mạnh" });
  assert.deepEqual(await hang(hai.cu), b0, "nút cũ chưa từng có khoá khu phải về đúng như trước");
});

for (const loai of ["con", "cum", "building"]) {
  test(`NPS-7: lượt dựng đêm sau khi nối không đúc lại, nút giữ lại loại ${loai}`, async () => {
    const { c, cu, moi, toaKeys } = await cap(`d${loai.slice(0, 2)}`, { loai });
    const { bam } = await dungKeHoachNoi(db, { noi: c.noi });
    await apNoi(db, { bam, nguoi: "Mạnh", noi: c.noi });
    const truoc = (await demBang()).nut;
    for (const lan of [1, 2]) {
      const kq = await dung(db, { khuSlugs: [c.slug], isoTheo: () => "VN-HN", noiS09: {}, noiS16: {}, log: () => {}, runId: `nps-${loai}-${lan}` });
      assert.equal(kq.khoa_moi, 0, `lần ${lan}: không được có khoá mới`);
    }
    assert.equal((await demBang()).nut, truoc, "số nút không đổi");
    assert.equal((await hang(moi)).parent_id, cu, "nút nghỉ không được còn là con trực tiếp của dự án");
    for (const k of toaKeys) assert.equal(await nutVung(k), cu, "toà vẫn ở nút giữ lại");
    const { dong } = await dungTheLuat(db, { noi: c.noi });
    assert.deepEqual(dong.map((d) => [d.nut, d.node_id]), [["da-co", cu]], "thẻ luật dựng lại phải ra đã gán, không nút mới");
  });
}

test("NPS-8: bộ soát S16 sạch trên asset_nodes sau khi nối; cấy mã khu thô thì dừng", async () => {
  const { c, cu } = await cap("a8");
  await c.khu("KHUTHOBIMAT", "Khu thô");
  const { bam } = await dungKeHoachNoi(db, { noi: c.noi });
  await apNoi(db, { bam, nguoi: "Mạnh", noi: c.noi });
  const soat = async () => soatDuLieu(new Map([["asset_nodes", (await db.query("SELECT row_to_json(x)::text AS j FROM asset_nodes x")).rows.map((r) => r.j)]]), await tokenS16(db));
  assert.equal(await soat(), null, "meta sau khi nối chỉ được mang băm khoá khu");
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"thu_tho\":\"KHUTHOBIMAT\"}'::jsonb WHERE id = $1", [cu]);
  const hit = await soat();
  await db.query("UPDATE asset_nodes SET meta = meta - 'thu_tho' WHERE id = $1", [cu]);
  assert.deepEqual([hit?.bang, hit?.cot], ["asset_nodes", "meta"], "cấy mã khu thô thì bộ soát phải dừng ở asset_nodes.meta");
});

test("NPS-10: lệnh kiểm đạt khi đúng, báo đúng loại lỗi và id nút khi lệch", async () => {
  const noi = async (ma) => {
    const x = await cap(ma);
    const { bam } = await dungKeHoachNoi(db, { noi: x.c.noi });
    const { rule_id: ruleId } = await apNoi(db, { bam, nguoi: "Mạnh", noi: x.c.noi });
    return { ...x, ruleId };
  };
  const coLoi = (kq, loai, id) => kq.loi.some((l) => l.loai === loai && l.node_id === id);
  const lanh = await noi("k1");
  assert.deepEqual(await kiemNoi(db, { ruleId: lanh.ruleId }), { ok: true, loi: [] }, "lượt nối đúng không được báo lỗi");
  // Bỏ cả khoá khu lẫn phân khu S09 của nút giữ lại: toà rơi về dự án, nút giữ lại rỗng.
  const boNut = (id) => db.query("UPDATE asset_nodes SET meta = meta - 's16_khu_ids' - 's09_sector_ids' WHERE id = $1", [id]);

  const rong = await noi("k2");
  await boNut(rong.cu);
  assert.ok(coLoi(await kiemNoi(db, { ruleId: rong.ruleId }), "giu-rong", rong.cu), "phải báo nút giữ lại rỗng");

  const conToa = await noi("k3");
  await toa(conToa.c, "KHAC", null, conToa.moi);
  assert.ok(coLoi(await kiemNoi(db, { ruleId: conToa.ruleId }), "toa-o-nut-nghi", conToa.moi), "phải báo còn toà ở nút nghỉ");

  const treo = await noi("k4");
  await boNut(treo.cu);
  assert.ok(coLoi(await kiemNoi(db, { ruleId: treo.ruleId }), "toa-treo", treo.c.P), "phải báo toà S16 treo dưới dự án");

  const khac = await noi("k5");
  const nutKhac = await nut("subzone", khac.c.ten("khac"), "Đúc lại", khac.c.P, { s16_khu_ids: [khac.c.khoa("K1")] });
  assert.ok(coLoi(await kiemNoi(db, { ruleId: khac.ruleId }), "nut-khac-mang-khoa", nutKhac), "phải báo nút khác mang khoá đã nối");
});
