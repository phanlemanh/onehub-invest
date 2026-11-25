// noi-du-an-nguon.itest.mjs — DA3 bang-noi-ma-du-an AC-3..AC-6 trên DB của riêng lượt (bản chép DB máy thu do db/db-thu.sh dựng).
// Chạy: bash ../db/db-thu.sh oneinvest_suite_ndn --chay node --test tests/noi-du-an-nguon.itest.mjs
// Mỗi ca chạy trong một giao dịch ngoài và lùi khi xong (lệnh dùng giaoDich 'ngoai' = savepoint), nên các ca không ảnh hưởng nhau.
import { strict as assert } from "node:assert";
import { after, before, test } from "node:test";

import pg from "pg";

import { apThe, daoLuat, dungThe } from "../noi-du-an-nguon.mjs";
import { bamKetCuc } from "../lib/khop-du-an.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("noi-du-an-nguon.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const c = new pg.Client({ connectionString: DB_URL });
before(() => c.connect());
after(() => c.end());

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try { await fn(); } finally { await c.query("ROLLBACK"); }
}
const dem = async (bang, where = "true", p = []) => Number((await c.query(`SELECT count(*) FROM ${bang} WHERE ${where}`, p)).rows[0].count);
const bam = async (sql) => (await c.query(`SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h FROM (${sql}) x`)).rows[0].h;
const BANG = ["project_links", "project_link_rules", "registry_aliases", "asset_nodes"];
const demBon = async () => Object.fromEntries(await Promise.all(BANG.map(async (b) => [b, await dem(b)])));
const banChup = async () => ({
  nut: await bam("SELECT id, node_type, name, slug, parent_id, aliases, area_ids, meta, catalog_tier FROM asset_nodes"),
  s08: await bam("SELECT * FROM s08_project_links"),
  s10: await bam("SELECT * FROM s10_project_links"),
});

test("BN-AC-3 the-chi-doc-bam-on-dinh-khong-in-ma", async () => {
  const truoc = await demBon();
  const a = await dungThe(c, "S07");
  const b = await dungThe(c, "S07");
  assert.equal(a.bam, b.bam, "hai lần dựng thẻ cùng băm");
  assert.equal(a.bam, bamKetCuc(a.ds.map((d) => ({ ma: d.ma, kq: d.kq }))), "băm tính lại độc lập khớp");
  assert.deepEqual(await demBon(), truoc, "dựng thẻ không ghi gì");
  const md = a.markdown;
  // Mã không được nằm ở ô nào của bảng mẫu và bảng khác nối sẵn (phần sau tiêu đề «##»; bảng tổng chỉ có tên ngả và số đếm).
  const o = new Set(md.slice(md.indexOf("\n## ")).split("\n").filter((l) => l.startsWith("| ")).flatMap((l) => l.split("|").map((x) => x.trim())));
  const loMa = a.ds.filter((d) => o.has(d.ma));
  assert.equal(loMa.length, 0, `thẻ lộ mã nguồn: ${loMa.slice(0, 3).map((d) => d.ma).join(", ")}`);
  for (const [can, nhom] of Object.entries(a.mau)) assert.equal(nhom.length, Math.min(20, a.tong[can]), `mẫu ${can}`);
  const doi = a.ds.map((d, i) => (i === 0 ? { ma: d.ma, kq: { ...d.kq, ly_do: "khac" } } : { ma: d.ma, kq: d.kq }));
  assert.notEqual(bamKetCuc(doi), a.bam, "đổi một kết cục thì băm khác");
});

test("BN-AC-4 ap-bam-sai-khong-ghi-bam-dung-ghi-du-lan-hai-khong-doi", () => trongGiaoDich(async () => {
  const truoc = await demBon();
  const chup = await banChup();
  const SQL_BI_DANH_CU = "SELECT id, object_key, kind, value, source, retired_at FROM registry_aliases WHERE NOT (source = 'S07' AND kind = 'ma_nguon')";
  const biDanhCu = await bam(SQL_BI_DANH_CU);
  await assert.rejects(apThe(c, { nguon: "S07", bam: "0".repeat(64), nguoi: "thu", giaoDich: "ngoai" }), /bam-lech/);
  assert.deepEqual(await demBon(), truoc, "băm sai không ghi gì");
  const the = await dungThe(c, "S07");
  const kq = await apThe(c, { nguon: "S07", bam: the.bam, nguoi: "thu", giaoDich: "ngoai" });
  assert.deepEqual(kq.rules.map((r) => r.can_cu).sort(), ["S07-K3", "S07-T", "S07-trang-thai"]);
  assert.equal(await dem("project_links", "source = 'S07'"), the.ds.length, "mỗi bản ghi một dòng");
  assert.equal(await dem("project_links", "source = 'S07' AND rule_id IS NULL"), 0, "mọi dòng mang rule_id");
  const noi = await dem("project_links", "source = 'S07' AND status = 'noi'");
  assert.equal(noi, (the.tong.K3 ?? 0) + (the.tong.T ?? 0));
  assert.equal(await dem("registry_aliases", "source = 'S07' AND kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\\_an/%'"), noi,
    "mỗi dòng nối đúng một bí danh (kể cả hai mã cùng nút)");
  assert.deepEqual(await banChup(), chup, "asset_nodes, s08_project_links, s10_project_links không đổi");
  assert.equal(await bam(SQL_BI_DANH_CU), biDanhCu, "bí danh có sẵn không đổi");
  const lan2 = await apThe(c, { nguon: "S07", bam: (await dungThe(c, "S07")).bam, nguoi: "thu", giaoDich: "ngoai" });
  assert.equal(lan2.khongDoi, true, "áp lần hai không đổi");
}));

