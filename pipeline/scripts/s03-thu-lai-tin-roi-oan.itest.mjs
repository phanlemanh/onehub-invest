// s03-thu-lai-tin-roi-oan.itest.mjs — hồ sơ _acceptance/s03-thu-lai-tin-roi-oan (PL43), AC-4: qua transform-zalo thật, ba bài
// rơi oan thành ba tin đúng loại và giá, câu tìm viết bằng dạng mới không thành tin, tin có từ trước y khoá, chạy lại không đổi;
// luật cũ tiêm qua `luatPl43` thì ba bài không thành tin (chiều đỏ). Chỉ chạy trên DB của riêng lượt
// (`db/db-thu.sh oneinvest_suite_pl43 --chay`), trong BEGIN…ROLLBACK; stg bị xoá TRONG giao dịch. Fixture viết tay, khoá `pl43_…`.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { NHANH, nhanhCuaBai } from "../lib/nhanh-bai-s03.mjs";
import { LUAT_TRUOC_PL43, runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
const SNAP = "hanoi__zalo-agent__2099-05-05T000000";

// [post_id, người đăng, giờ, chữ, loại cần, giá cần]
const OAN = [
  ["pl43_pn2w", "pl43_nguoi_a", "2099-05-05T01:00:00Z", "BE 2PN2w, view cv full nội thất 15tr, ở liền", "rent_lt", "15000000"],
  ["pl43_net", "pl43_nguoi_b", "2099-05-05T02:00:00Z", "Mã căn LD2 Loại căn: STUDIO Diện tích: 26.6m Giá: 1.650 net", "sale", "1650000000"],
  ["pl43_t920", "pl43_nguoi_c", "2099-05-05T03:00:00Z", "Rainbow / 1PN+ 47m2 Giá 1t920 BTP có sổ", "sale", "1920000000"],
];
const TIM = ["pl43_tim", "pl43_nguoi_d", "2099-05-05T04:00:00Z", "Tìm 1 ngủ toà Be cơ bản giá dưới 7 triệu ạ"];
const CU = ["pl43_cu", "pl43_nguoi_e", "2099-05-05T05:00:00Z", "Cho thuê căn 1pn 45m2 full đồ 7tr/tháng"];
const IDS = [...OAN.map((b) => b[0]), TIM[0], CU[0]];

async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

/** Tin S03 (kể cả đã nghỉ) chứa bài fixture — một dòng mỗi tin. */
async function anh(c) {
  const { rows } = await c.query(
    `SELECT offer_id, kind, price_vnd::text, post_ids, n_reposts, retired_at IS NOT NULL AS nghi, retired_reason, retired_at::text
       FROM sale_offer_records WHERE source = 'S03' AND post_ids && $1::text[] ORDER BY offer_id`, [IDS]);
  return rows;
}
const songCua = (ds, id) => ds.filter((o) => o.post_ids.includes(id) && !o.nghi);

test("PL43-AC-4 transform thật: luật cũ bỏ ba bài oan → luật mới ra ba tin đúng loại và giá, câu tìm không thành tin, tin cũ y khoá, chạy lại không đổi",
  { timeout: 900_000 }, async () => {
    assert.match(DB_URL, /\/oneinvest_suite_[a-z0-9_]+$/, "PL43-AC-4 chỉ chạy trên DB của riêng lượt oneinvest_suite_<bộ>");
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT pg_advisory_xact_lock(33033)");
      await napPhatBieu(c);
      await c.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING", [SNAP]);
      await c.query("DELETE FROM stg_zalo_posts");
      for (const [id, nguoi, gio, text] of [...OAN, TIM, CU]) {
        await c.query(
          `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at, sender_id, sender_name)
           VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử PL43', 'pl43-nhom', $3, $4, $5, $5)`, [id, SNAP, text, gio, nguoi]);
      }

      // (1) Luật cũ tiêm qua tham số khai — chiều đỏ: fixture phải tái lập đúng phần rơi oan.
      await imLog(() => runTransformZalo(c, { luatPl43: LUAT_TRUOC_PL43 }));
      const s1 = await anh(c);
      for (const [id, , , text] of OAN) {
        assert.deepEqual(songCua(s1, id), [], `PL43-AC-4 pha luật cũ: bài «${text}» (${id}) đã thành tin — fixture không tái lập lỗi`);
      }
      const [oCu] = songCua(s1, CU[0]);
      assert.ok(oCu && oCu.kind === "rent_lt", "PL43-AC-4 pha luật cũ: tin có từ trước không thành tin");

      // (2) Luật mới (mặc định của đường chạy thật).
      await imLog(() => runTransformZalo(c));
      const s2 = await anh(c);
      for (const [id, , , text, kind, gia] of OAN) {
        const [o] = songCua(s2, id);
        assert.ok(o, `PL43-AC-4 luật mới: bài «${text}» (${id}) không thành tin`);
        assert.equal(o.kind, kind, `PL43-AC-4 luật mới: bài ${id} sai loại`);
        assert.equal(o.price_vnd, gia, `PL43-AC-4 luật mới: bài ${id} sai giá`);
      }
      assert.deepEqual(songCua(s2, TIM[0]), [], `PL43-AC-4 luật mới: câu tìm «${TIM[3]}» thành tin`);
      assert.equal(nhanhCuaBai({ post_id: TIM[0], text: TIM[3] }, new Set()), NHANH.yeuCau, "PL43-AC-4: câu tìm không rơi vào nhánh yeu-cau");
      assert.deepEqual(s2.find((o) => o.offer_id === oCu.offer_id), oCu, "PL43-AC-4 luật mới: tin có từ trước đổi");

      // Chạy lại luật mới: không đổi gì.
      await imLog(() => runTransformZalo(c));
      assert.deepEqual(await anh(c), s2, "PL43-AC-4 luật mới chạy lần hai đổi bảng tin");
    } finally {
      await c.query("ROLLBACK").catch(() => {});
      await c.end();
    }
  });
