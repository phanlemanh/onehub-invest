// eval-classify-can-cu.test.mjs — hồ sơ _acceptance/truong-nhan-s03-081 E6 (AC-6): eval-classify đọc bảy trường mới theo nhóm F3 và
// loại ô căn cứ «Danh mục CĐT», qua truy vấn thật trên DB thử. Nhãn ghi bằng bên ghi thật của app (chuanHoaLuot), không viết tay.
// Chạy từ app/ để có tsx: cd app && node --import tsx --test tests/eval-classify-can-cu.test.mjs
// Nằm ở app/tests (đuôi .mjs, ngoài glob tests/*.test.tsx của suite app) vì nạp tệp .ts của app: suite pipeline chạy node không tsx.
// DB thử oneinvest_tn081 (db/db-thu.sh --neu-chua-co, bản chép DB máy thu) áp thêm 081; lát riêng 'tn081-cls', xoá cuối lượt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PIPE = join(ROOT, "pipeline");
const DB = "oneinvest_tn081";
const URL_THU = `postgres://oneinvest:oneinvest@localhost:5433/${DB}`;
const LAT = "tn081-cls";
const MOI = ["unit_number", "price_basis", "furnished", "direction_faces", "view", "availability_date", "rent_includes"];
const NHOM_MOI = { unit_number: ["A", 0.95], price_basis: ["B", 0.9], furnished: ["C", 0.8], direction_faces: ["C", 0.8], view: ["C", 0.8],
  availability_date: ["C", 0.8], rent_includes: ["C", 0.8] };

