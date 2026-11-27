// yeu-cau-khong-thanh-tin-thue.itest.mjs — hồ sơ _acceptance/yeu-cau-khong-thanh-tin-thue (PL42), AC-4: qua transform-zalo thật,
// bài tìm viết tắt thôi thành tin, tin đã lọt nghỉ giữ khoá (PL14), tin gom mất bài tìm khỏi post_ids, chạy lại không đổi, và
// lùi được (luật cũ → tin sống lại cùng khoá). Chỉ chạy trên DB của riêng lượt (`db/db-thu.sh oneinvest_suite_pl42 --chay`),
// trong BEGIN…ROLLBACK; bài thật của stg bị xoá TRONG giao dịch để lượt chỉ đọc fixture. Fixture viết tay, khoá `pl42_…`.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { NHANH, nhanhCuaBai } from "../lib/nhanh-bai-s03.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
const SNAP = "hanoi__zalo-agent__2099-04-04T000000";

/** Biểu thức YEU_CAU trước PL42, ghim nguyên văn (transform-zalo.mjs ở origin/main 6286dd29a) — tiêm cho pha «luật cũ». */
const YEU_CAU_CU = /(?:cần\s+(?:mua|thuê|tìm)|tìm\s+(?:mua|thuê|căn|nhà|phòng)|kh[aá]c?h\b[^.!?\n]{0,30}?\b(?:xem|tìm|cần)\b|(?:anh|a)\s*(?:\/\s*)?(?:chị|c)\s+(?:nào\s+)?có\s+căn|ai\s+có\s+căn|có\s+căn\s+gửi)/iu;

// [post_id, người đăng, giờ, chữ]. Tin gom: cùng người đăng, cùng giá + PN, không phường/DT → cùng khoá gom (repostKey) khi bài
// tìm còn bị đọc thành thuê.
const BAI = {
  rao: ["pl42_rao", "pl42_nguoi_a", "2099-04-04T01:00:00Z", "Cho thuê căn 1pn 45m2 full đồ 7tr/tháng"],
  tim: ["pl42_tim", "pl42_nguoi_b", "2099-04-04T02:00:00Z", "Tìm 2pn full 8tr"],
  gomRao: ["pl42_gom_rao", "pl42_nguoi_c", "2099-04-04T03:00:00Z", "Cho thuê 2pn full đồ 8tr"],
  gomTim: ["pl42_gom_tim", "pl42_nguoi_c", "2099-04-04T04:00:00Z", "Tìm 2pn full 8tr"],
};
const ID = Object.fromEntries(Object.entries(BAI).map(([k, [id]]) => [k, id]));

async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

/** Tin S03 (kể cả đã nghỉ) chứa bài fixture — một dòng mỗi tin. */
async function anh(c) {
  const { rows } = await c.query(
    `SELECT offer_id, kind, price_vnd::text, post_ids, n_reposts, retired_at IS NOT NULL AS nghi, retired_reason, retired_at::text
       FROM sale_offer_records WHERE source = 'S03' AND post_ids && $1::text[] ORDER BY offer_id`, [Object.values(ID)]);
  return rows;
}
const tinCua = (ds, id, nghi = false) => ds.filter((o) => o.post_ids.includes(id) && o.nghi === nghi);

