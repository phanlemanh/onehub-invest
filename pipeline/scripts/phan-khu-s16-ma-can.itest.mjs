// phan-khu-s16-ma-can.itest.mjs — DA53 gop-nut-trung-ma-can-s16: bằng chứng mã căn S16 khi chọn cặp nối nút phân khu, thẻ nối,
// nối, đảo, lệnh kiểm, bên đọc, lượt dựng đêm + bộ soát cloud. DB thử oneinvest_dbv_gnt_<pid> dựng từ db/migrations (cùng khung
// DA46); xoá khi xong. Mỗi ca mang chiều đỏ trên chính fixture của nó.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { apNoi, apTheLuat, daoNoi, dungKeHoachNoi, dungTheLuat, kiemNoi } from "../phan-khu-s16.mjs";
import { dungTheNoi, keHoachNoi, khoaKhu, xetMaCan } from "../lib/s16-phan-khu.mjs";
import { soatDuLieu, tokenS16 } from "../lib/s16-soat.mjs";
import { docTenPhanKhu } from "../lib/phan-khu-s16-bi-danh.mjs";
import { apBiDanh, daoBiDanh, dungThe as dungTheBiDanh, kiemBiDanh } from "./bi-danh-viet-tat-phan-khu.mjs";

const TEN = `oneinvest_dbv_gnt_${process.pid}`;
const SNAP = "gnt__s16__ds";
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
const hang = async (id) => (await db.query("SELECT parent_id::int AS parent_id, aliases, meta FROM asset_nodes WHERE id = $1", [id])).rows[0];
const chup = async (ids) => Promise.all(ids.map(hang));
const nutVung = async (key) => (await db.query("SELECT region_node_id::int AS id FROM v_toa_nut_vung WHERE building_key = $1", [key])).rows[0].id;
const demBang = async () => (await db.query(
  "SELECT (SELECT count(*)::int FROM asset_nodes) AS nut, (SELECT count(*)::int FROM project_link_rules) AS luat, (SELECT md5(string_agg(row_to_json(a)::text, '' ORDER BY id)) FROM asset_nodes a) AS dau")).rows[0];
const bk = (n) => `bld_${String(n).padStart(26, "0")}`;

/** Dự án thử: mã không có dấu gạch, để `pk-<mã>` khớp đuôi của bảng nối. */
async function duAn(ma) {
  const slug = `gnt-${ma}`;
  const P = await nut("project", slug, `Dự án ${ma}`);
  const duAnS16 = `pk-${ma}`;
  const c = { P, slug, ma, duAnS16, noi: { [ma]: slug } };
  c.ten = (s) => `${slug}-${s}`;
  c.khoa = (khu) => khoaKhu(duAnS16, khu);
  c.khu = (khu, ten) => db.query("INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, $2, $3, $4)", [SNAP, duAnS16, khu, ten]);
  return c;
}

/** Toà S16 tên `toaTen` trong khu, có bí danh S16, kèm danh sách mã căn. Trả khoá toà. */
async function toa(c, khu, toaTen, maCan, s09 = null, region = c.P) {
  const key = bk(++soToa);
  const toaId = `T${soToa}`;
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [key, region]);
  await db.query("INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, $2, $3, $3, $4, $5)", [SNAP, c.duAnS16, khu, toaId, toaTen]);
  await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')", [key, `${c.duAnS16}/${toaId}`]);
  if (s09) await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S09')", [key, `p${c.ma}/${s09}`]);
  for (const m of maCan) await db.query("INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, ma_can, pha) VALUES ($1, $2, $3, $4, $5, $6, 1)",
    [SNAP, c.duAnS16, khu, toaId, toaTen, m]);
  return key;
}
const nutLuat = (c, slug, ten, khus, aliases = [ten.toLowerCase()]) => nut("subzone", c.ten(slug), ten, c.P,
  { nguon: "S16", s16_rule_id: RULE, s16_khu_ids: khus.map(c.khoa), s16_khu_rule: Object.fromEntries(khus.map((k) => [c.khoa(k), RULE])) }, aliases);

