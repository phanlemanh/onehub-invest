// dia-chi-the-nhom.itest.mjs — hồ sơ dong-dau-dia-chi-luc-nap (TG2) Task 1: bộ đọc thẻ địa chỉ nhóm.
// Chạy trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_tg2 --chay); mỗi ca trong BEGIN … ROLLBACK.
// Phục vụ E9 (AC-7: DB chưa có bảng thẻ) và nền cho E2 (AC-2: chỉ thẻ đã duyệt sống được đóng dấu).
import { strict as assert } from "node:assert";
import { test, before, after } from "node:test";

import pg from "pg";

import { coBangThe, docTheDaDuyet } from "../lib/dia-chi-the-nhom.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("dia-chi-the-nhom.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c?.end(); });
const trongGiaoDich = async (fn) => { await c.query("BEGIN"); try { await fn(); } finally { await c.query("ROLLBACK"); } };
const mot = async (sql, p = []) => (await c.query(sql, p)).rows[0];

/** Một nút / một phường có thật trong DB của lượt, làm giá trị hợp lệ cho thẻ. */
const coDinh = async () => ({
  duAn: (await mot(`SELECT id FROM asset_nodes WHERE node_type = 'project' ORDER BY id LIMIT 1`)).id,
  duAn2: (await mot(`SELECT id FROM asset_nodes WHERE node_type = 'project' ORDER BY id OFFSET 1 LIMIT 1`)).id,
  phanKhu: (await mot(`SELECT id FROM asset_nodes WHERE node_type IN ('subzone', 'building') ORDER BY id LIMIT 1`)).id,
  phuong: (await mot(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1`)).id,
});

/** Chèn một thẻ; thẻ nghỉ phải là nháp (109: retired_at IS NULL OR status = 'nhap'). */
async function the({ khoa, status = "da_duyet", duAn = [], phuong = null, phanKhu = null, mucDich = null, nghi = false }) {
  return mot(
    `INSERT INTO group_address_cards (group_key, status, project_node_ids, area_id, subzone_node_id, purpose, retired_at, retired_reason)
     VALUES ($1, $2, $3::bigint[], $4, $5, $6, CASE WHEN $7 THEN now() END, CASE WHEN $7 THEN 'nhom-roi-tap-nhap' END)
     RETURNING card_code, version`,
    [khoa, status, duAn, phuong, phanKhu, mucDich, nghi]);
}

test("TG2-T1 AC-7 ba ca lược đồ: không bảng · có bảng thiếu retired_at · đủ", async () => {
  await trongGiaoDich(async () => {
    assert.equal(await coBangThe(c), true, "DB của lượt đã áp 108 + 109 mà coBangThe nói chưa có");
    await c.query("ALTER TABLE group_address_cards DROP COLUMN retired_at CASCADE");
    assert.equal(await coBangThe(c), false, "bảng thiếu cột retired_at (đã áp 108, chưa áp 109) mà coBangThe nói có");
    await c.query("DROP TABLE group_address_cards CASCADE");
    assert.equal(await coBangThe(c), false, "không có bảng mà coBangThe nói có");
  });
});

test("TG2-T1 AC-2 sáu ô trạng thái thẻ: chỉ hai ô đã duyệt sống được đọc", async () => {
  await trongGiaoDich(async () => {
    const f = await coDinh();
    await the({ khoa: "tg2-nhap", status: "nhap", duAn: [f.duAn] });
    await the({ khoa: "tg2-nhan", status: "da_duyet", duAn: [f.duAn] });
    await the({ khoa: "tg2-sua", status: "da_duyet", duAn: [f.duAn2] });
    await the({ khoa: "tg2-bac", status: "bac", duAn: [f.duAn] });
    await the({ khoa: "tg2-nghi", status: "nhap", duAn: [f.duAn], nghi: true });
    const { the: m } = await docTheDaDuyet(c);
    const khoa = [...m.keys()].filter((k) => k.startsWith("tg2-")).sort();
    assert.deepEqual(khoa, ["tg2-nhan", "tg2-sua"], "ngoài hai thẻ đã duyệt sống còn thẻ khác được đọc");
  });
});

test("TG2-T1 ánh xạ ô bán/thuê: ban → sale · thue → rent_lt · ca_hai → null", async () => {
  await trongGiaoDich(async () => {
    await the({ khoa: "tg2-ban", mucDich: "ban" });
    await the({ khoa: "tg2-thue", mucDich: "thue" });
    await the({ khoa: "tg2-ca-hai", mucDich: "ca_hai" });
    const { the: m } = await docTheDaDuyet(c);
    assert.equal(m.get("tg2-ban").mucDich, "sale");
    assert.equal(m.get("tg2-thue").mucDich, "rent_lt");
    assert.equal(m.get("tg2-ca-hai").mucDich, null);
  });
});

test("TG2-T1 thẻ đủ ô: một dự án, phường, phân khu đọc ra đúng, giá trị bigint giữ dạng chuỗi, không lộ khoá nhóm", async () => {
  await trongGiaoDich(async () => {
    const f = await coDinh();
    const { card_code, version } = await the({ khoa: "tg2-du", duAn: [f.duAn], phuong: f.phuong, phanKhu: f.phanKhu, mucDich: "ban" });
    const { the: m, oBo } = await docTheDaDuyet(c);
    const t = m.get("tg2-du");
    assert.deepEqual(t, { card_code, version, duAn: String(f.duAn), areaId: f.phuong, phanKhu: String(f.phanKhu), mucDich: "sale" });
    assert.equal(typeof t.duAn, "string");
    assert.ok(!("group_key" in t), "giá trị của Map mang khoá nhóm");
    assert.deepEqual(oBo, { duAn: 0, areaId: 0, phanKhu: 0 });
  });
});

test("TG2-T1 thẻ hai dự án: ô dự án về null nhưng KHÔNG tính là ô hỏng", async () => {
  await trongGiaoDich(async () => {
    const f = await coDinh();
    await the({ khoa: "tg2-hai", duAn: [f.duAn, f.duAn2], phuong: f.phuong });
    const { the: m, oBo } = await docTheDaDuyet(c);
    assert.equal(m.get("tg2-hai").duAn, null);
    assert.equal(m.get("tg2-hai").areaId, f.phuong, "thẻ hai dự án vẫn giữ ô phường");
    assert.equal(oBo.duAn, 0, "thẻ hai dự án bị đếm thành ô hỏng");
  });
});

test("TG2-T1 Review Focus 1: ô trỏ nút hay phường không hợp lệ bị lọc và đếm, không ném", async () => {
  // Trigger của 096 NÉM khi phát biểu trỏ sai — một ô hỏng lọt qua là vỡ cả giao dịch transform đêm.
  // Thẻ hỏng chỉ có được khi nút đổi loại hay phường bị gỡ SAU khi thẻ được duyệt; dựng lại bằng cách tắt trigger của 108.
  await trongGiaoDich(async () => {
    const f = await coDinh();
    await c.query("ALTER TABLE group_address_cards DISABLE TRIGGER group_address_cards_kiem_trg");
    await the({ khoa: "tg2-hong", duAn: [f.phanKhu], phuong: "vn-khong-ton-tai", phanKhu: f.duAn });
    const { the: m, oBo } = await docTheDaDuyet(c);
    const t = m.get("tg2-hong");
    assert.equal(t.duAn, null, "nút phân khu lọt vào ô dự án");
    assert.equal(t.areaId, null, "phường không tồn tại lọt qua");
    assert.equal(t.phanKhu, null, "nút dự án lọt vào ô phân khu");
    assert.deepEqual(oBo, { duAn: 1, areaId: 1, phanKhu: 1 });
  });
});
