// dong-the-bo-sung-tin.test.mjs — NB9 `dong-the-bo-sung-tin-theo-luat`, E1–E9 ↔ AC-1–AC-9.
// Chạy trên DB của riêng lượt (bash db/db-thu.sh oneinvest_suite_<bộ> --chay …). Mỗi ca chạy trong BEGIN … ROLLBACK: dọn sạch
// thẻ agent_output và đề xuất trong giao dịch rồi dựng fixture viết tay; ranh giới giao dịch của lệnh thay bằng SAVEPOINT
// (lệnh nhận `gd`). Bảng bị ghi đo bằng pg_stat_xact_user_tables (gồm cả giao dịch con) — rẻ hơn băm field_assertions 2,2 triệu dòng.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { LY_DO_DE_XUAT, NGUOI_LAM, NHOM, SQL_DEM_DOC_LAP, phanNhom } from "../lib/dong-the-bo-sung-tin.mjs";
import { chayLui, chayThat, chayThu } from "./dong-the-bo-sung-tin.mjs";
import { CONG_NGUOI_SQL, THE_NGUOI_QUYET_SQL } from "../../scripts/bao-cao-ngay.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GD = { begin: "SAVEPOINT nb9", commit: "RELEASE SAVEPOINT nb9", rollback: "ROLLBACK TO SAVEPOINT nb9" };

let c;
let tin; // { song: [offer có property_type + bedrooms], trongPn, nghi }
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — chạy qua db/db-thu.sh oneinvest_suite_<bộ> --chay");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [d] } = await c.query("SELECT current_database() AS db");
  if (d.db === "oneinvest") throw new Error("không chạy trên DB chung oneinvest");
  const song = (await c.query(`SELECT offer_id, property_type, bedrooms FROM sale_offers
     WHERE property_type IS NOT NULL AND bedrooms IS NOT NULL ORDER BY offer_id LIMIT 14`)).rows;
  const trongPn = (await c.query(`SELECT offer_id, property_type FROM sale_offers
     WHERE property_type IS NOT NULL AND bedrooms IS NULL ORDER BY offer_id LIMIT 1`)).rows[0];
  const nghi = (await c.query(`SELECT r.offer_id FROM sale_offer_records r
     WHERE NOT EXISTS (SELECT 1 FROM sale_offers s WHERE s.offer_id = r.offer_id) ORDER BY r.offer_id LIMIT 1`)).rows[0];
  assert.ok(song.length === 14 && trongPn && nghi, "DB thử thiếu tin để dựng fixture");
  tin = { song, trongPn, nghi };
});
after(async () => { await c?.end(); });

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("DELETE FROM review_queue WHERE item_type = 'agent_output'");
    await c.query("DELETE FROM enrichment_proposals");
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

const khac = (pt) => (pt === "house" ? "apartment" : "house");
async function the(ma, offerId, { status = "pending", itemType = "agent_output", decidedBy = null } = {}) {
  const { rows: [r] } = await c.query(
    `INSERT INTO review_queue (item_type, item_id, title, status, decided_by, decided_at)
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 <> 'pending' THEN now() END) RETURNING id`,
    [itemType, itemType === "agent_output" ? `enrich:${offerId}` : `dq:${ma}:${offerId}`, `nb9 ${ma}`, status, decidedBy]);
  return Number(r.id);
}
async function dx(reviewId, offerId, field, value, { status = "queued", source = "e2_llm" } = {}) {
  const { rows: [r] } = await c.query(
    `INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, review_id)
     VALUES ('nb9-test', $1, $2, $3, $3, $4, 'review', $5, $6) RETURNING id`, [offerId, field, String(value), source, status, reviewId]);
  return Number(r.id);
}