/**
 * Cụm kiểu The Rainbow: nút sẵn «The Rainbow» mang khu KA (hai toà, mỗi toà năm mã căn); nút luật «Rainbow» mang khu KB, một toà, mọi mã
 * mang tiền tố toà của KA, `trung` mã trùng hẳn. Tên toà và mã căn mang mã dự án để mỗi ca riêng một bộ chữ.
 */
async function cum(ma, { trung = 3, metaCu = {}, aliasesCu = ["the rainbow"] } = {}) {
  const c = await duAn(ma);
  const A1 = `${ma.toUpperCase()}A1`, A2 = `${ma.toUpperCase()}A2`;
  const maA = [1, 2, 3, 4, 5].flatMap((i) => [`${A1}.0${i}`, `${A2}.0${i}`]);
  await c.khu("KA", "The Rainbow"); await c.khu("KB", "Rainbow");
  const cu = await nut("subzone", c.ten("cu"), "The Rainbow", c.P, { s16_khu_ids: [c.khoa("KA")], ...metaCu }, aliasesCu);
  const toaA = [await toa(c, "KA", A1, maA.filter((m) => m.startsWith(A1))), await toa(c, "KA", A2, maA.filter((m) => m.startsWith(A2)))];
  const maB = [...maA.filter((m) => m.startsWith(A1)).slice(0, trung), `${A2}.07`, `${A2}.08`, `${A2}.09`].slice(0, Math.max(trung, 0) + 3);
  const moi = await nutLuat(c, "moi", "Rainbow", ["KB"]);
  const toaB = [await toa(c, "KB", `${ma.toUpperCase()}R`, maB)];
  return { c, cu, moi, toaA, toaB, maTho: [...maA, ...maB, A1, A2, `${ma.toUpperCase()}R`, "KA", "KB"] };
}
const noiMaCan = async (x) => {
  const kh = await dungKeHoachNoi(db, { noi: x.c.noi });
  const r = await apNoi(db, { bam: kh.bam, nguoi: "Mạnh", noi: x.c.noi });
  return { ...r, kh };
};

