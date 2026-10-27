// airbnb-nghi.test.mjs — AN-AC-6 (_acceptance/airbnb-nghi-khong-hoi-sinh/evals.yaml E6): đọc tĩnh nhánh cho nghỉ của
// ghiListing. Không cần DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CAU_NGHI_CU, kiemNhanhNghi, nhanhNghi } from "./airbnb-nghi-chung.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");

test("AN-AC-6 nhánh cho nghỉ của ghiListing ghi toạ độ lần thu mới, không chặn bằng retired_at IS NULL", () => {
  const nhanh = nhanhNghi(readFileSync(join(PIPE, "transform-airbnb.mjs"), "utf8"));
  assert.ok(nhanh, "không tìm thấy nhánh `if (!areaId)` của ghiListing");
  assert.deepEqual(kiemNhanhNghi(nhanh), []);
});

test("AN-AC-6 đối chứng: câu cho nghỉ cũ bị bộ kiểm gọi tên cả hai lỗi", () => {
  const cu = `export async function ghiListing(client, { id }) {\n  if (!areaId) {\n    await client.query(\`${CAU_NGHI_CU}\`, [id]);\n    return false;\n  }\n}`;
  const loi = kiemNhanhNghi(nhanhNghi(cu));
  assert.equal(loi.length, 2, `đối chứng: ${loi.join(" · ")}`);
  assert.match(loi[0], /không ghi toạ độ/);
  assert.match(loi[1], /retired_at IS NULL/);
});