/** Fixture 16 thẻ của E1 — trả { id theo mã, nhóm mong đợi theo mã, đề xuất nhóm 2 }. */
async function dungFixture() {
  const s = tin.song;
  const id = {};
  // (a) chờ, 0 đề xuất
  id.a = await the("a", s[0].offer_id);
  // (b) chờ, chỉ đề xuất applied
  id.b = await the("b", s[1].offer_id); await dx(id.b, s[1].offer_id, "property_type", s[1].property_type, { status: "applied" });
  // (c) chờ, chỉ đề xuất skipped/rejected/superseded/reverted
  id.c = await the("c", s[2].offer_id);
  await dx(id.c, s[2].offer_id, "property_type", "land", { status: "skipped" });
  await dx(id.c, s[2].offer_id, "property_type", "room", { status: "rejected" });
  await dx(id.c, s[2].offer_id, "bedrooms", "9", { status: "superseded" });
  await dx(id.c, s[2].offer_id, "bathrooms", "2", { status: "reverted" });
  // (d) chờ, một đề xuất loại hình trùng
  id.d = await the("d", s[3].offer_id); const dxD = await dx(id.d, s[3].offer_id, "property_type", s[3].property_type);
  // (e) chờ, PN trùng
  id.e = await the("e", s[4].offer_id); const dxE = await dx(id.e, s[4].offer_id, "bedrooms", s[4].bedrooms);
  // (f) chờ, loại hình trùng + PN trùng
  id.f = await the("f", s[5].offer_id);
  const dxF1 = await dx(id.f, s[5].offer_id, "property_type", s[5].property_type);
  const dxF2 = await dx(id.f, s[5].offer_id, "bedrooms", s[5].bedrooms, { source: "e1_rule" });
  // (g) chờ, loại hình trùng + loại hình lệch
  id.g = await the("g", s[6].offer_id);
  await dx(id.g, s[6].offer_id, "property_type", s[6].property_type);
  await dx(id.g, s[6].offer_id, "property_type", khac(s[6].property_type), { source: "e1_rule" });
  // (h) chờ, loại hình trùng + WC
  id.h = await the("h", s[7].offer_id);
  await dx(id.h, s[7].offer_id, "property_type", s[7].property_type); await dx(id.h, s[7].offer_id, "bathrooms", "2");
  // (i) chờ, toà
  id.i = await the("i", s[8].offer_id); await dx(id.i, s[8].offer_id, "block_raw", "A1");
  // (j) chờ, đường
  id.j = await the("j", s[9].offer_id); await dx(id.j, s[9].offer_id, "street_raw", "Phố Thử");
  // (k) chờ, PN đề xuất mà ô tin trống
  id.k = await the("k", tin.trongPn.offer_id); await dx(id.k, tin.trongPn.offer_id, "bedrooms", "2");
  // (l) chờ, tin vắng khỏi sale_offers
  id.l = await the("l", tin.nghi.offer_id); await dx(id.l, tin.nghi.offer_id, "property_type", "apartment");
  // (m) «Để sau», 0 đề xuất
  id.m = await the("m", s[10].offer_id, { status: "deferred", decidedBy: "usr_nb9" });
  // (n) đã bác
  id.n = await the("n", s[11].offer_id, { status: "rejected", decidedBy: "usr_nb9" });
  // (o) data_quality chờ
  id.o = await the("o", s[12].offer_id, { itemType: "data_quality" });
  // (p) chờ; đề xuất queued của cùng tin trỏ thẻ khác (thẻ «Để sau» m) → nhóm 1
  id.p = await the("p", s[13].offer_id); await dx(id.m, s[13].offer_id, "property_type", khac(s[13].property_type));
  const nhom = { a: 1, b: 1, c: 1, p: 1, d: 2, e: 2, f: 2 };
  return { id, nhom, dxNhom2: [dxD, dxE, dxF1, dxF2].sort((x, y) => x - y) };
}

async function ghiBang() {
  const { rows } = await c.query(`SELECT relname, n_tup_ins + n_tup_upd + n_tup_del AS n FROM pg_stat_xact_user_tables`);
  return Object.fromEntries(rows.map((r) => [r.relname, Number(r.n)]));
}
const bangDoi = (truoc, sau) => Object.keys(sau).filter((k) => (sau[k] ?? 0) !== (truoc[k] ?? 0)).sort();
const anh = async (bang) => (await c.query(`SELECT * FROM ${bang} ORDER BY id`)).rows.map((r) => JSON.stringify(r));
const thuMucTam = () => mkdtempSync(path.join(os.tmpdir(), "nb9-"));

test("E1 AC-1 phân nhóm theo luật — 16 thẻ viết tay", async () => {
  await trongGiaoDich(async () => {
    const f = await dungFixture();
    const pn = await phanNhom(c);
    const thucTe = Object.fromEntries(pn.the.map((t) => [t.id, t.nhom === NHOM.khongConDeXuat ? 1 : 2]));
    for (const [ma, theId] of Object.entries(f.id)) {
      assert.equal(thucTe[theId] ?? 0, f.nhom[ma] ?? 0, `thẻ ${ma} (id ${theId}): nhóm sai`);
    }
    assert.deepEqual(pn.nhom2.flatMap((t) => t.de_xuat).sort((x, y) => x - y), f.dxNhom2, "đề xuất nhóm 2");
  });
});