// ——— GNT-1: chín loại nút trên hàm chọn cặp, kèm chiều đỏ ———
const ma = (...xs) => new Set(xs);
const u = (id, toa, xs) => ({ id, toa: new Set(toa), ma: new Set(xs) });
/** Fixture chín loại nút luật, mỗi loại một dự án riêng. */
function fixture1() {
  const L = [], K = [], bc = new Map(), mc = new Map();
  const luat = (id, du, khoa) => L.push({ id, du_an_node_id: du, name: `Luật ${id}`, khoa: [khoa] });
  const khac = (id, du, khoa, node_type = "subzone") => K.push({ id, du_an_node_id: du, name: `Nút ${id}`, node_type, khoa: [khoa] });
  const can = (k, toa, xs) => mc.set(k, { toa: new Set(toa), ma: new Set(xs) });
  // 1 qua S09: giữ luật DA46.
  luat(101, 1, "k1"); khac(11, 1, "s1"); bc.set("k1", { tong_toa: 3, co_s09: 3, nut: [11] });
  // 2 S09 chỉ A (21) mà mã căn chỉ B (22): S09 thắng.
  luat(102, 2, "k2"); khac(21, 2, "s21"); khac(22, 2, "s22"); bc.set("k2", { tong_toa: 3, co_s09: 3, nut: [21] });
  can("s22", ["B1"], ["B1.01", "B1.02", "B1.03"]); can("k2", ["Q"], ["B1.01", "B1.02", "B1.03"]);
  // 3 mã căn đủ tiền tố, 3 trùng: nối.
  luat(103, 3, "k3"); khac(31, 3, "s31"); can("s31", ["C1", "C2"], ["C1.01", "C1.02", "C1.03", "C2.01"]); can("k3", ["R"], ["C1.01", "C1.02", "C1.03", "C2.09"]);
  // 4 đủ tiền tố, 2 trùng: cần người.
  luat(104, 4, "k4"); khac(41, 4, "s41"); can("s41", ["D1"], ["D1.01", "D1.02"]); can("k4", ["R"], ["D1.01", "D1.02", "D1.07"]);
  // 5 khớp cả nút cha lẫn nút con: cần người.
  luat(105, 5, "k5"); khac(51, 5, "s51"); khac(52, 5, "s52");
  can("s51", ["E1", "E2"], ["E1.01", "E1.02", "E1.03", "E2.01"]); can("s52", ["E1"], ["E1.01", "E1.02", "E1.03"]); can("k5", ["R"], ["E1.01", "E1.02", "E1.03"]);
  // 6 toà «S1» cạnh mã «S10.01»: S10.01 không mang tiền tố, nên không đủ tiền tố → không nối.
  luat(106, 6, "k6"); khac(61, 6, "s61"); can("s61", ["S1"], ["S1.01", "S1.02", "S1.03"]); can("k6", ["R"], ["S1.01", "S1.02", "S1.03", "S10.01"]);
  // 7 tiền tố một phần: không nối, dưới ngưỡng.
  luat(107, 7, "k7"); khac(71, 7, "s71"); can("s71", ["F1"], ["F1.01"]); can("k7", ["R"], ["F1.05", "W9.01"]);
  // 8 ứng viên duy nhất là nút do luật đúc (108b) hay đã nghỉ (không có trong danh sách nút): không nối.
  luat(108, 8, "k8"); luat(1081, 8, "k8b"); can("k8b", ["G1"], ["G1.01", "G1.02", "G1.03"]); can("k8", ["R"], ["G1.01", "G1.02", "G1.03"]);
  // 9 không mã căn: không nối.
  luat(109, 9, "k9"); khac(91, 9, "s91"); can("s91", ["H1"], ["H1.01", "H1.02", "H1.03"]);
  return { L, K, bc, mc };
}
/** Bản kiểm GNT-1: trả các lời sai, mỗi lời nêu id nút. Rỗng là đúng. */
function kiem1(kh) {
  const sai = [];
  const cap = new Map(kh.cap.map((x) => [x.moi_id, x]));
  const can = new Map(kh.can_nguoi.map((x) => [x.moi_id, x]));
  const khong = new Map(kh.khong_noi.map((x) => [x.moi_id, x]));
  const la = (id, ok, loi) => { if (!ok) sai.push(`nút ${id}: ${loi}`); };
  la(101, cap.get(101)?.cu_id === 11 && cap.get(101)?.can_cu === "toa-s09", "qua S09 phải nối về 11, căn cứ toa-s09");
  la(102, cap.get(102)?.cu_id === 21 && cap.get(102)?.can_cu === "toa-s09", "S09 phải thắng mã căn: giữ 21");
  la(103, cap.get(103)?.cu_id === 31 && cap.get(103)?.can_cu === "ma-can-s16" && cap.get(103)?.trung === 3 && cap.get(103)?.tien_to === 4, "mã căn đủ phải nối 31, 3 trùng, 4 tiền tố");
  la(104, !cap.has(104) && can.get(104)?.ly_do === "it-trung", "2 mã trùng phải ra cần người, không nối");
  la(105, !cap.has(105) && can.get(105)?.ly_do === "nhieu-ung-vien", "khớp cha và con phải ra cần người");
  la(106, !cap.has(106) && !can.has(106) && khong.get(106)?.ly_do === "duoi-nguong-ma-can", "S10.01 không mang tiền tố toà S1: không đủ tiền tố");
  la(107, !cap.has(107) && !can.has(107) && khong.get(107)?.ly_do === "duoi-nguong-ma-can", "tiền tố một phần phải không nối, dưới ngưỡng");
  la(108, !cap.has(108) && !can.has(108), "ứng viên do luật đúc không được nhận");
  la(109, !cap.has(109) && !can.has(109), "không mã căn thì không nối");
  return sai;
}

