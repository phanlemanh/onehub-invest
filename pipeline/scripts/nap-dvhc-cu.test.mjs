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

test("PX1-AC-10 gán S06, S03 bằng code mới = area_id đang lưu", (t) => chuaAp084(t, async (c, { troXa }) => {
  const tin = await docTinNoi(c);
  // Tin mà khu lưu do bản sau 084 ghi (trỏ xã danh bạ, đã gỡ ở chuaAp084) không có giá trị «trước 084» để so.
  const s06 = tin.s06.length, s03 = tin.s03.length;
  tin.s06 = tin.s06.filter((x) => !troXa.has(x.offer));
  tin.s03 = tin.s03.filter((x) => !troXa.has(x.o.offer_id));
  assert.ok(s06 + s03 - tin.s06.length - tin.s03.length <= troXa.size, "chỉ được bỏ tin đã trỏ xã danh bạ");
  assert.ok(tin.s06.length > 0 || tin.s03.length > 0, "bản chép không có tin nối được");
  const lech = doiChung(tin, await dungBoiCanh(c));
  assert.deepEqual(lech.slice(0, 10), [], `PX1-AC-10 lệch ${lech.length}`);
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
