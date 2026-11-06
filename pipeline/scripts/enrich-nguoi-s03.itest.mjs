// enrich-nguoi-s03.itest.mjs — hồ sơ _acceptance/enrich-nguoi-s03 (E1–E6): sổ liên lạc của Người S03, chọn số, gán số qua người đăng.
// Ca DB chạy trên DB THỬ (bash db/db-thu.sh oneinvest_en), trong BEGIN…ROLLBACK, với transform S03 thật trên
// dữ liệu chép từ máy thu cộng bài fixture của người gửi bịa. Mọi SĐT fixture là số bịa 03990001xx. Mỗi phép đo có chiều đỏ
// trên cùng fixture, ghim thông điệp.
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { ganSdtQuaNguoi } from "../gan-sdt-qua-nguoi.mjs";
import { capMotMot, dungNguoi, RULE_QUA_NGUOI, sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { docSoNguoi, dungLienLac, SQL_LL } from "../lib/lien-lac-nguoi.mjs";
import { MIG_070 } from "../lib/nap-070.mjs";
import { MIG_079 } from "../lib/nap-079.mjs";
import { SQL_TIN_SD5 } from "../do-danh-ba-sdt.mjs";
import { buocDem } from "../refresh-bait-gap.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const PIPE = join(import.meta.dirname, "..");
const DB_URL = process.env.DATABASE_URL ?? "";
const SNAP = "hanoi__s03-thu__2099-11-06T000000";
const yen = { out: () => {} };
const so = (n) => `+84399000${String(n).padStart(3, "0")}`; // E.164 của 0399000nnn
const chu = (n) => `0399000${String(n).padStart(3, "0")}`;

// ---------- Ca DB (DB thử) ----------

async function withTx(fn) {
  assert.match(DB_URL, /\/oneinvest_[a-z0-9_]+$/, "cần DATABASE_URL trỏ DB thử oneinvest_<việc> (bash db/db-thu.sh oneinvest_en)");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 's03-thu', '{}')
                   ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    if (!(await c.query("SELECT to_regclass('party_contacts') IS NOT NULL AS co")).rows[0].co) await c.query(MIG_079);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const P = process.pid % 100000;
const ai = (x) => `9${P}${x}`; // người gửi bịa, toàn số như sender_id S03
let seq = 0;
async function post(c, sender, text, posted_at = "2026-11-05T02:00:00Z") {
  const id = `en_${P}_${++seq}`;
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, author_hash, text, posted_at, sender_id, sender_name)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử EN', 'agent-en', $3, $4, $5, 'Người thử')`, [id, SNAP, text, posted_at, sender]);
  return id;
}

/** Gieo người gửi fixture. Trả mã bài để tìm tin. */
async function gieo(c) {
  const p = {};
  p.a1 = await post(c, ai(1), `Cho thuê căn hộ 1PN 41.3m2, giá 7.31 triệu/tháng, lh ${chu(101)}`);
  p.a2 = await post(c, ai(1), "Cho thuê căn hộ 2PN 63.7m2 full đồ, giá 11.7 triệu/tháng");
  p.b1 = await post(c, ai(2), "Cho thuê studio 31.3m2, giá 5.13 triệu/tháng");
  p.b2 = await post(c, ai(2), `ib ${chu(102)}`);
  p.c1 = await post(c, ai(3), "Cho thuê căn hộ 2PN 58.3m2, giá 9.47 triệu/tháng");
  p.c2 = await post(c, ai(3), chu(103));
  p.d1 = await post(c, ai(4), `lh ${chu(103)}`);
  p.h1 = await post(c, ai(8), `Bán căn hộ 2PN 67.1m2, giá 3.73 tỷ, lh ${chu(108)}`);
  p.h2 = await post(c, ai(8), `Bán căn hộ 3PN 88.1m2, giá 5.17 tỷ, lh ${chu(118)}`);
  p.h3 = await post(c, ai(8), "Bán căn hộ 1PN 45.1m2, giá 2.19 tỷ");
  return p;
}
const tinCuaBai = async (c, postId) => {
  const { rows } = await c.query(`SELECT offer_id, seller_phone, seller_phone_hash, field_provenance -> 'seller_phone' AS fp, retired_at
                                   FROM sale_offer_records WHERE source = 'S03' AND $1 = ANY(post_ids)`, [postId]);
  assert.equal(rows.length, 1, `bài ${postId} không thành đúng một tin`);
  return rows[0];
};
const nguoiCua = async (c, sender) => (await c.query(
  `SELECT object_key FROM registry_aliases WHERE source = 'S03' AND kind = 'tai_khoan_nguon' AND value = $1 AND retired_at IS NULL`,
  [sender])).rows[0]?.object_key;
