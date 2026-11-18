// quet-doc-stg.test.mjs — hồ sơ dong-dau-dia-chi-luc-nap (TG2) E8: bộ quét tĩnh đường đọc stg_zalo_posts, cả chiều đỏ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { TEP_CUA_HANG, quet } from "./quet-doc-stg.mjs";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("E8 tệp của hàng hôm nay: 0 câu đọc thẳng stg_zalo_posts", () => {
  for (const t of TEP_CUA_HANG) assert.deepEqual(quet(readFileSync(join(GOC, t), "utf8")), [], t);
});

test("chiều đỏ E8: cấy một câu FROM / JOIN stg_zalo_posts vào bản sao thì bắt đúng dòng", () => {
  const goc = readFileSync(join(GOC, "pipeline/lib/dia-chi-the-nhom.mjs"), "utf8");
  const cay = `${goc}\nconst x = await client.query("SELECT post_id FROM stg_zalo_posts");\nconst y = "LEFT JOIN public.stg_zalo_posts t ON true";\n`;
  const v = quet(cay);
  assert.equal(v.length, 2);
  assert.equal(v[0].dong, goc.split("\n").length + 1);
});

test("chú thích nhắc tên bảng không tính", () => {
  assert.deepEqual(quet("// không đọc FROM stg_zalo_posts ở đây\n * JOIN stg_zalo_posts trong ví dụ"), []);
});