test("E2 AC-2 chạy thử: số từng nhóm, câu đếm độc lập, không ghi", async () => {
  await trongGiaoDich(async () => {
    await dungFixture();
    const truoc = await ghiBang();
    const k = await chayThu(c, GD);
    assert.deepEqual({ n1: k.nhom1, n2: k.nhom2, dx: k.soDeXuat, cl: k.conLai }, { n1: 4, n2: 3, dx: 4, cl: 6 });
    for (const [n, sql] of Object.entries(SQL_DEM_DOC_LAP)) {
      assert.equal(Number((await c.query(sql)).rows[0].count), n === NHOM.khongConDeXuat ? 4 : 3, `câu đếm độc lập ${n}`);
    }
    assert.deepEqual(bangDoi(truoc, await ghiBang()), [], "chế độ thử ghi bảng");
    // Đối chứng dương: một UPDATE ngoài lệnh làm thước đỏ.
    await c.query("UPDATE review_queue SET title = title || '' WHERE id = (SELECT min(id) FROM review_queue)");
    assert.deepEqual(bangDoi(truoc, await ghiBang()), ["review_queue"]);
  });
});

test("E3 AC-3 chạy thật: đúng thẻ/đề xuất đổi, bảng tin không đổi, lỗi giữa chừng lùi trọn", async () => {
  await trongGiaoDich(async () => {
    const f = await dungFixture();
    const rqTruoc = await anh("review_queue"), epTruoc = await anh("enrichment_proposals");
    const truoc = await ghiBang();
    // Lỗi giả ở thẻ thứ 5 → lùi trọn.
    await assert.rejects(chayThat(c, { gd: GD, thuMuc: thuMucTam(), sauMoiThe: (i) => { if (i === 5) throw new Error("lỗi giả"); } }), /lỗi giả/);
    assert.deepEqual(await anh("review_queue"), rqTruoc, "lỗi giữa chừng: review_queue phải nguyên");
    assert.deepEqual(await anh("enrichment_proposals"), epTruoc, "lỗi giữa chừng: enrichment_proposals phải nguyên");
    const k = await chayThat(c, { gd: GD, thuMuc: thuMucTam(), luot: "t3" });
    assert.deepEqual({ n1: k.nhom1, n2: k.nhom2, dx: k.soDeXuat }, { n1: 4, n2: 3, dx: 4 });
    const dong = new Set(Object.entries(f.nhom).map(([ma]) => f.id[ma]));
    for (const r of (await c.query("SELECT * FROM review_queue ORDER BY id")).rows) {
      const cu = JSON.parse(rqTruoc.find((x) => JSON.parse(x).id === r.id));
      if (dong.has(Number(r.id))) {
        assert.equal(r.status, "rejected", `thẻ ${r.id}`);
        assert.equal(r.decided_by, NGUOI_LAM);
        assert.ok(r.decided_at, "decided_at");
        assert.match(r.decision_note, /khong-con-de-xuat|trung-gia-tri-tin/);
      } else {
        assert.deepEqual(JSON.parse(JSON.stringify(r)), cu, `thẻ ngoài nhóm ${r.id} bị đổi`);
      }
    }
    for (const r of (await c.query("SELECT * FROM enrichment_proposals ORDER BY id")).rows) {
      if (f.dxNhom2.includes(Number(r.id))) {
        assert.equal(r.status, "skipped"); assert.equal(r.decided_by, NGUOI_LAM);
        assert.equal(r.evidence.ly_do, LY_DO_DE_XUAT); assert.equal(r.evidence.dong_the_luot, "t3");
      } else {
        assert.deepEqual(JSON.stringify(r), epTruoc.find((x) => JSON.parse(x).id === r.id), `đề xuất ngoài nhóm ${r.id} bị đổi`);
      }
    }
    assert.deepEqual(bangDoi(truoc, await ghiBang()), ["enrichment_proposals", "review_queue"], "chỉ hai bảng được ghi");
  });
});