test("GNT-1: căn cứ mã căn chọn đúng chín loại nút; mỗi phép phá đỏ đúng ca", () => {
  const { L, K, bc, mc } = fixture1();
  const tot = keHoachNoi(L, bc, K, mc);
  assert.deepEqual(kiem1(tot), [], "bản dựng thật phải qua cả chín ca");
  const pha = (ten, kh, id) => {
    const sai = kiem1(kh);
    assert.ok(sai.some((s) => s.startsWith(`nút ${id}:`)), `chiều đỏ «${ten}» phải đỏ ở nút ${id}, được: ${JSON.stringify(sai)}`);
  };
  const voi = (tuy) => (m, uv) => xetMaCan(m, uv, tuy);
  pha("hạ ngưỡng trùng về 0", keHoachNoi(L, bc, K, mc, { xetMa: voi({ san: 0 }) }), 104);
  pha("bỏ đòi đủ tiền tố", keHoachNoi(L, bc, K, mc, { xetMa: voi({ duTienTo: false }) }), 107);
  pha("bỏ đòi đúng một ứng viên", keHoachNoi(L, bc, K, mc, { xetMa: voi({ motUngVien: false }) }), 105);
  pha("bỏ ranh giới sau tên toà", keHoachNoi(L, bc, K, mc, { xetMa: voi({ ranhGioi: false }) }), 106);
  pha("xét mã căn trước S09", keHoachNoi(L, bc, K, mc, { s09Truoc: false }), 102);
  const nhanLuat = [...K, { id: 1081, du_an_node_id: 8, name: "Luật 1081", node_type: "subzone", khoa: ["k8b"] }];
  pha("nhận ứng viên do luật đúc", keHoachNoi(L.filter((n) => n.id !== 1081), bc, nhanLuat, mc), 108);
});

