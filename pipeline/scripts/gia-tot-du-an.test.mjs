// gia-tot-du-an.test.mjs — phép đo CG10 gia-tot-cap-du-an (_acceptance/gia-tot-cap-du-an): hạ tầng, AC-1…AC-5.
// Mỗi ca chạy trên DB thử trắng từ db/migrations của nhánh (gia-tot-du-an-fixture.itest.mjs); số kỳ vọng tính độc lập bằng
// kyVong() — không gọi mã của hàng. Chiều đỏ: thay đúng một chuỗi trong SQL_420 rồi chấm lại trên cùng fixture.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import { dbCa, donHet, dungMau, tin } from "./gia-tot-du-an-fixture.itest.mjs";
import { duAn } from "./gia-tot-du-an-fixture.itest.mjs";

before(dungMau);
after(donHet);

// ---------- hạ tầng ----------
test("CG10-HT-1 view offer_project tạm và bảng 106 có trong DB thử; đối chứng bỏ view, bỏ 106", async () => {
  const c = await dbCa();
  const d = await duAn(c);
  await tin(c, { id: "ht-1", duAn: d, m2: 50, perm2: 50_000_000 });
  const { rows } = await c.query(`SELECT project_node_id, status FROM offer_project WHERE offer_id = 'ht-1'`);
  assert.deepEqual(rows.map((r) => [Number(r.project_node_id), r.status]), [[d, "mot_du_an"]], "CG10-HT-1 view không quy tin về dự án");
  assert.ok((await c.query(`SELECT to_regclass('project_area_band') AS t`)).rows[0].t, "CG10-HT-1 thiếu bảng 106");

  const c2 = await dbCa({ view: false, bo106: true });
  const r2 = (await c2.query(`SELECT to_regclass('offer_project') AS v, to_regclass('project_area_band') AS b`)).rows[0];
  assert.equal(r2.v, null, "CG10-HT-1 đối chứng: bỏ view mà view vẫn có");
  assert.equal(r2.b, null, "CG10-HT-1 đối chứng: bỏ 106 mà bảng vẫn có");
});
