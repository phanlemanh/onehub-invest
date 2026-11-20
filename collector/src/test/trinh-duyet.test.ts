// trinh-duyet.test.ts — 2011-5: lớp chọn trình duyệt chuyên dụng (một chỗ cấu hình).
// Thuần hàm (không mở trình duyệt thật): ứng viên/ngăn profile đọc từ env truyền vào.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { ungVienHienTai, duongThucThi, nganProfile } from "../core/trinh-duyet.js";

test("2011-5: mặc định ứng viên chrome, executablePath undefined (channel chrome)", () => {
  const env = {};
  assert.equal(ungVienHienTai(env), "chrome");
  assert.equal(duongThucThi(ungVienHienTai(env), env), undefined);
});

test("2011-5: chọn cft/beta → trả đúng đường ONEHUB_BROWSER_*", () => {
  const env = { ONEHUB_TRINH_DUYET: "cft", ONEHUB_BROWSER_CFT: "/tools/cft" };
  assert.equal(ungVienHienTai(env), "cft");
  assert.equal(duongThucThi("cft", env), "/tools/cft");
  const env2 = { ONEHUB_TRINH_DUYET: "beta", ONEHUB_BROWSER_BETA: "/tools/beta" };
  assert.equal(duongThucThi("beta", env2), "/tools/beta");
});

test("2011-5 CA ĐỎ: chọn cft mà thiếu đường → NÉM rõ ràng (không lặng lẽ về chrome)", () => {
  assert.throws(() => duongThucThi("cft", {}), /thiếu ONEHUB_BROWSER_CFT/);
  assert.throws(() => ungVienHienTai({ ONEHUB_TRINH_DUYET: "safari" }), /ONEHUB_TRINH_DUYET sai/);
});

test("2011-5: ngăn profile = <gốc>/<mã-nguồn> ngoài kho; mã có dấu / bị từ chối", () => {
  const goc = nganProfile("s02", { ONEHUB_PROFILE_GOC: "/tmp/td-goc" } as NodeJS.ProcessEnv);
  assert.ok(goc === "/tmp/td-goc/s02", `ngăn phải /tmp/td-goc/s02 — thực tế ${goc}`);
  assert.throws(() => nganProfile("a/b", { ONEHUB_PROFILE_GOC: "/tmp/td-goc" } as NodeJS.ProcessEnv), /không hợp lệ/);
});
