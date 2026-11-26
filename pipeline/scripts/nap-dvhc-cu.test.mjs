// nap-dvhc-cu.test.mjs — PX1 danh-ba-phuong-xa-toan-quoc E10 (AC-10): code mới gộp vào main TRƯỚC khi máy thu áp 084
// vẫn chạy như cũ. DB thử (bản chép máy thu) đưa về trạng thái chưa 084 trong giao dịch (bản chép đã có 084 thì DROP cột,
// bảng trong giao dịch), rồi: bộ đọc tên = như cũ, gán S06/S03 = area_id đang lưu, reassign mới = reassign nhánh chính.
// Mọi thứ ROLLBACK. Không có bản chép thật (CI) → bỏ qua có lý do.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { coDanhBa, docPhuongHopLe, docThiTruongCoPhuong, docThiTruongCoXa, khuVucKhopTen } from "../lib/osm.mjs";
import { runReassign } from "../reassign-areas.mjs";
import { docTinNoi, doiChung, dungBoiCanh } from "./nap-dvhc-do.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const IM = { log() {}, warn() {} };

async function chuaAp084(t, fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows: [r] } = await c.query(
      `SELECT (SELECT count(*)::int FROM areas WHERE region_type = 'market' AND country_code = 'vn') AS n`,
    );
    if (r.n < 34) return t.skip("không có bản chép thật của DB máy thu (CI dựng từ migration)");
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    // Bản chép máy thu sau 084 có tin, căn trỏ xã danh bạ (vd Hoàng Sa của Đà Nẵng): khu ấy do bản sau 084 ghi, trước 084
    // xã chưa có. Gỡ tham chiếu trong cùng giao dịch (tin, căn về khu cha; dòng số tính sẵn, thị trường đã lưu của xã bỏ đi)
    // rồi mới xoá xã — không thì khoá ngoại chặn (23503). Tập tin đã gỡ trả cho ca so «area_id đang lưu»: khu lưu của chúng
    // không thuộc trạng thái trước 084 nên không đem so.
    await c.query(`CREATE TEMP TABLE xa_dvhc ON COMMIT DROP AS SELECT id, parent_id FROM areas WHERE meta->>'source' = 'dvhc'`);
    const { rows: troXa } = await c.query(
      `SELECT o.offer_id FROM sale_offer_records o JOIN xa_dvhc x ON x.id = o.area_id`,
    );
    await c.query(`
      UPDATE sale_offer_records o SET area_id = x.parent_id FROM xa_dvhc x WHERE o.area_id = x.id;
      UPDATE listing_records l SET area_id = x.parent_id FROM xa_dvhc x WHERE l.area_id = x.id;
      UPDATE properties p SET area_id = x.parent_id FROM xa_dvhc x WHERE p.area_id = x.id;
      DELETE FROM market_metrics WHERE area_id IN (SELECT id FROM xa_dvhc);
      DELETE FROM market_asset_stats WHERE area_id IN (SELECT id FROM xa_dvhc);
      DELETE FROM saved_markets WHERE area_id IN (SELECT id FROM xa_dvhc);
      UPDATE areas a SET parent_id = x.parent_id FROM xa_dvhc x WHERE a.parent_id = x.id AND a.meta->>'source' IS DISTINCT FROM 'dvhc';`);
    await c.query(`DROP TABLE IF EXISTS area_aliases; DROP INDEX IF EXISTS areas_admin_code_uq;
                   DELETE FROM areas WHERE meta->>'source' = 'dvhc'; ALTER TABLE areas DROP COLUMN IF EXISTS admin_code;`);
    const { rows: [v] } = await c.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'admin_code') AS cot,
              to_regclass('area_aliases') IS NOT NULL AS bang`,
    );
    assert.deepEqual(v, { cot: false, bang: false }, "tiền đề: DB phải ở trạng thái chưa 084");
    await fn(c, { troXa: new Set(troXa.map((x) => x.offer_id)) });
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

test("PX1-AC-10 bộ đọc tên chạy như cũ, in đúng một dòng «chưa áp 084»", (t) => chuaAp084(t, async (c) => {
  const dong = [];
  const goc = console.log;
  console.log = (...a) => dong.push(a.join(" "));
  try {
    assert.equal(await coDanhBa(c), false);
    assert.deepEqual(await docThiTruongCoXa(c), await docThiTruongCoPhuong(c));
    const tt = await docThiTruongCoPhuong(c);
    const { rows: cu } = await c.query(
      `SELECT id, name, parent_id FROM areas WHERE region_type = 'submarket' AND parent_id = ANY($1::text[])
       AND meta->>'source' = 'osm-phuong' AND NOT (meta ? 'lac') ORDER BY id`,
      [tt],
    );
    assert.deepEqual(await docPhuongHopLe(c, tt), cu);
  } finally {
    console.log = goc;
  }
  assert.equal(dong.filter((l) => l.startsWith("chưa áp 084")).length, 1);
}));

// HT4 px1-ac-10-so-dung-tin-gan-theo-ten: bộ gán PX1 «trước 084» chỉ biết gán theo tên trong bài và thị trường của nhóm — đúng
// thứ transform-zalo ghi vào cột area_id. Từ 21/11 lớp phường kế thừa từ dự án (DA45, migration 099) đè phường lên cột và giữ
// giá trị nguồn ghi ở field_provenance.area_id.goc. Ca so với G của 099 (giá trị nguồn ghi): G = goc khi cột bằng v của nhãn,
// ngược lại G = cột. Định nghĩa dương theo hợp đồng của 099, không liệt tên luật nào — lớp sau thêm luật mới không làm ca mục.
// Vì sao lọt: ca đỏ ngầm từ 18–21/11 (1.905–1.908 tin S03) vì CI bỏ qua (không có bản chép thật) và các dãy chạy suite trên bản
// mẫu DB thử dựng trước khi hai lớp ghi khu mới vào dữ liệu thật.
/** Sàn tập so (đo 22/11 trên bản chép DB máy thu: S03 2.177–2.186, trong đó 1.900–1.905 so với G): khoảng 70% số đo — co rút quá
 * 30% thì ca đỏ nêu số; dao động trong ngày (gom bài, lượt nạp) không chạm sàn. */
export const SAN_TIN_S03 = 1500;
export const SAN_TIN_SO_VOI_G = 1300;

/** Giá trị nguồn ghi (G của 099) cho mỗi tin S03 sống, và số tin có cột bị lớp sau đè, chia theo nhãn nguồn. */
export async function docGiaTriNguonGhi(c) {
  const { rows } = await c.query(
    `SELECT offer_id, area_id, field_provenance -> 'area_id' AS fp FROM sale_offer_records WHERE source = 'S03' AND retired_at IS NULL`);
  const g = new Map();
  const de = {};
  const matGoc = [];
  for (const r of rows) {
    // Nhãn đè (099): cột đang bằng v của nhãn. goc = NULL là hợp lệ (cột rỗng trước khi nhận phường); THIẾU khoá goc thì lớp
    // đè đã quên giữ giá trị nguồn ghi — ghi tên tin để ca đỏ, không lặng lẽ so với cột.
    const de_ = r.fp && r.fp.v !== undefined && r.fp.v === r.area_id;
    if (de_ && !("goc" in r.fp)) matGoc.push(r.offer_id);
    g.set(r.offer_id, de_ && "goc" in r.fp ? r.fp.goc ?? null : r.area_id);
    if (de_) { const k = `${r.fp.method ?? "?"}/${r.fp.nguon ?? "?"}`; de[k] = (de[k] ?? 0) + 1; }
  }
  return { g, de, matGoc };
}

/** So tin S06 với cột (như cũ) và tin S03 với G; tập so rỗng hay dưới sàn là lỗi, không phải xanh. */
export function soVoiNguonGhi(tin, g, bc, { san = 0, sanG = 0 } = {}) {
  const soTin = tin.s06.length + tin.s03.length;
  if (soTin === 0) throw new Error("PX1-AC-10 tập so rỗng");
  const soG = tin.s03.filter((x) => g.has(x.o.offer_id) && g.get(x.o.offer_id) !== x.o.area_id).length;
  if (tin.s03.length < san) throw new Error(`PX1-AC-10 tập so S03 ${tin.s03.length} dưới sàn ${san}`);
  if (soG < sanG) throw new Error(`PX1-AC-10 tập so với G ${soG} dưới sàn ${sanG}`);
  const s03 = tin.s03.map((x) => ({ ...x, o: { ...x.o, area_id: g.has(x.o.offer_id) ? g.get(x.o.offer_id) : x.o.area_id } }));
  return { lech: doiChung({ ...tin, s03 }, bc), soTin, soG };
}

test("PX1-AC-10 gán S06, S03 bằng code mới = giá trị nguồn ghi", (t) => chuaAp084(t, async (c, { troXa }) => {
  const tin = await docTinNoi(c);
  // Tin mà khu lưu do bản sau 084 ghi (trỏ xã danh bạ, đã gỡ ở chuaAp084) không có giá trị «trước 084» để so.
  const s06 = tin.s06.length, s03 = tin.s03.length;
  tin.s06 = tin.s06.filter((x) => !troXa.has(x.offer));
  tin.s03 = tin.s03.filter((x) => !troXa.has(x.o.offer_id));
  assert.ok(s06 + s03 - tin.s06.length - tin.s03.length <= troXa.size, "chỉ được bỏ tin đã trỏ xã danh bạ");
  const { g, de, matGoc } = await docGiaTriNguonGhi(c);
  assert.deepEqual(matGoc.slice(0, 10), [], `PX1-AC-10 nhãn đè thiếu goc ở ${matGoc.length} tin`);
  const bc = await dungBoiCanh(c);
  const { lech, soTin, soG } = soVoiNguonGhi(tin, g, bc, { san: SAN_TIN_S03, sanG: SAN_TIN_SO_VOI_G });
  console.log(`# PX1-AC-10 đem so: S06 ${tin.s06.length} · S03 ${tin.s03.length} (trong đó ${soG} so với giá trị nguồn ghi vì cột bị lớp sau đè) · tin trỏ xã danh bạ đã gỡ, không so ${troXa.size} · cột bị đè toàn bộ S03 sống theo nhãn ${JSON.stringify(de)}`);
  assert.ok(soTin > 0);
  assert.deepEqual(lech.slice(0, 10), [], `PX1-AC-10 lệch ${lech.length}`);
  // Đối soát: so với cột như cũ thì mọi tin lệch đều là tin có cột bị đè — không tin nào lệch vì lý do khác bị G che.
  const daDe = new Set(tin.s03.filter((x) => g.get(x.o.offer_id) !== x.o.area_id).map((x) => x.o.offer_id));
  const lechCot = doiChung(tin, bc);
  const ngoai = lechCot.filter((l) => !daDe.has(l.split(" ")[1].replace(/:$/, "")));
  console.log(`# PX1-AC-10 so với cột như cũ: lệch ${lechCot.length}, ngoài tập bị đè ${ngoai.length}`);
  assert.deepEqual(ngoai.slice(0, 10), [], `PX1-AC-10 ${ngoai.length} tin lệch so với cột mà không bị lớp sau đè`);
}));