test("GNT-2: thẻ in căn cứ và số mã, có mục cần người; băm ổn định, đổi theo căn cứ; không ghi; không lộ mã thô", async () => {
  const x = await cum("t2");
  const it = await cum("t2b", { trung: 2 });
  const truoc = await demBang();
  const a = await dungKeHoachNoi(db, { noi: { ...x.c.noi, ...it.c.noi } });
  const b = await dungKeHoachNoi(db, { noi: { ...x.c.noi, ...it.c.noi } });
  assert.equal(a.bam, b.bam, "dựng hai lần phải cùng băm");
  assert.deepEqual(await demBang(), truoc, "dựng thẻ không được ghi");
  assert.deepEqual(a.cap.map((c) => [c.moi_id, c.cu_id, c.can_cu, c.trung, c.tien_to, c.tong]), [[x.moi, x.cu, "ma-can-s16", 3, 6, 6]]);
  assert.deepEqual(a.can_nguoi.map((c) => [c.moi_id, c.nut, c.ly_do]), [[it.moi, [it.cu], "it-trung"]]);
  assert.match(a.markdown, /mã căn S16/);
  assert.match(a.markdown, /3 trùng \/ 6 tiền tố \/ 6/);
  assert.match(a.markdown, /## Cần người chọn/);
  const lo = (md) => [...x.maTho, ...it.maTho].find((m) => new RegExp(`(^|[^A-Za-z0-9.])${m.replace(/\./g, "\\.")}($|[^A-Za-z0-9])`).test(md));
  assert.equal(lo(a.markdown), undefined, "thẻ không được in mã khu, toà, căn thô");
  assert.equal(lo(`${a.markdown}\n${x.maTho[0]}\n`), x.maTho[0], "đối chứng: in mã căn thô vào thẻ thì phép soát phải nêu mã");
  // Băm đổi khi loại căn cứ của cùng một cặp đổi.
  const L = [{ id: 1, du_an_node_id: 9, name: "A", khoa: ["k"] }];
  const K = [{ id: 5, du_an_node_id: 9, name: "B", node_type: "subzone", khoa: ["s"] }];
  const mc = new Map([["s", { toa: new Set(["X1"]), ma: new Set(["X1.01", "X1.02", "X1.03"]) }], ["k", { toa: new Set(), ma: new Set(["X1.01", "X1.02", "X1.03"]) }]]);
  const quaS09 = keHoachNoi(L, new Map([["k", { tong_toa: 3, co_s09: 3, nut: [5] }]]), K, mc);
  const quaMa = keHoachNoi(L, new Map(), K, mc);
  assert.deepEqual([quaS09.cap[0].cu_id, quaMa.cap[0].cu_id], [5, 5], "hai bản cùng cặp");
  assert.notEqual(quaS09.bam, quaMa.bam, "băm phải đổi khi loại căn cứ đổi");
  assert.equal(dungTheNoi(quaMa).includes("X1.0"), false, "thẻ thuần cũng không in mã căn");
});

test("GNT-3: băm lệch không ghi; băm đúng nối về nút giữ; ca cần người không đổi; nối lần hai không đổi", async () => {
  const x = await cum("t3", { aliasesCu: ["the rainbow", "rb"] });
  const it = await cum("t3b", { trung: 2 });
  const noi = { ...x.c.noi, ...it.c.noi };
  const truoc = await demBang();
  const truocCan = await chup([it.moi, it.cu]);
  await assert.rejects(() => apNoi(db, { bam: "0".repeat(64), nguoi: "t", noi }), /^Error: bam-lech/);
  assert.deepEqual(await demBang(), truoc, "băm lệch không được ghi gì");
  const kh = await dungKeHoachNoi(db, { noi });
  const kq = await apNoi(db, { bam: kh.bam, nguoi: "Mạnh", noi });
  assert.equal(kq.so, 1, "chỉ một cặp được nối");
  const hMoi = await hang(x.moi), hCu = await hang(x.cu);
  assert.equal(hMoi.meta.nghi, true, "nút luật phải nghỉ");
  assert.equal(hMoi.parent_id, x.cu, "cha của nút nghỉ phải là nút giữ");
  assert.deepEqual(hCu.meta.s16_khu_ids, [x.c.khoa("KA"), x.c.khoa("KB")], "khoá khu phải về nút giữ");
  assert.deepEqual(hCu.aliases, ["the rainbow", "rb", "rainbow"], "bí danh nối vào cuối, giữ thứ tự cũ");
  for (const k of x.toaB) assert.equal(await nutVung(k), x.cu, "toà của khu chuyển phải về nút giữ");
  const sau = await demBang();
  assert.deepEqual([sau.nut, sau.luat], [truoc.nut, truoc.luat + 1], "id nút giữ không đổi, không thêm nút, đúng một dòng luật");
  assert.deepEqual(await chup([it.moi, it.cu]), truocCan, "ca cần người chọn không đổi một byte");
  const lan2 = await apNoi(db, { bam: kh.bam, nguoi: "Mạnh", noi });
  assert.equal(lan2.khongDoi, true);
  assert.deepEqual(await demBang(), sau, "nối lần hai không đổi gì");
  // Chiều đỏ: hạ ngưỡng trùng về 0 thì ca cần người lọt vào danh sách nối.
  const L = [{ id: it.moi, du_an_node_id: it.c.P, name: "Rainbow", khoa: [it.c.khoa("KB")] }];
  const mc = new Map([[it.c.khoa("KB"), { toa: new Set(), ma: new Set(["Q.01", "Q.02", "Q.03"]) }],
    [it.c.khoa("KA"), { toa: new Set(["Q"]), ma: new Set(["Q.01", "Q.02"]) }]]);
  const K = [{ id: it.cu, du_an_node_id: it.c.P, name: "The Rainbow", node_type: "subzone", khoa: [it.c.khoa("KA")] }];
  const pha = keHoachNoi(L, new Map(), K, mc, { xetMa: (m, uv) => xetMaCan(m, uv, { san: 0 }) });
  assert.ok(pha.cap.some((c) => c.moi_id === it.moi), `chiều đỏ: hạ ngưỡng thì nút ${it.moi} (cần người) lọt vào danh sách nối`);
});

/** Cụm có lượt nối DA46 (toà S09) và lượt tên tắt DA51 đã áp trên chính nút giữ, rồi một nút luật nữa chỉ có bằng chứng mã căn. */
async function cumBaLuot(ma) {
  const x = await cum(ma, { metaCu: { s09_sector_ids: [`sec-${ma}`] } });
  // Lượt DA46: nút luật «Rainbow cũ» mang khu K46, ba toà S09 thuộc phân khu của nút giữ.
  await x.c.khu("K46", "Rainbow cũ");
  const n46 = await nutLuat(x.c, "n46", "Rainbow cũ", ["K46"]);
  const snap = `gnt-s09-${ma}`;
  await db.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S09', '{}')", [snap]);
  const khoi = [1, 2, 3].map((i) => ({ id: `b${i}`, block_code: `Z9.0${i}`, sector_uuid: `sec-${ma}` }));
  await db.query("INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ($1, $2, 'du-an', $3)", [snap, `p${x.c.ma}`,
    { chiTiet: { meta: { code: "200" }, data: { id: `p${x.c.ma}`, insight_by_block: khoi } } }]);
  for (const k of khoi) await toa(x.c, "K46", `${ma.toUpperCase()}Z${k.id}`, [], k.id);
  // Chỉ dựng thẻ phần DA46: tạm ẩn mã căn của KB bằng cách đánh dấu nút mới nghỉ, áp lượt DA46, rồi trả lại.
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"nghi\": true}' WHERE id = $1", [x.moi]);
  const k46 = await dungKeHoachNoi(db, { noi: x.c.noi });
  assert.deepEqual(k46.cap.map((c) => [c.moi_id, c.cu_id, c.can_cu]), [[n46, x.cu, "toa-s09"]], "lượt DA46 phải nối bằng toà S09");
  const r46 = await apNoi(db, { bam: k46.bam, nguoi: "Mạnh", noi: x.c.noi });
  await db.query("UPDATE asset_nodes SET meta = meta - 'nghi' WHERE id = $1", [x.moi]);
  // Lượt DA51: tên tắt «trb» cho nút giữ.
  const bang = [{ vt: `trb${ma}`, ten: "rainbow", du_an: x.c.slug }];
  const the51 = await dungTheBiDanh(db, { bang, dem: false });
  const r51 = await apBiDanh(db, { bam: the51.bam, nguoi: "Mạnh", bang });
  assert.ok(r51.rule_id, "lượt tên tắt phải áp được");
  return { ...x, n46, r46: r46.rule_id, r51: r51.rule_id, vt: `trb${ma}` };
}