test("PL42-AC-4 transform thật: luật cũ ra tin rò → luật mới cho nghỉ giữ khoá, tin gom bỏ bài tìm, chạy lại không đổi → luật cũ sống lại cùng khoá",
  { timeout: 900_000 }, async () => {
    assert.match(DB_URL, /\/oneinvest_suite_[a-z0-9_]+$/, "PL42-AC-4 chỉ chạy trên DB của riêng lượt oneinvest_suite_<bộ>");
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT pg_advisory_xact_lock(33033)");
      await napPhatBieu(c);
      await c.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING", [SNAP]);
      await c.query("DELETE FROM stg_zalo_posts");
      for (const [id, nguoi, gio, text] of Object.values(BAI)) {
        await c.query(
          `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at, sender_id, sender_name)
           VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử PL42', 'pl42-nhom', $3, $4, $5, $5)`, [id, SNAP, text, gio, nguoi]);
      }

      // (1) Luật cũ tiêm qua tham số khai: bài tìm thành tin thuê — chiều đỏ, fixture phải tái lập đúng lỗi.
      await imLog(() => runTransformZalo(c, { luatYeuCau: YEU_CAU_CU }));
      const s1 = await anh(c);
      const [oTim] = tinCua(s1, ID.tim), [oGom] = tinCua(s1, ID.gomTim), [oRao] = tinCua(s1, ID.rao);
      assert.ok(oTim && oTim.kind === "rent_lt", `PL42-AC-4 pha luật cũ: bài «${BAI.tim[3]}» (${ID.tim}) không thành tin rent_lt — fixture không tái lập lỗi`);
      assert.ok(oGom && oGom.kind === "rent_lt", `PL42-AC-4 pha luật cũ: bài «${BAI.gomTim[3]}» (${ID.gomTim}) không thành tin rent_lt`);
      assert.deepEqual([...oGom.post_ids].sort(), [ID.gomRao, ID.gomTim].sort(), "PL42-AC-4 pha luật cũ: bài rao và bài tìm cùng người không gom thành một tin");
      assert.ok(oRao && oRao.kind === "rent_lt", "PL42-AC-4 pha luật cũ: tin rao thật không thành tin");

      // (2) Luật mới (mặc định của đường chạy thật).
      await imLog(() => runTransformZalo(c));
      const s2 = await anh(c);
      const tim2 = s2.find((o) => o.offer_id === oTim.offer_id);
      assert.ok(tim2?.nghi, `PL42-AC-4 luật mới: tin ${oTim.offer_id} của bài tìm không nghỉ`);
      assert.deepEqual(tinCua(s2, ID.tim), [], "PL42-AC-4 luật mới: bài tìm còn trong một tin sống");
      const gom2 = s2.find((o) => o.offer_id === oGom.offer_id);
      assert.ok(gom2 && !gom2.nghi, "PL42-AC-4 luật mới: tin gom không còn sống cùng khoá");
      assert.deepEqual(gom2.post_ids, [ID.gomRao], "PL42-AC-4 luật mới: post_ids của tin gom không chỉ gồm bài rao");
      assert.deepEqual(tinCua(s2, ID.gomTim), [], "PL42-AC-4 luật mới: bài tìm của tin gom còn trong một tin sống");
      assert.deepEqual(s2.find((o) => o.offer_id === oRao.offer_id), oRao, "PL42-AC-4 luật mới: tin rao thật đổi");
      for (const k of ["tim", "gomTim"]) {
        assert.equal(nhanhCuaBai({ post_id: ID[k], text: BAI[k][3] }, new Set()), NHANH.yeuCau, `PL42-AC-4: bài ${ID[k]} không rơi vào nhánh yeu-cau`);
      }
      assert.equal(nhanhCuaBai({ post_id: ID.rao, text: BAI.rao[3] }, new Set()), null, "PL42-AC-4: bài rao thật rơi vào một nhánh");

      // Chạy lại luật mới: không đổi gì (kể cả giờ nghỉ của tin bài tìm).
      await imLog(() => runTransformZalo(c));
      assert.deepEqual(await anh(c), s2, "PL42-AC-4 luật mới chạy lần hai đổi bảng tin");

      // (3) Lùi: luật cũ lại → tin của bài tìm sống lại cùng khoá, tin gom lấy lại bài tìm.
      await imLog(() => runTransformZalo(c, { luatYeuCau: YEU_CAU_CU }));
      const s3 = await anh(c);
      const [tim3] = tinCua(s3, ID.tim);
      assert.equal(tim3?.offer_id, oTim.offer_id, "PL42-AC-4 lùi: tin bài tìm không sống lại cùng khoá");
      const gom3 = s3.find((o) => o.offer_id === oGom.offer_id);
      assert.deepEqual([...gom3.post_ids].sort(), [ID.gomRao, ID.gomTim].sort(), "PL42-AC-4 lùi: tin gom không lấy lại bài tìm");
      assert.deepEqual(s3.map((o) => o.offer_id).sort(), s1.map((o) => o.offer_id).sort(), "PL42-AC-4 lùi: tập khoá tin khác pha luật cũ");
    } finally {
      await c.query("ROLLBACK").catch(() => {});
      await c.end();
    }
  });