const lienLacCua = async (c, sender) => (await c.query(
  `SELECT value, rule_id FROM party_contacts WHERE party_key = $1 AND retracted_at IS NULL ORDER BY value, rule_id`,
  [await nguoiCua(c, sender)])).rows.map((r) => [r.value, r.rule_id]);
const dem = async (c) => (await c.query(`SELECT
  (SELECT count(*) FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL)::int AS sdt,
  (SELECT count(*) FROM parties)::int AS nguoi,
  (SELECT count(*) FROM party_contacts)::int AS lien_lac`)).rows[0];
const md5So = async (c, nguon) => (await c.query(
  `SELECT md5(coalesce(string_agg(offer_id || '|' || coalesce(seller_phone, '') || '|' || coalesce(field_provenance ->> 'seller_phone', ''),
                                  ',' ORDER BY offer_id), '')) AS m FROM sale_offer_records WHERE source = $1`, [nguon])).rows[0].m;

/** Nền chung: gieo, transform S03 thật, bước đêm (Người → liên lạc → gán). */
async function nen(c) {
  const p = await gieo(c);
  await runTransformZalo(c);
  await buocDem(c, { savepoint: true });
  return p;
}

test("EN-AC-1/AC-2 DB: liên lạc của người gửi fixture qua transform + bước đêm thật; lượt 2 bằng 0; số chung rút; bài vắng giữ",
  { timeout: 600_000 }, async () => {
    await withTx(async (c) => {
      for (const n of [101, 102, 103, 108, 118]) {
        const { rows } = await c.query(`SELECT count(*)::int AS n FROM stg_zalo_posts WHERE text LIKE '%' || $1 || '%'`, [chu(n)]);
        assert.equal(rows[0].n, 0, `số bịa ${n} đã có trong dữ liệu thật — đổi số fixture`);
      }
      const p = await nen(c);
      assert.deepEqual(await lienLacCua(c, ai(1)), [[so(101), "so_tren_tin"]], "EN-AC-1 ô so-tren-tin (DB)");
      assert.deepEqual(await lienLacCua(c, ai(2)), [[so(102), "so_trong_bai"]], "EN-AC-1 ô so-trong-bai (DB)");
      assert.deepEqual(await lienLacCua(c, ai(3)), [], "EN-AC-1 ô so-chung-hai-nguoi (DB)");
      // AC-2 lượt 2: cùng dữ liệu → 0 mới, 0 rút
      const l2 = await dungLienLac(c, yen);
      assert.equal(l2.lien_lac_moi, 0, "EN-AC-2 lượt 2: lien_lac_moi");
      assert.equal(l2.lien_lac_rut, 0, "EN-AC-2 lượt 2: lien_lac_rut");
      // bài bằng chứng của B vắng khỏi stg → liên lạc giữ
      await c.query(`DELETE FROM stg_zalo_posts WHERE post_id = $1`, [p.b2]);
      await dungLienLac(c, yen);
      assert.deepEqual(await lienLacCua(c, ai(2)), [[so(102), "so_trong_bai"]], "EN-AC-2: bài vắng thì liên lạc giữ");
      // số của A xuất hiện ở người gửi thứ hai → rút đúng một dòng, lý do so-chung
      await post(c, ai(5), `lh ${chu(101)}`);
      const l3 = await dungLienLac(c, yen);
      assert.equal(l3.lien_lac_rut, 1, "EN-AC-2: số trở thành chung rút đúng một dòng");
      const { rows } = await c.query(`SELECT retract_reason FROM party_contacts WHERE value = $1`, [so(101)]);
      assert.deepEqual(rows.map((r) => r.retract_reason), ["so-chung"]);
    });
  });