test("E4 AC-4 thẻ đổi giữa phân nhóm và ghi: tính lại trong giao dịch", async () => {
  await trongGiaoDich(async () => {
    const f = await dungFixture();
    const xem = await phanNhom(c);
    assert.equal(xem.the.length, 7);
    await c.query("UPDATE review_queue SET status = 'approved', decided_by = 'usr_nb9', decided_at = now() WHERE id = $1", [f.id.a]);
    await dx(f.id.d, tin.song[3].offer_id, "bathrooms", "3");
    const k = await chayThat(c, { gd: GD, thuMuc: thuMucTam() });
    assert.equal(k.nhom1 + k.nhom2, 5, "số đã đóng");
    const st = async (i) => (await c.query("SELECT status, decided_by FROM review_queue WHERE id = $1", [i])).rows[0];
    assert.deepEqual(await st(f.id.a), { status: "approved", decided_by: "usr_nb9" }, "thẻ người đã quyết bị đè");
    assert.equal((await st(f.id.d)).status, "pending", "thẻ có đề xuất mới bị đóng");
  });
});

test("E5 AC-5 tệp lùi ghi giá trị cũ; lượt lỗi không để tệp hoàn tất", async () => {
  await trongGiaoDich(async () => {
    const f = await dungFixture();
    const dir = thuMucTam();
    await assert.rejects(chayThat(c, { gd: GD, thuMuc: dir, luot: "loi", sauMoiThe: (i) => { if (i === 2) throw new Error("x"); } }));
    assert.equal(existsSync(path.join(dir, "lui-loi.json")), false, "lượt lỗi để lại tệp hoàn tất");
    const rqTruoc = (await c.query("SELECT id, status, decided_by, decided_at, decision_note FROM review_queue ORDER BY id")).rows;
    const epTruoc = (await c.query("SELECT id, status, decided_by, evidence FROM enrichment_proposals ORDER BY id")).rows;
    const k = await chayThat(c, { gd: GD, thuMuc: dir, luot: "ok" });
    const tep = JSON.parse(readFileSync(k.tep, "utf8"));
    assert.equal(tep.the.length, 7); assert.equal(tep.de_xuat.length, 4);
    for (const t of tep.the) {
      const cu = rqTruoc.find((r) => Number(r.id) === t.id);
      assert.deepEqual([t.status, t.decided_by, t.decided_at, t.decision_note], [cu.status, cu.decided_by, cu.decided_at, cu.decision_note]);
    }
    for (const d of tep.de_xuat) {
      const cu = epTruoc.find((r) => Number(r.id) === d.id);
      assert.deepEqual([d.status, d.decided_by, d.evidence], [cu.status, cu.decided_by, cu.evidence]);
    }
    assert.deepEqual(readdirSync(dir).filter((t) => t.endsWith(".json")), ["lui-ok.json"]);
    void f;
  });
});

test("E6 AC-6 lùi về nguyên trạng; dòng người đã đổi không bị đè", async () => {
  await trongGiaoDich(async () => {
    const f = await dungFixture();
    const rq = await anh("review_queue"), ep = await anh("enrichment_proposals");
    const k = await chayThat(c, { gd: GD, thuMuc: thuMucTam(), luot: "l1" });
    const l = await chayLui(c, k.tep, GD);
    assert.deepEqual(l.xungDot, []);
    assert.deepEqual(await anh("review_queue"), rq, "lùi: review_queue");
    assert.deepEqual(await anh("enrichment_proposals"), ep, "lùi: enrichment_proposals");
    // Xung đột
    const k2 = await chayThat(c, { gd: GD, thuMuc: thuMucTam(), luot: "l2" });
    await c.query("UPDATE review_queue SET status = 'approved', decided_by = 'usr_nb9' WHERE id = $1", [f.id.b]);
    const l2 = await chayLui(c, k2.tep, GD);
    assert.deepEqual(l2.xungDot, [`the:${f.id.b}`]);
    assert.equal((await c.query("SELECT status FROM review_queue WHERE id = $1", [f.id.b])).rows[0].status, "approved");
    assert.equal((await c.query("SELECT status FROM review_queue WHERE id = $1", [f.id.a])).rows[0].status, "pending");
  });
});

test("E7 AC-7 chạy lại lần hai: 0 thẻ, 0 đề xuất", async () => {
  await trongGiaoDich(async () => {
    await dungFixture();
    await chayThat(c, { gd: GD, thuMuc: thuMucTam() });
    const rq = await anh("review_queue"), ep = await anh("enrichment_proposals");
    const k = await chayThat(c, { gd: GD, thuMuc: thuMucTam() });
    assert.deepEqual({ n: k.nhom1 + k.nhom2, dx: k.soDeXuat }, { n: 0, dx: 0 });
    assert.deepEqual(await anh("review_queue"), rq); assert.deepEqual(await anh("enrichment_proposals"), ep);
  });
});