test("PX1-AC-10 chiều đỏ: phá ánh xạ tên → khu thì lệch trên chính tập so; tập so rỗng thì ném", (t) => chuaAp084(t, async (c, { troXa }) => {
  const tin = await docTinNoi(c);
  tin.s06 = tin.s06.filter((x) => !troXa.has(x.offer));
  tin.s03 = tin.s03.filter((x) => !troXa.has(x.o.offer_id));
  const { g } = await docGiaTriNguonGhi(c);
  const bc = await dungBoiCanh(c);
  // Phá: mỗi phường trong ánh xạ tên của S03 (bc.entries) trỏ sang id của phường kế tiếp cùng thị trường.
  const goc = bc.entries;
  const hong = { ...bc, entries: (ms) => { const e = goc(ms); return e.map((x, i) => ({ ...x, id: e[(i + 1) % e.length].id })); } };
  const { lech, soG } = soVoiNguonGhi(tin, g, hong);
  assert.ok(lech.length > 0, "PX1-AC-10 chiều đỏ: phá ánh xạ tên → khu mà ca không lệch — thước chết");
  assert.throws(() => soVoiNguonGhi({ ...tin, s06: [], s03: [] }, g, bc), /PX1-AC-10 tập so rỗng/);
  // Dưới sàn: cắt tập S03 xuống 10 tin thì ném, thông điệp nêu số.
  assert.throws(() => soVoiNguonGhi({ ...tin, s03: tin.s03.slice(0, 10) }, g, bc, { san: SAN_TIN_S03 }),
    new RegExp(`PX1-AC-10 tập so S03 10 dưới sàn ${SAN_TIN_S03}`));
  // Nhãn đè thiếu goc: cấy trong giao dịch (xoá khoá goc của một tin có nhãn) thì bộ đọc nêu đúng tin đó.
  const { rows: [mot] } = await c.query(`SELECT offer_id FROM sale_offer_records WHERE source = 'S03' AND retired_at IS NULL
    AND field_provenance -> 'area_id' ? 'goc' AND field_provenance -> 'area_id' ->> 'v' = area_id LIMIT 1`);
  assert.ok(mot, "PX1-AC-10 chiều đỏ: bản chép không có tin nhãn đè còn goc để cấy");
  await c.query(`UPDATE sale_offer_records SET field_provenance = jsonb_set(field_provenance, '{area_id}', (field_provenance -> 'area_id') - 'goc')
                  WHERE offer_id = $1`, [mot.offer_id]);
  assert.deepEqual((await docGiaTriNguonGhi(c)).matGoc, [mot.offer_id], "PX1-AC-10 chiều đỏ: nhãn đè thiếu goc phải nêu đúng tin");
  // Lỗi cũ: so với cột sau khi lớp sau đè (bỏ G) thì lệch ở các tin có cột bị đè. Tập bị đè phải đủ sàn — rỗng là thước chết.
  assert.ok(soG >= SAN_TIN_SO_VOI_G, `PX1-AC-10 chiều đỏ: tập so với G ${soG} dưới sàn ${SAN_TIN_SO_VOI_G} — phép thử bỏ G không còn nghĩa`);
  assert.ok(doiChung(tin, bc).length > 0, "PX1-AC-10 chiều đỏ: bỏ G mà không lệch — ca không còn phân biệt cột bị đè");
}));