test("EN-AC-2 bảng: CHECK nhận/từ chối, chỉ thêm, rút có lý do", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    await nen(c);
    const pk = await nguoiCua(c, ai(1));
    const thu = async (sql, args, mau) => {
      await c.query("SAVEPOINT s");
      try {
        await c.query(sql, args);
        await c.query("RELEASE SAVEPOINT s");
        return "ok";
      } catch (e) {
        await c.query("ROLLBACK TO SAVEPOINT s");
        if (mau) assert.match(e.message, mau);
        return "loi";
      }
    };
    const them = `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, run_id) VALUES ($1, $2, $3, 'observed', 'parser', 'so_trong_bai', 't')`;
    assert.equal(await thu(them, [pk, "sdt", so(150)]), "ok", "sdt E.164 nhận");
    assert.equal(await thu(them, [pk, "chat_profile", "https://chat.example/thu"]), "ok", "chat_profile nhận");
    assert.equal(await thu(them, [pk, "sdt", "0399000150"], /party_contacts_value_chk/), "loi", "sdt dạng 0 bị từ chối");
    assert.equal(await thu(them, [pk, "chat_profile", " "], /party_contacts_value_chk/), "loi", "chat_profile rỗng bị từ chối");
    assert.equal(await thu(`DELETE FROM party_contacts WHERE party_key = $1`, [pk], /party_contacts: chỉ thêm/), "loi");
    assert.equal(await thu(`TRUNCATE party_contacts`, [], /party_contacts: chỉ thêm/), "loi");
    assert.equal(await thu(`UPDATE party_contacts SET value = $2 WHERE party_key = $1`, [pk, so(151)], /party_contacts: chỉ thêm/), "loi");
    assert.equal(await thu(`UPDATE party_contacts SET retracted_at = now() WHERE party_key = $1`, [pk], /party_contacts/), "loi",
      "rút không lý do bị chặn");
    assert.equal(await thu(`UPDATE party_contacts SET retracted_at = now(), retract_reason = 'thu' WHERE party_key = $1`, [pk]), "ok");
  });
});

