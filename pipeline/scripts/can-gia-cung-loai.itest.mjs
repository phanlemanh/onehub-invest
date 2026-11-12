// can-gia-cung-loai.itest.mjs — hồ sơ can-gia-tot-cung-loai (CG8): số giảm của Căn giá tốt so với thước cùng phường × loại
// hình (v_ruler_p2), không lùi về thước cả phường (Hỏi-2). Fixture và giao dịch ở can-gia-cung-loai-fixture.mjs (BEGIN…ROLLBACK,
// lược đồ riêng — không chạm dữ liệu dùng chung). Ma trận viết trước; một assert mỗi ô; có ca đột biến đỏ.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { refreshBaitGap } from "../refresh-bait-gap.mjs";
import { THUOC_A, dungFixture, gapCua, withTx } from "./can-gia-cung-loai-fixture.mjs";

const gapTheoMa = async (c, ids) => Object.fromEntries((await c.query(
  `SELECT offer_id, bait_gap_pct FROM sale_offer_records WHERE offer_id = ANY($1)`, [ids])).rows
  .map((r) => [r.offer_id, r.bait_gap_pct === null ? null : Number(r.bait_gap_pct)]));

/** Chạy refreshBaitGap và giữ log của nó. */
async function chayGiuLog(c) {
  const log = [];
  const goc = console.log;
  console.log = (...a) => log.push(a.join(" "));
  try {
    return { kq: await refreshBaitGap(c), log };
  } finally {
    console.log = goc;
  }
}

test("CG8-AC-1 bốn loại cùng phường: mỗi tin so đúng thước phường × loại của nó", async () => {
  await withTx(async (c) => {
    const { ac1 } = await dungFixture(c);
    await chayGiuLog(c);
    const gap = await gapTheoMa(c, Object.values(ac1));
    for (const [type, id] of Object.entries(ac1)) {
      assert.equal(gap[id], gapCua(THUOC_A[type][1]), `CG8-AC-1 ${id} (${type}): bait_gap_pct sai thước`);
    }
  });
});

test("CG8-AC-1 đột biến: câu cũ nối thước cả phường thì đỏ ở mọi ô", async () => {
  await withTx(async (c) => {
    const { ac1 } = await dungFixture(c);
    // Bước 2 của refresh-bait-gap trước CG8, chép nguyên văn — thước cả phường gộp mọi loại hình.
    await c.query(`WITH r AS (SELECT area_id, m FROM v_ruler_p2_area)
      UPDATE sale_offers o SET bait_gap_pct = ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1)
      FROM r WHERE r.area_id = o.area_id AND o.price_tier = 'P1' AND o.kind = 'sale' AND o.price_perm2 > 0`);
    const gap = await gapTheoMa(c, Object.values(ac1));
    const dung = Object.entries(ac1).filter(([type, id]) => gap[id] === gapCua(THUOC_A[type][1])).map(([, id]) => id);
    assert.deepEqual(dung, [], `CG8-AC-1 đột biến vẫn khớp ở: ${dung.join(", ")}`);
  });
});

test("CG8-AC-2 bảy ô không chấm, log đếm hai lý do; đối chứng dương có số", async () => {
  await withTx(async (c) => {
    const { ac1, ac2 } = await dungFixture(c);
    const { kq, log } = await chayGiuLog(c);
    const gap = await gapTheoMa(c, [...Object.values(ac2), ac1.apartment]);
    for (const [o, id] of Object.entries(ac2)) assert.equal(gap[id], null, `CG8-AC-2 ô ${o} (${id}) có số giảm`);
    assert.equal(gap[ac1.apartment], gapCua(THUOC_A.apartment[1]), "CG8-AC-2 đối chứng dương: căn hộ có thước mà không có số");
    const dong = log.find((l) => l.startsWith("không chấm:"));
    assert.equal(dong, "không chấm: chua-ro-loai=2 thieu-thuoc-cung-loai=4", `CG8-AC-2 log: ${dong}`);
    assert.deepEqual(kq.khongCham, { chua_ro_loai: 2, thieu_thuoc_cung_loai: 4 });
  });
});