test("BN-AC-4 mot-giao-dich: loi o bi danh thu 10 thi khong dong nao cua luot con lai", () => trongGiaoDich(async () => {
  const truoc = await demBon();
  const the = await dungThe(c, "S07");
  await assert.rejects(apThe(c, { nguon: "S07", bam: the.bam, nguoi: "thu", giaoDich: "ngoai",
    _sauBiDanh: async (n) => { if (n === 10) throw new Error("cay-loi-bi-danh-10"); } }), /cay-loi-bi-danh-10/);
  assert.deepEqual(await demBon(), truoc);
}));

test("BN-AC-4 stg-doi-sau-khi-dung-the-thi-bam-lech", () => trongGiaoDich(async () => {
  const the = await dungThe(c, "S07");
  const k3 = the.ds.find((d) => d.kq.nga === "noi" && d.kq.can_cu === "K3");
  await c.query("UPDATE stg_s07_project_card SET project_name = project_name || ' X' WHERE pj_id = $1::int", [k3.ma]);
  await c.query("UPDATE stg_s07_project SET project_name = project_name || ' X' WHERE pj_id = $1::int", [k3.ma]);
  await assert.rejects(apThe(c, { nguon: "S07", bam: the.bam, nguoi: "thu", giaoDich: "ngoai" }), /bam-lech/);
}));

test("BN-AC-5 dao-tung-luat-roi-lui-tron", () => trongGiaoDich(async () => {
  const biDanhSongTruoc = await bam("SELECT object_key, value, source FROM registry_aliases WHERE retired_at IS NULL");
  const the = await dungThe(c, "S07");
  const { rules } = await apThe(c, { nguon: "S07", bam: the.bam, nguoi: "thu", giaoDich: "ngoai" });
  const id = Object.fromEntries(rules.map((r) => [r.can_cu, r.id]));
  const demSau = await demBon();
  const k3Truoc = await bam(`SELECT * FROM project_links WHERE rule_id = ${id["S07-K3"]}`);
  const r = await daoLuat(c, { ruleId: id["S07-T"], nguoi: "thu", giaoDich: "ngoai" });
  assert.equal(r.soBiDanh, the.tong.T, "mọi bí danh của luật T nghỉ");
  assert.equal(await dem("project_links", "rule_id = $1 AND status = 'noi'", [id["S07-T"]]), 0);
  assert.equal(await dem("project_links", "rule_id = $1 AND ly_do = 'dao-luat'", [id["S07-T"]]), the.tong.T);
  assert.equal(await dem("project_link_rules", "id = $1 AND dao_by IS NOT NULL AND dao_at IS NOT NULL", [id["S07-T"]]), 1);
  assert.equal(await bam(`SELECT * FROM project_links WHERE rule_id = ${id["S07-K3"]}`), k3Truoc, "luật K3 không đổi");
  await assert.rejects(daoLuat(c, { ruleId: id["S07-T"], nguoi: "thu", giaoDich: "ngoai" }), /da-dao/);
  for (const can of ["S07-K3", "S07-trang-thai"]) await daoLuat(c, { ruleId: id[can], nguoi: "thu", giaoDich: "ngoai" });
  assert.equal(await dem("project_links", "source = 'S07' AND status = 'noi'"), 0, "lùi trọn: không còn dòng nối S07");
  const sauLui = await demBon();
  for (const b of BANG) assert.ok(sauLui[b] >= demSau[b], `lùi không xoá dòng ${b}`);
  assert.equal(await bam("SELECT object_key, value, source FROM registry_aliases WHERE retired_at IS NULL"), biDanhSongTruoc,
    "bí danh còn hiệu lực bằng trước áp");
}));

test("BN-AC-6 noi-san-thang-s08-tu-choi-s08-liet-6-ca", () => trongGiaoDich(async () => {
  const s09 = await dungThe(c, "S09");
  assert.equal(s09.tong.giu, 2, "S09 giữ 2 chép cứng");
  const s16 = await dungThe(c, "S16");
  assert.equal(s16.tong.giu, 5, "S16 giữ 5 chép cứng");
  await assert.rejects(apThe(c, { nguon: "S08", bam: "0".repeat(64), nguoi: "thu", giaoDich: "ngoai" }), /S08 do thẻ luật DA55 nối/);
  const s08 = await dungThe(c, "S08");
  assert.equal(s08.lech.length, 6, "thẻ bóng S08 liệt 6 ca khác nối tay");
  assert.match(s08.markdown, /quy ước dự án con có cha \(ROADMAP §3 mục 39\)/);
  // Cấy nút trùng tên, cùng xã với một dự án S09 chép cứng: bản ghi vẫn giữ nút chép cứng, có mặt ở danh sách khác nối sẵn.
  const g = s09.ds.find((d) => d.kq.nga === "giu" && d.xa);
  await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier) VALUES ('project', $1, 'da3-thu-trung', '{}', ARRAY[$2], 'mot_loi_khai')`,
    [g.ten, g.xa]);
  const lai = await dungThe(c, "S09");
  const d = lai.ds.find((x) => x.ma === g.ma);
  assert.equal(d.kq.nga, "giu");
  assert.equal(d.kq.node_id, g.kq.node_id, "nối có sẵn thắng");
  assert.ok(lai.lech.some((x) => x.ma === g.ma), "có mặt ở danh sách khác nối sẵn");
}));