test("GNT-4: đảo lượt mã căn trả nguyên mọi nút, giữ tên tắt DA51 và lượt nối DA46", async () => {
  const x = await cumBaLuot("t4");
  const ids = [x.cu, x.moi, x.n46];
  const truoc = await chup(ids);
  const luat46 = (await db.query("SELECT * FROM project_link_rules WHERE id = $1", [x.r46])).rows[0];
  const { rule_id: ruleId, kh } = await noiMaCan(x);
  assert.deepEqual(kh.cap.map((c) => [c.moi_id, c.cu_id, c.can_cu]), [[x.moi, x.cu, "ma-can-s16"]]);
  await daoNoi(db, { ruleId, nguoi: "Mạnh" });
  const sau = await chup(ids);
  assert.deepEqual(sau, truoc, "aliases, meta, parent_id mọi nút phải về đúng trước nối");
  const mat = (h) => (h.aliases.includes(x.vt) ? null : x.vt);
  assert.equal(mat(sau[0]), null, `tên tắt ${x.vt} của lượt DA51 phải còn trên nút giữ`);
  assert.equal(mat({ aliases: sau[0].aliases.filter((a) => a !== x.vt) }), x.vt, "đối chứng: đảo gỡ cả tên tắt thì phép đo nêu tên tắt bị mất");
  assert.deepEqual((await db.query("SELECT * FROM project_link_rules WHERE id = $1", [x.r46])).rows[0], luat46, "lượt nối DA46 không đổi");
  const { rows: [l] } = await db.query("SELECT dao_by, dao_at FROM project_link_rules WHERE id = $1", [ruleId]);
  assert.equal(l.dao_by, "Mạnh"); assert.ok(l.dao_at, "dòng luật phải ghi giờ đảo");
});

