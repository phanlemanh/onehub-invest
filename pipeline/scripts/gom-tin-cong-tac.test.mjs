// GT5 khoa-gom-hai-tang AC-1: công tắc ops_audit `gom-tin:hai-tang`, mặc định tắt.
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { CONG_TAC_GOM, congTacGom } from "../lib/gom-tin.mjs";

/** Client giả: trả bảng ops_audit có/không và các dòng công tắc; ghi lại câu SQL đã gọi. */
function clientGia({ coBang = true, dong = [] } = {}) {
  const sql = [];
  return {
    sql,
    async query(q, p) {
      sql.push(q);
      if (/to_regclass/.test(q)) return { rows: [{ co: coBang }] };
      if (/FROM ops_audit/.test(q)) {
        assert.ok(q.includes(`'${CONG_TAC_GOM}'`), "câu đọc công tắc lọc đúng action");
        const giam = /ORDER BY id DESC/.test(q);
        const sap = [...dong].sort((a, b) => (giam ? 1 : -1) * (Number(b.id) - Number(a.id)));
        return { rows: /LIMIT 1/.test(q) ? sap.slice(0, 1) : sap };
      }
      throw new Error(`SQL lạ: ${q}`);
    },
  };
}

test("GT5-AC-1 tên công tắc đúng khuôn danh-ba:gop-sdt", () => assert.equal(CONG_TAC_GOM, "gom-tin:hai-tang"));
test("GT5-AC-1 không có bảng ops_audit → tắt, không đọc công tắc", async () => {
  const c = clientGia({ coBang: false });
  assert.equal(await congTacGom(c), "tat");
  assert.equal(c.sql.filter((q) => /FROM ops_audit/.test(q)).length, 0);
});
test("GT5-AC-1 không dòng công tắc → tắt", async () => assert.equal(await congTacGom(clientGia()), "tat"));
test("GT5-AC-1 dòng mới nhất bat=true → bật", async () =>
  assert.equal(await congTacGom(clientGia({ dong: [{ id: 3, detail: { bat: false } }, { id: 7, detail: { bat: true } }] })), "bat"));
test("GT5-AC-1 dòng mới nhất bat=false sau dòng bật → tắt (không đọc dòng cũ nhất)", async () =>
  assert.equal(await congTacGom(clientGia({ dong: [{ id: 3, detail: { bat: true } }, { id: 9, detail: { bat: false } }] })), "tat"));
test("GT5-AC-1 bat là chuỗi \"true\" → tắt", async () =>
  assert.equal(await congTacGom(clientGia({ dong: [{ id: 1, detail: { bat: "true" } }] })), "tat"));
