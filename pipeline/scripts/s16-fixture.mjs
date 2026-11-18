import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { GOC } from "./db-thu-dbv.mjs";
// s16-fixture.mjs — DA33 nap-s16-vao-danh-ba: fixture tổng hợp viết trước đủ 11 kind S16 (mã tiền tố Q, không payload thật,
// không tên nguồn). Dùng chung cho pipeline/lib/s16-danh-muc.test.mjs và pipeline/scripts/danh-ba-s16.itest.mjs.
const csv = (dau, dong) => [dau, ...dong].join("\n");
export const FIXTURE = [
  { sourceId: "du-q1", kind: "du-an", payload: { url: "https://q.example/du-an/q1", html: "<p>q</p>" } },
  { sourceId: "phan-q1", kind: "phan-khu", payload: { url: "https://q.example/pk/q1?x=1", html: "<p>pk</p>" } },
  { sourceId: "dang-ban", kind: "du-an-dang-ban", payload: { items: [{ id: 1, url: "https://q.example/d/1" }] } },
  { sourceId: "mngt-khu", kind: "mngt-khu", payload: { tenTep: "k", csv: csv("\uFEFFdu_an_alias,du_an,khu_id,khu_ten,khu_alias,so_can",
    ["qb-qa,Q Du An A,k1,Q Khu 1,q-khu-1,10", "qb-qa,Q Du An A,k2,Q Khu 2,q-khu-2,5", "qb-qa,Q, Du An A,k9,x,y,1"]) } },
  { sourceId: "mngt-toa", kind: "mngt-toa", payload: { tenTep: "t", csv: csv("du_an_alias,du_an,khu_alias,toa_id,toa_ten,so_can",
    ["qb-qa,Q Du An A,q-khu-1,t1,QS2.08,3", "qb-qa,Q Du An A,q-khu-2,t2,QSA5,2"]) } },
  { sourceId: "mngt-can", kind: "mngt-can", payload: { tenTep: "c", csv: csv("du_an_alias,du_an,khu_alias,toa_ten,ma_can",
    ["qb-qa,Q Du An A,q-khu-1,QS2.08,QS2.081101", "qb-qa,Q Du An A,q-khu-1,QS2.08,QS2.081101", "qb-qa,Q Du An A,q-khu-1,QS2.08,QS2.081102",
     "qb-qa,Q Du An A,q-khu-2,QSA5,QSA501S01"]) } },
  { sourceId: "tin-q", kind: "tin-niem-yet", payload: { items: [{ id: 7, url: "/tin/7" }] } },
  { sourceId: "toa-kha", kind: "mngt-toa-khong-alias", payload: { toaKhongAlias: {
    "qb-qa|k3": { khu: { projAlias: "qb-qa", khuId: "k3", name: "Q Khu 3", docCount: 2 }, toa: [{ value: "t3", docCount: 2, name: "QHA11-SP" }] } } } },
  { sourceId: "can-moi", kind: "mngt-can-moi", payload: {
    theoTang: JSON.stringify({ toa: "qb-qa|k3|t3", toaTen: "QHA11-SP", tongKhai: 2, can: [
      { du_an: "qb-qa", khu: "Q Khu 3", toa: "QHA11-SP", tang: "10", ma_can: "QHA11-SP.10-02" }] }) + "\n{hong",
    khongTang: "" } },
  { sourceId: "mngt-pha3", kind: "mngt-can-pha3", payload: { jsonl: JSON.stringify({ key: "qb-qa|k1|t1", toaTen: "QS2.08", khai: 3, can: [
    { du_an: "qb-qa", khu: "k1", toa: "QS2.08", ma_can: "QS2.081103", doc: 1 }] }) } },
  { sourceId: "mngt-prog", kind: "mngt-toa-progress", payload: { progress: { "qb-qa|k1|t1": { xong: true } } } },
  { kind: "du-an", payload: {} },                       // thiếu sourceId
  { sourceId: "la", kind: "khong-co", payload: {} },     // kind lạ
];