test("GNT-5: ba lệnh kiểm thoát sạch sau nối và sau đảo; chuyển toà sang nút nghỉ thì lệnh kiểm lượt mới báo id", async () => {
  const x = await cumBaLuot("t5");
  const { rule_id: ruleId } = await noiMaCan(x);
  assert.deepEqual(await kiemNoi(db, { ruleId }), { ok: true, loi: [] }, "kiểm lượt mới phải sạch");
  assert.deepEqual(await kiemNoi(db, { ruleId: x.r46 }), { ok: true, loi: [] }, "kiểm lượt DA46 phải sạch");
  assert.equal((await kiemBiDanh(db, { ruleId: x.r51 })).ok, true, "kiểm lượt tên tắt phải sạch");
  await daoNoi(db, { ruleId, nguoi: "Mạnh" });
  assert.deepEqual(await kiemNoi(db, { ruleId: x.r46 }), { ok: true, loi: [] }, "sau đảo, kiểm lượt DA46 vẫn sạch");
  assert.equal((await kiemBiDanh(db, { ruleId: x.r51 })).ok, true, "sau đảo, kiểm lượt tên tắt vẫn sạch");
  // Chiều đỏ trên một cụm khác (toà là bảng chỉ thêm): một toà rơi vào nút nghỉ sau nối.
  const y = await cum("t5r");
  const { rule_id: rY } = await noiMaCan(y);
  await toa(y.c, "KHAC", "T5RLAC", [], null, y.moi);
  const hong = await kiemNoi(db, { ruleId: rY });
  assert.ok(hong.loi.some((l) => l.loai === "toa-o-nut-nghi" && l.node_id === y.moi), `chiều đỏ: kiểm phải nêu nút nghỉ ${y.moi}, được ${JSON.stringify(hong)}`);
});

test("GNT-6: bên đọc thấy một phân khu: GT5 bỏ nút nghỉ, tên về nút giữ; toà về nút giữ; số phân khu bớt đúng số cặp", async () => {
  const x = await cum("t6");
  const song = async () => (await docTenPhanKhu(db)).filter((r) => r.du_an === String(x.c.P));
  const demSong = async () => (await song()).length;
  const truoc = await demSong();
  const trcNoi = await chup([x.moi, x.cu]);
  await noiMaCan(x);
  const ds = await song();
  assert.equal(ds.some((r) => r.nut === String(x.moi)), false, `GT5 không được còn nút nghỉ ${x.moi}`);
  assert.ok(ds.find((r) => r.nut === String(x.cu)).aliases.includes("rainbow"), "tên của nút nghỉ phải chỉ ra nút giữ");
  for (const k of [...x.toaA, ...x.toaB]) assert.equal(await nutVung(k), x.cu, "mọi toà phải ở nút giữ");
  assert.equal(await demSong(), truoc - 1, "số phân khu chưa nghỉ bớt đúng một");
  // Chiều đỏ: lượt nối không trọn — nút luật không nghỉ, không đổi cha, khoá khu không chuyển → toà còn ở nút luật, GT5 còn thấy nó.
  const sauNoi = await chup([x.moi, x.cu]);
  const dat = (h) => [x.moi, x.cu].map((id, i) => db.query("UPDATE asset_nodes SET parent_id = $2, aliases = $3, meta = $4 WHERE id = $1", [id, h[i].parent_id, h[i].aliases, h[i].meta]));
  await Promise.all(dat(trcNoi));
  const loi = [];
  if ((await song()).some((r) => r.nut === String(x.moi))) loi.push(`GT5 thấy nút ${x.moi}`);
  for (const k of x.toaB) if ((await nutVung(k)) !== x.cu) loi.push(`toà ở nút ${await nutVung(k)}`);
  await Promise.all(dat(sauNoi));
  assert.ok(loi.length === 2 && loi[0].includes(String(x.moi)), `chiều đỏ phải đỏ ở cả hai bên đọc, được ${JSON.stringify(loi)}`);
});