test("PX1-AC-10 reassign mới cho cùng kết quả với reassign của nhánh chính", (t) => chuaAp084(t, async (c) => {
  const tam = join(ROOT, `pipeline/.tmp-main-reassign-${process.pid}.mjs`);
  let goc;
  try {
    goc = execFileSync("git", ["show", "origin/main:pipeline/reassign-areas.mjs"], { cwd: ROOT, encoding: "utf8" });
  } catch {
    return t.skip("không đọc được origin/main:pipeline/reassign-areas.mjs");
  }
  writeFileSync(tam, goc);
  try {
    const { runReassign: runCu } = await import(tam);
    const tom = (r) => JSON.stringify({
      moves: r.moves, dropped: r.dropped.map((d) => d.id).sort(), removed: r.removed.map((d) => d.id).sort(),
      stale: [...r.stale].sort(),
    });
    await c.query("SAVEPOINT a");
    const moi = tom(await runReassign(c, ["hanoi", "hcmc", "danang"], { log: IM }));
    await c.query("ROLLBACK TO SAVEPOINT a");
    const cu = tom(await runCu(c, ["hanoi", "hcmc", "danang"], { log: IM }));
    assert.equal(moi, cu);
  } finally {
    rmSync(tam, { force: true });
  }
}));

test("PX1-AC-10 chiều đỏ: bỏ kiểm cột thì câu khớp tên gãy khi chưa áp 084", (t) => chuaAp084(t, async (c) => {
  await c.query("SAVEPOINT a");
  await assert.rejects(
    c.query(`SELECT id FROM areas WHERE region_type = 'submarket' AND ${khuVucKhopTen("", true)}`),
    /admin_code/,
    "PX1-AC-10 gãy khi chưa áp 084: column admin_code",
  );
  await c.query("ROLLBACK TO SAVEPOINT a");
}));