test("E8 AC-8 đường xử lại skipped của doc-toan-bo không bốc đề xuất của lượt", async () => {
  const nguon = readFileSync(path.join(ROOT, "agent/src/enrich/doc-toan-bo.ts"), "utf8");
  const cau = /`(SELECT id, offer_id, value, run_id, evidence->>'trich' AS trich FROM enrichment_proposals[\s\S]*?)`/.exec(nguon)?.[1];
  assert.ok(cau && cau.includes("'khong-tu-khoa'"), "không rút được câu xử lại từ doc-toan-bo.ts");
  const cauMoiBan = cau.replace("evidence->>'prompt_version' = $1", "evidence->>'prompt_version' IS NOT DISTINCT FROM evidence->>'prompt_version'");
  await trongGiaoDich(async () => {
    const f = await dungFixture();
    // Đối chứng dương: đề xuất skipped ly_do khong-tu-khoa có prompt_version vẫn được bốc.
    const s = tin.song[0];
    const { rows: [m] } = await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, evidence)
      VALUES ('nb9-moi', $1, 'property_type', 'land', 'land', 'e2_llm', 'review', 'skipped', '{"ly_do":"khong-tu-khoa","prompt_version":"v-thu"}') RETURNING id`, [s.offer_id]);
    // Đề xuất nhóm 2 mang prompt_version để câu lọc có cơ hội bốc nếu ly_do không được đổi.
    await c.query(`UPDATE enrichment_proposals SET evidence = evidence || '{"prompt_version":"v-thu"}' WHERE id = ANY($1::bigint[])`, [f.dxNhom2]);
    await chayThat(c, { gd: GD, thuMuc: thuMucTam() });
    const boc = (await c.query(cauMoiBan)).rows.map((r) => Number(r.id));
    assert.ok(boc.includes(Number(m.id)), "đối chứng dương không được bốc");
    assert.deepEqual(boc.filter((i) => f.dxNhom2.includes(i)), [], "đường xử lại bốc đề xuất của lượt đóng thẻ");
  });
});

test("E9 AC-9 hai câu đếm «quyết» chỉ tính thẻ do người quyết", async () => {
  const dongBang = /THE_DONG_BANG_SQL\s*=\s*"([^"]+)"/.exec(readFileSync(path.join(ROOT, "app/src/lib/ops/review-dong-bang.ts"), "utf8"))[1];
  const nguonTrang = readFileSync(path.join(ROOT, "app/src/lib/ops/review-dau-trang.ts"), "utf8");
  const viTuTs = /THE_NGUOI_QUYET_SQL = "([^"]+)"/.exec(nguonTrang)[1].replace(/\\\\/g, "\\");
  assert.equal(viTuTs, THE_NGUOI_QUYET_SQL, "vị từ «thẻ do người quyết» lệch giữa app và báo cáo ngày");
  const DAU_TRANG = /DAU_TRANG_SQL = `([\s\S]*?)`;/.exec(nguonTrang)[1]
    .replace("${KHONG_DONG_BANG_SQL}", `NOT ${dongBang}`).replace("${THE_NGUOI_QUYET_SQL}", viTuTs);
  await trongGiaoDich(async () => {
    await c.query("DELETE FROM review_queue");
    const s = tin.song;
    for (let i = 0; i < 3; i++) await the(`nguoi${i}`, s[i].offer_id, { status: "approved", decidedBy: `usr_nb9_${i}` });
    for (let i = 3; i < 7; i++) await the(`may${i}`, s[i].offer_id, { status: "rejected", decidedBy: NGUOI_LAM });
    await the("transform", s[10].offer_id, { status: "rejected", decidedBy: "transform:S03" });
    await the("dung", s[11].offer_id, { status: "deferred", itemType: "data_quality", decidedBy: "dung-nguoi" });
    for (let i = 7; i < 9; i++) await the(`cho${i}`, s[i].offer_id);
    const dem = async () => ({
      homNay: (await c.query(DAU_TRANG, [72])).rows[0].hom_nay,
      quyet: (await c.query(CONG_NGUOI_SQL)).rows[0].quyet,
      cho: (await c.query(CONG_NGUOI_SQL)).rows[0].cho,
    });
    assert.deepEqual(await dem(), { homNay: 3, quyet: 3, cho: 2 }, "thẻ máy (may:, transform:, dung-nguoi) bị đếm là quyết");
    await the("nguoi9", s[9].offer_id, { status: "approved", decidedBy: "usr_nb9_9" });
    assert.deepEqual(await dem(), { homNay: 4, quyet: 4, cho: 2 }, "đối chứng dương: thẻ người quyết");
  });
});