test("GNT-7: lượt dựng đêm chạy hai lần không đúc lại; bộ soát cloud sạch, cấy mã khu thô thì dừng ở asset_nodes.meta", async () => {
  const x = await cum("t7");
  await noiMaCan(x);
  const truoc = (await demBang()).nut;
  // Nút chưa nghỉ mang khoá khu KA hay KB: sau nối chỉ được là nút giữ.
  const mangKhoa = async () => (await db.query(`SELECT id::int AS id FROM asset_nodes WHERE COALESCE((meta ->> 'nghi')::boolean, false) = false
    AND meta -> 's16_khu_ids' ?| $1::text[] ORDER BY id`, [[x.c.khoa("KA"), x.c.khoa("KB")]])).rows.map((r) => r.id);
  const soPhanKhu = async () => (await db.query("SELECT count(*)::int AS n FROM asset_nodes WHERE node_type = 'subzone'")).rows[0].n;
  const pk0 = await soPhanKhu();
  // Lượt dựng đêm dùng đúng bảng nối dự án S16 của dự án thử, để bước S16 chạy trên nó (không bỏ dự án).
  const lan = [];
  for (const i of [1, 2]) {
    lan.push(await dung(db, { khuSlugs: [x.c.slug], isoTheo: () => "VN-HN", noiS09: {}, noiS16: x.c.noi, log: () => {}, runId: `gnt-${i}` }));
    const { dong, bam } = await dungTheLuat(db, { noi: x.c.noi });
    assert.deepEqual(dong.map((d) => [d.khu_id, d.nut, d.node_id]).sort(), [["KA", "da-co", x.cu], ["KB", "da-co", x.cu]], `lần ${i}: dựng phân khu S16 phải ra đã gán, không nút mới`);
    assert.equal((await apTheLuat(db, { bam, nguoi: "itest", noi: x.c.noi })).khongDoi, true, `lần ${i}: áp thẻ phân khu S16 không được đổi gì`);
    assert.deepEqual(await mangKhoa(), [x.cu], `lần ${i}: khoá khu chỉ ở nút giữ ${x.cu}`);
  }
  // Đối chứng dương: bước S16 thật sự chạm dự án thử (lần một dựng căn mới), rồi lần hai không thêm khoá nào.
  assert.ok(lan[0].s16?.khu?.[x.c.slug], "đối chứng: bước S16 phải chạy trên dự án thử, không nằm ở mục bỏ dự án");
  assert.ok(lan[0].s16.khoa_moi > 0, `đối chứng: lần một phải dựng khoá S16 mới, được ${lan[0].s16.khoa_moi}`);
  assert.equal(lan[1].s16.khoa_moi, 0, "lần hai không có khoá S16 mới");
  assert.equal(await soPhanKhu(), pk0, "số nút phân khu không đổi qua hai lượt");
  assert.equal((await demBang()).nut, truoc, "số nút không đổi");
  // Chiều đỏ: một nút khác mang lại khoá khu đã chuyển thì phép đo nêu id nút ấy.
  const lai = await nut("subzone", x.c.ten("lai"), "Rainbow đúc lại", x.c.P, { s16_khu_ids: [x.c.khoa("KB")] });
  assert.deepEqual(await mangKhoa(), [x.cu, lai].sort((a, b) => a - b), `chiều đỏ: phép đo phải nêu nút đúc lại ${lai}`);
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"nghi\": true}'::jsonb WHERE id = $1", [lai]);
  for (const k of [...x.toaA, ...x.toaB]) assert.equal(await nutVung(k), x.cu, "toà vẫn ở nút giữ");
  const soat = async () => soatDuLieu(new Map([["asset_nodes", (await db.query("SELECT row_to_json(a)::text AS j FROM asset_nodes a")).rows.map((r) => r.j)]]), await tokenS16(db));
  assert.equal(await soat(), null, "asset_nodes sau nối chỉ mang băm khoá khu");
  await x.c.khu("KHUTHOGNT", "Khu thô");
  await db.query("UPDATE asset_nodes SET meta = meta || '{\"thu_tho\":\"KHUTHOGNT\"}'::jsonb WHERE id = $1", [x.cu]);
  const hit = await soat();
  await db.query("UPDATE asset_nodes SET meta = meta - 'thu_tho' WHERE id = $1", [x.cu]);
  assert.deepEqual([hit?.bang, hit?.cot], ["asset_nodes", "meta"], "cấy mã khu thô thì bộ soát phải dừng ở asset_nodes.meta");
});