/** Bản chép pipeline/lib/eval-classify.mjs đổi đúng một chỗ (chiều đỏ); import tương đối trỏ về tệp thật. */
let soBanDot = 0;
async function banDot(tu, thanh) {
  const goc = readFileSync(join(PIPE, "lib/eval-classify.mjs"), "utf8");
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`);
  const f = join(PIPE, "lib", `.tn081-cls-${process.pid}-${++soBanDot}.mjs`);
  writeFileSync(f, goc.replace(tu, thanh));
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

/** Đầu ra đầy đủ của lệnh eval-classify trên DB thử (đọc nhãn thật + chấm), cho một bản thư viện. */
async function chay(lib, c) {
  const doc = await lib.docNhanNguoi(c, { lat: LAT, split: "test" });
  return { doc, o: lib.chamO({ tin: doc.tin }) };
}

/** Đầu ra của bản eval-classify ở điểm rẽ nhánh (merge-base với origin/main) trên cùng DB, bỏ ba ô căn cứ CĐT (lệnh xoá là thật,
 *  chỉ gọi ở cuối ca). Bản cũ lấy bằng git show — đúng mã trước vòng, không phải bản chép tay. */
async function chamTruocVong(c) {
  const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT }).toString().trim();
  const f = join(PIPE, "lib", `.tn081-cls-truoc-${process.pid}.mjs`);
  writeFileSync(f, execFileSync("git", ["show", `${base}:pipeline/lib/eval-classify.mjs`], { cwd: ROOT }));
  try {
    const cu = await import(pathToFileURL(f).href);
    // Bản cũ tự mở và commit giao dịch, nên lệnh xoá dưới đây là thật trên lát thử: chỉ gọi ở cuối ca.
    await c.query(`DELETE FROM eval_labels l USING eval_label_items i WHERE i.item_id = l.item_id AND i.lat = $1 AND l.basis = 'danh_muc_cdt'`, [LAT]);
    return (await chay(cu, c)).o;
  } finally {
    rmSync(f, { force: true });
  }
}

test("TN081-AC-6 eval-classify đọc bảy trường mới theo F3 và loại ô căn cứ Danh mục CĐT", async () => {
  execFileSync("bash", [join(ROOT, "db/db-thu.sh"), DB, "--neu-chua-co"], { stdio: "inherit" });
  const { chuanHoaLuot, LABEL_FIELDS_NHOM } = await import(join(ROOT, "app/src/lib/labels-normalize.ts"));
  const lib = await import(pathToFileURL(join(PIPE, "lib/eval-classify.mjs")).href);
  const c = new pg.Client({ connectionString: URL_THU });
  await c.connect();
  try {
    await c.query(readFileSync(join(ROOT, "db/migrations/081_labels_truong_moi.sql"), "utf8"));
    await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT]);
    await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'tn081-cls-%'`);
    const snap = (await c.query(`SELECT snapshot_id FROM airbnb_snapshots LIMIT 1`)).rows[0].snapshot_id;
    const CHU = "Bán căn ZZ9-01 2PN view hồ, thu về";
    // Hai tin; ba ô căn cứ CĐT (unit_number tin 1, area_m2 tin 1, bedrooms tin 2).
    const LUOT = [
      { unit_number: { value: "ZZ9-01", basis: "danh_muc_cdt" }, area_m2: { value: "70", basis: "danh_muc_cdt" }, kind: { value: "sale", basis: "chu_bai" },
        price_basis: { value: "net", basis: "chu_bai" }, view: { value: ["lake"], basis: "chu_bai" } },
      { bedrooms: { value: "2", basis: "danh_muc_cdt" }, kind: { value: "sale", basis: "chu_bai" }, furnished: { value: "furnished", basis: "chu_bai" } },
    ];
    for (const [k, o] of LUOT.entries()) {
      const id = `tn081-cls-${k + 1}`;
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, $2, 'Nhóm thử', $3, now())`, [id, snap, CHU]);
      const { rows } = await c.query(
        `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1,'S03',$2,$2,'test',false,'s','U-A') RETURNING item_id`, [LAT, id]);
      const raw = Object.fromEntries(LABEL_FIELDS_NHOM.map((f) => [f, { not_stated: true }]));
      raw.listing_intent = { value: "offer", basis: "chu_bai" };
      raw.multi_unit = { value: "no" };
      const ch = chuanHoaLuot({ ...raw, ...o }, { text: CHU, reason: "lý do thử" });
      assert.ok(ch.ok, JSON.stringify(ch));
      for (const r of ch.rows) {
        await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1,'u1',$2,$3,$4,$5)`,
          [rows[0].item_id, r.field, r.value, r.not_stated, r.basis]);
      }
    }

    const { doc, o } = await chay(lib, c);
    assert.equal(doc.danh_muc_cdt, 3, "ba ô CĐT bị loại");
    const t1 = doc.tin.find((t) => t.id === "tn081-cls-1");
    const t2 = doc.tin.find((t) => t.id === "tn081-cls-2");
    assert.ok(!("unit_number" in t1.nhan) && !("area_m2" in t1.nhan) && !("bedrooms" in t2.nhan), "ô CĐT vắng trong nhãn vàng");
    assert.deepEqual([t1.nhan.kind.value, t1.nhan.price_basis.value, t1.nhan.view.value, t2.nhan.furnished.value], ["sale", "net", "lake", "furnished"]);
    for (const f of MOI) {
      const x = o.find((r) => r.phan_khuc === "tat-ca" && r.cach_doc === "parser" && r.truong === f);
      assert.ok(x, `THIEU O ${f}`);
      assert.deepEqual([x.nhom, x.nguong, x.trang_thai, x.ly_do], [...NHOM_MOI[f], "skip", "chua-co-cach-doc"], f);
    }
    // Chiều đỏ 1: truy vấn không lấy cột basis — ô CĐT vào nhãn vàng.
    const boCot = await banDot("l.not_stated, l.basis\n", "l.not_stated\n");
    assert.equal((await chay(boCot, c)).doc.danh_muc_cdt, 0, "BASIS KHONG DUOC DOC");
    // Chiều đỏ 2: không lọc căn cứ.
    const khongLoc = await banDot("    if (r.basis === CAN_CU_NGOAI_TIN) {", "    if (false) {");
    const kl = await chay(khongLoc, c);
    assert.ok("unit_number" in kl.doc.tin.find((t) => t.id === "tn081-cls-1").nhan, "O CDT VAO PHEP CHAM");
    // Chiều đỏ 3: thiếu nhóm C.
    const thieuC = await banDot("export const NGUONG = Object.freeze({ A: 0.95, B: 0.9, C: 0.8 });", "export const NGUONG = Object.freeze({ A: 0.95, B: 0.9 });");
    const tc = (await chay(thieuC, c)).o.find((r) => r.phan_khuc === "tat-ca" && r.truong === "furnished");
    assert.equal(tc.nguong, undefined, "THIEU NHOM C");

    // Chín trường cũ chấm như trước: bản thư viện ở điểm rẽ nhánh (git show, không chép tay) chấm cùng nhãn, chỉ bỏ ba ô CĐT
    // (chạy cuối ca: bản cũ tự commit giao dịch nên xoá ô CĐT là thật trên lát thử, lát xoá ở finally; bản cũ không biết căn cứ này — loại ô CĐT phải tương đương ô vắng); mọi ô của trường cũ, mọi phân khúc, so deepEqual.
    const cu = await chamTruocVong(c);
    const truongCu = [...new Set(cu.map((r) => r.truong))];
    assert.equal(truongCu.length, 9, "bản trước vòng chấm chín trường");
    assert.ok(truongCu.every((f) => !MOI.includes(f)));
    const sap = (xs) => xs.map((r) => JSON.stringify(r)).sort();
    assert.deepEqual(sap(o.filter((r) => truongCu.includes(r.truong))), sap(cu), "CHIN TRUONG CU LECH BAN TRUOC VONG");
    // Chiều đỏ 0: bản đổi ngưỡng nhóm A của trường cũ thì phép so trên bắt.
    const doiNguong = await banDot("export const NGUONG = Object.freeze({ A: 0.95,", "export const NGUONG = Object.freeze({ A: 0.9,");
    const dn = (await chay(doiNguong, c)).o.filter((r) => truongCu.includes(r.truong));
    assert.notDeepEqual(sap(dn), sap(cu), "DOI NGUONG TRUONG CU KHONG BI BAT");

  } finally {
    await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT]).catch(() => {});
    await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'tn081-cls-%'`).catch(() => {});
    await c.end();
  }
});