// ---- Dữ liệu S08 + S16 của itest DA33, dùng chung với itest DA37 (danh-ba-s16-cau-truc.itest.mjs) ----
export const KHU_A = "q-khu-a", KHU_B = "q-khu-b";
export const NOI = Object.freeze({ "da-a": KHU_A, "da-b": KHU_B });
export const DA = "qx-da-a", DB = "qx-da-b", DC = "qx-da-c";
export const S08_MA = ["Q12-11-01", "Q12-11-05"];
// [du_an, khu_id, toa_id, toa_ten, ma_can, tang]
export const CAN = [
  [DA, "k1", "t1", "Q12", "Q12-11-01", null],     // c1 S08 cùng mã cùng toà → bí danh
  [DA, "k1", "t1", "Q12", "Q12-11-02", null],     // c2 toà thật + nhãn gom → Q12, căn mới có trục
  [DA, "k1", "t3", "QRAINBOW", "Q12-11-02", null],
  [DA, "k2", "t2", "Q34", "Q34-05-01", null],     // c3 toà mới Q34
  [DA, "k2", "t2", "Q34", "Q12-11-05", null],     // c4 S08 xếp Q12, S16 xếp Q34 → lệch toà
  [DA, "k2", "t2", "Q34", "QLO-07", null],        // c5 mã lô → căn không trục
  [DA, "k1", "t4", "QD1", "QD1-01-01", null],     // c6 toà khớp hai → không căn
  [DA, "k1", "t1", "Q12", "Q99-01-01", null],     // c7 không toà nào là tiền tố → mơ hồ
  [DA, "k2", "t2", "Q34", "Q99-01-01", null],
  [DA, "k2", "t2", "Q34", "Q34-15-03", "15A"],    // RF3 tầng hậu tố chữ
  [DA, "k2", "t2", "Q34", " Q34-15-04 ", null],   // RF3 khoảng trắng + hoa thường → một căn
  [DA, "k1", "t2", "Q34", "q34-15-04", null],
  [DB, "kb", "tb", "QB1", "QB1-01", null],
  [DC, "kc", "tc", "QC1", "QC1-01", null],
  [DC, "kc", "tc", "QC1", "QC1-02", null],
];
export const TOA = [[DA, "k1", "t1", "Q12"], [DA, "k2", "t2", "Q34"], [DA, "k1", "t3", "QRAINBOW"], [DA, "k1", "t4", "QD1"],
  [DB, "kb", "tb", "QB1"], [DC, "kc", "tc", "QC1"]];
export const TOKEN = [...new Set([...CAN.flatMap((r) => [r[1], r[2], r[3], r[4].trim()]), ...TOA.flatMap((r) => [r[1], r[2], r[3]])])];
export const SNAP2 = "q__s16__2026-11-14T010000000";

export async function moiDuLieu(c, { s08 = true, s16 = true } = {}) {
  const nut = async (slug, ten) => (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', $2, $1, '{}', '{}', 'SubdivisionName', '{}') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id::int AS id`, [slug, ten])).rows[0].id;
  const a = await nut(KHU_A, "Q Khu A");
  await nut(KHU_B, "Q Khu B");
  if (!(await c.query("SELECT 1 FROM asset_nodes WHERE slug = 'q-khu-a-pk2'")).rowCount) {
    await c.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, meta) VALUES ('building', 'Q Khu 2', 'q-khu-a-pk2', $1, '{}', '{}')`, [a]);
    for (const n of [1, 2]) {
      const k = `bld_${String(900 + n).padStart(26, "0")}`;
      await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                     VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [k, a]);
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QD1', 'S08')`, [k]);
    }
  }
  if (s08) {
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q-s08', 'q', 'S08', '{}') ON CONFLICT DO NOTHING`);
    await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ('q8', $1, 'noi') ON CONFLICT DO NOTHING`, [a]);
    for (const ma of S08_MA) {
      await c.query(`INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name, payload)
                     VALUES ($1, 'q-s08', 'q8', 'high_rise', 'notSold', $2, NULL, '{}') ON CONFLICT DO NOTHING`, [`q8:${ma}`, ma]);
    }
  }
  if (s16) {
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}') ON CONFLICT DO NOTHING`, [SNAP2]);
    await c.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, $2, 'k2', 'Q Khu 2') ON CONFLICT DO NOTHING`, [SNAP2, DA]);
    for (const [du_an, khu, toa_id, ten] of TOA) {
      await c.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, $2, $3, $3, $4, $5)
                     ON CONFLICT DO NOTHING`, [SNAP2, du_an, khu, toa_id, ten]);
    }
    for (const [du_an, khu, toa_id, ten, ma, tang] of CAN) {
      await c.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 2) ON CONFLICT DO NOTHING`, [SNAP2, du_an, khu, toa_id, ten, tang, ma]);
    }
  }
}

/** Chạy lệnh dựng với bản đột biến của một hay nhiều tệp (bản tạm cạnh tệp gốc, xoá khi xong) — chiều đỏ của itest. */
export async function banDotBien(ds, chayFn) {
  const ten = ds.map((x, i) => ({ ...x, moi: x.tep.replace(/([^/]+)\.mjs$/, `.$1.db-${process.pid}-${Date.now()}-${i}.mjs`) }));
  try {
    for (const x of ten) {
      let src = readFileSync(join(GOC, x.tep), "utf8");
      for (const [a, b] of x.thay) {
        assert.ok(src.includes(a), `đột biến ${x.tep}: không thấy «${a.slice(0, 50)}»`);
        src = src.replace(a, b);
      }
      for (const y of ten) {
        if (y === x) continue;
        const rel = (t) => { const r = relative(dirname(x.tep), t); return r.startsWith(".") ? r : `./${r}`; };
        src = src.replaceAll(`"${rel(y.tep)}"`, `"${rel(y.moi)}"`);
      }
      writeFileSync(join(GOC, x.moi), src);
    }
    return await chayFn(await import(join(GOC, ten[0].moi)));
  } finally {
    for (const x of ten) rmSync(join(GOC, x.moi), { force: true });
  }
}