test("EN-AC-4: gán qua người đăng trên transform thật; S05/S06 không đổi; chạy lại 0; transform lại không làm tin rơi về NULL",
  { timeout: 600_000 }, async () => {
    await withTx(async (c) => {
      // cột số và dấu số: bước đêm cập nhật bait gap của mọi nguồn, việc đó không thuộc vòng này
      const m05 = await md5So(c, "S05");
      const m06 = await md5So(c, "S06");
      const p = await nen(c);
      const pkA = await nguoiCua(c, ai(1));
      const kiem = async (nhan) => {
        const rieng = await tinCuaBai(c, p.a1);
        assert.equal(rieng.seller_phone, so(101), `EN-AC-4 ô rieng (${nhan})`);
        assert.equal(rieng.fp?.rule_id, undefined, `EN-AC-4 ô rieng không mang dấu (${nhan})`);
        const nhanSo = await tinCuaBai(c, p.a2);
        assert.equal(nhanSo.seller_phone, so(101), `EN-AC-4 ô nhan-so: seller_phone (${nhan})`);
        assert.equal(nhanSo.seller_phone_hash, createHash("sha256").update(so(101)).digest("hex").slice(0, 32), `EN-AC-4 ô nhan-so băm`);
        assert.equal(nhanSo.fp?.rule_id, RULE_QUA_NGUOI, `EN-AC-4 ô nhan-so dấu (${nhan})`);
        assert.equal(nhanSo.fp?.party_key, pkA, `EN-AC-4 ô nhan-so party_key (${nhan})`);
        assert.equal((await tinCuaBai(c, p.b1)).seller_phone, so(102), `EN-AC-4 ô nhan-so từ bài (${nhan})`);
        assert.equal((await tinCuaBai(c, p.h3)).seller_phone, null, `EN-AC-4 ô khong-chon (${nhan})`);
        assert.equal((await tinCuaBai(c, p.c1)).seller_phone, null, `EN-AC-4 ô so-chung (${nhan})`);
      };
      await kiem("sau bước đêm");
      assert.equal((await ganSdtQuaNguoi(c, yen)).doi, 0, "EN-AC-4: lượt gán 2 đổi 0 dòng");
      // tin nghỉ cũng nhận số
      await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = $1`, [(await tinCuaBai(c, p.a2)).offer_id]);
      await runTransformZalo(c); // transform lại: writeOffers upsert về số riêng, bộ gán trong cùng giao dịch giữ số
      await kiem("sau transform lại");
      // tin đang mang số suy nay có số riêng → giữ số riêng, bỏ dấu; người hết số → rút về NULL
      const a2 = (await tinCuaBai(c, p.a2)).offer_id;
      await ganSdtQuaNguoi(c, { rieng: new Map([[a2, so(160)]]), ...yen });
      const suyNayRieng = await tinCuaBai(c, p.a2);
      assert.equal(suyNayRieng.seller_phone, so(160), "EN-AC-4 ô suy-nay-rieng: cột mang số riêng transform vừa ghi");
      assert.equal(suyNayRieng.fp, null, "EN-AC-4 ô suy-nay-rieng: bỏ dấu");
      await c.query(`UPDATE party_contacts SET retracted_at = now(), retract_reason = 'thu' WHERE party_key = $1`, [await nguoiCua(c, ai(2))]);
      await ganSdtQuaNguoi(c, yen);
      const hetSo = await tinCuaBai(c, p.b1);
      assert.deepEqual([hetSo.seller_phone, hetSo.fp], [null, null], "EN-AC-4 ô suy-het-so: rút về NULL, bỏ dấu");
      assert.equal(await md5So(c, "S05"), m05, "EN-AC-4: số tin S05 đổi");
      assert.equal(await md5So(c, "S06"), m06, "EN-AC-4: số tin S06 đổi");
    });
  });

test("EN-AC-4 chiều đỏ: transform không gọi bộ gán thì ô nhan-so rơi về NULL", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    const p = await nen(c);
    await runTransformZalo(c, { ganSo: async () => {} });
    assert.equal((await tinCuaBai(c, p.a2)).seller_phone, null, "đối chứng phải đỏ: không gọi bộ gán mà ô nhan-so vẫn có số");
  });
});

/** Ma trận nhãn của view 079: 6 ô viết trước. */
const O_AC5 = [
  { o: "s03-suy", source: "S03", so: so(171), fp: { rule_id: RULE_QUA_NGUOI }, mong: true },
  { o: "s03-truc-tiep", source: "S03", so: so(172), fp: null, mong: false },
  { o: "s06-truc-tiep", source: "S06", so: so(173), fp: { rule_id: "s06-so-tren-tin" }, mong: false },
  { o: "s06-ghep", source: "S06", so: so(174), fp: { rule_id: "s06-cung-tai-khoan" }, mong: true },
  { o: "s06-mat-dau", source: "S06", so: so(175), fp: null, mong: true },
  { o: "khong-so", source: "S03", so: null, fp: null, mong: false },
];
async function gieoAC5(c) {
  for (const x of O_AC5) {
    await c.query(
      `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, originating_system_key, seller_phone, field_provenance)
       VALUES ($1, 'sale', now(), now(), $2, $1, $3, $4)`,
      [`offer_en_${P}_${x.o}`, x.source, x.so, JSON.stringify(x.fp ? { seller_phone: x.fp } : {})]);
  }
}
async function kiemAC5(c) {
  assert.equal(O_AC5.length, 6);
  for (const x of O_AC5) {
    const { rows } = await c.query(`SELECT seller_phone_inferred AS n FROM sale_offers WHERE offer_id = $1`, [`offer_en_${P}_${x.o}`]);
    assert.equal(rows[0].n, x.mong, `EN-AC-5 ô ${x.o}`);
  }
}
const cotView = async (c) => (await c.query(`SELECT attname FROM pg_attribute WHERE attrelid = 'sale_offers'::regclass AND attnum > 0 ORDER BY attnum`)).rows.map((r) => r.attname);
const SQL_450 = (() => {
  const s = readFileSync(join(PIPE, "sql/450_dq_checks.sql"), "utf8");
  const m = s.match(/INSERT INTO dq_check_results \(check_name, entity, status, detail\)\s+SELECT 'so-chua-xac-minh'[\s\S]*?\) d;/);
  assert.ok(m, "không tìm thấy khối so-chua-xac-minh trong 450");
  return m[0].replace(/^INSERT INTO dq_check_results \(check_name, entity, status, detail\)\s+/, "");
})();

test("EN-AC-5: view 079, rào chưa áp, kiểm DQ so-chua-xac-minh", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    await gieoAC5(c);
    await kiemAC5(c);
    // cột cũ giữ tên, thứ tự; chiều đỏ: view về bản 070 thì ô s03-suy đỏ
    const cot079 = await cotView(c);
    await c.query("SAVEPOINT v070");
    await c.query(MIG_070.match(/CREATE OR REPLACE VIEW sale_offers AS[\s\S]*?;/)[0]);
    assert.deepEqual(await cotView(c), cot079, "EN-AC-5: cột view 079 khác 070");
    await assert.rejects(kiemAC5(c), /ô s03-suy/, "đối chứng: view 070 phải làm ô s03-suy đỏ");
    // view bị ghi đè về 070: bộ gán không ghi số suy mới, in CHUA-AP-079
    const log = [];
    const kq = await ganSdtQuaNguoi(c, { out: (s) => log.push(s) });
    assert.equal(kq.bo_qua, "CHUA-AP-079");
    assert.equal(kq.gan, 0, "EN-AC-5: view 070 thì không gán số suy mới");
    assert.ok(log.some((s) => s.includes("CHUA-AP-079")));
    await c.query("ROLLBACK TO SAVEPOINT v070");
    // kiểm DQ: pass khi chỉ S03 có dấu mang nhãn; fail khi tin S05 mang dấu S03
    const { rows: [d1] } = await c.query(SQL_450);
    assert.equal(d1.status, "pass", `EN-AC-5 DQ pass: ${d1.detail}`);
    await c.query(`UPDATE sale_offer_records SET source = 'S05' WHERE offer_id = $1`, [`offer_en_${P}_s03-suy`]);
    const { rows: [d2] } = await c.query(SQL_450);
    assert.equal(d2.status, "fail", "EN-AC-5 DQ: tin S05 mang dấu số qua người đăng phải fail");
  });
});

test("EN-AC-5: DB chưa áp 079 — transform S03 và bước đêm chạy như hôm nay", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    await c.query("DROP TABLE party_contacts");
    await c.query(MIG_070.match(/CREATE OR REPLACE VIEW sale_offers AS[\s\S]*?;/)[0]);
    // chiều đỏ: không có rào thì đọc bảng gãy với lỗi relation
    await c.query("SAVEPOINT khong_rao");
    await assert.rejects(c.query(SQL_LL.song, ["S03"]), /relation "party_contacts" does not exist/);
    await c.query("ROLLBACK TO SAVEPOINT khong_rao");
    const log = [];
    const goc = console.log;
    console.log = (...a) => log.push(a.join(" "));
    let dem2;
    try {
      await runTransformZalo(c);
      dem2 = await buocDem(c, { savepoint: true });
    } finally {
      console.log = goc;
    }
    assert.ok(log.some((s) => s.includes("CHUA-AP-079")), "EN-AC-5 ô chua-ap-079: log CHUA-AP-079");
    assert.ok(dem2.nguoi, "EN-AC-5 ô chua-ap-079: dungNguoi vẫn chạy");
    assert.equal(dem2.lienLac.bo_qua, "CHUA-AP-079");
    const { rows: [suy] } = await c.query(`SELECT count(*)::int AS n FROM sale_offer_records
       WHERE source = 'S03' AND field_provenance -> 'seller_phone' ->> 'rule_id' = $1`, [RULE_QUA_NGUOI]);
    assert.equal(suy.n, 0, "EN-AC-5 ô chua-ap-079: chưa áp 079 mà tin S03 nhận số qua người đăng");
    assert.equal(dem2.ganSo.bo_qua, "CHUA-AP-079");
  });
});

test("EN-AC-6: số suy không quay lại làm bằng chứng; chiều đỏ khi bỏ dấu", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    const p = await nen(c);
    const tinS03 = async () => (await c.query(`SELECT * FROM sale_offer_records WHERE source = 'S03'`)).rows;
    const baiMap = async () => new Map((await c.query(
      `SELECT DISTINCT ON (post_id) post_id, sender_id FROM stg_zalo_posts WHERE agent_id = 'openclaw-hook' ORDER BY post_id, captured_at DESC`))
      .rows.map((b) => [b.post_id, { source: "S03", sender_id: b.sender_id }]));
    const cap = async () => JSON.stringify(capMotMot(await tinS03(), await baiMap()).cap);
    const truoc = { dem: await dem(c), cap: await cap(), thieu: JSON.stringify(await sellersThieuNguoi(c)) };
    const kq = await dungNguoi(c, yen);
    const ll = await dungLienLac(c, yen);
    assert.equal(kq.bi_danh_moi, 0, "EN-AC-6: bí danh mới từ số suy");
    assert.equal(kq.nguoi_moi, 0, "EN-AC-6: Người mới từ số suy");
    assert.equal(ll.lien_lac_moi, 0, "EN-AC-6: liên lạc mới từ số suy");
    assert.deepEqual(await dem(c), truoc.dem);
    assert.equal(await cap(), truoc.cap, "EN-AC-6: capMotMot đổi");
    assert.equal(JSON.stringify(await sellersThieuNguoi(c)), truoc.thieu, "EN-AC-6: sellersThieuNguoi đổi");
    const { rows: sd5 } = await c.query(SQL_TIN_SD5, [["S03"]]);
    assert.ok(!sd5.some((r) => r.seller_phone === so(101) && r.post_ids.includes(p.a2)), "EN-AC-6: SD5 đọc số suy của ô nhan-so");
    // chiều đỏ cùng fixture: bỏ dấu (giữ số) thì danh bạ sinh bí danh mới cho số suy
    await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance - 'seller_phone'
                    WHERE source = 'S03' AND field_provenance -> 'seller_phone' ->> 'rule_id' = $1`, [RULE_QUA_NGUOI]);
    const kqDo = await dungNguoi(c, yen);
    assert.ok(kqDo.bi_danh_moi > 0, "đối chứng phải đỏ: bỏ dấu mà danh bạ không sinh bí danh nào cho ô nhan-so");
  });
});

test("EN-AC-3 DB: Người đã gộp đọc liên lạc ở người cuối chuỗi", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    await nen(c);
    const ka = await nguoiCua(c, ai(1));
    const kb = await nguoiCua(c, ai(2));
    await c.query(`UPDATE parties SET status = 'merged', merged_into = $2 WHERE party_key = $1`, [kb, ka]);
    const m = await docSoNguoi(c);
    assert.equal(m.get(ka)?.value, so(101), "EN-AC-3 ô da-gop: người cuối giữ số trên tin, số trong bài của người bị gộp xếp sau");
    assert.equal(m.has(kb), false, "EN-AC-3 ô da-gop: người bị gộp không có số riêng");
  });
});
