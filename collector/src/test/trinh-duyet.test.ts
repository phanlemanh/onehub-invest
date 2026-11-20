// trinh-duyet.test.ts — 2011-5: lớp chọn trình duyệt chuyên dụng (một chỗ cấu hình).
// Thuần hàm (không mở trình duyệt thật): ứng viên/ngăn profile đọc từ env truyền vào.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { ungVienHienTai, duongThucThi, nganProfile, dungTuyChonMo } from "../core/trinh-duyet.js";

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

// ---- 1911-10/2011-5 MỞ LẠI: hàm thuần dungTuyChonMo — cốt lõi «dùng executablePath
// của ứng viên thay channel chrome». Đột biến bỏ nhánh exec (luôn channel) → ĐỎ.
test("2011-5 MỞ LẠI: dungTuyChonMo cft → có executablePath ĐÚNG ĐƯỜNG, KHÔNG có channel", () => {
  const env = { ONEHUB_BROWSER_CFT: "/tools/cft" };
  const t = dungTuyChonMo("cft", env, {});
  assert.equal(t.executablePath, "/tools/cft", "executablePath đúng đường CFT");
  assert.equal(t.channel, undefined, "KHÔNG được còn channel chrome khi chọn CFT");
  assert.equal(t.headless, false, "mặc định headless=false (Turnstile chặn headless)");
});

test("2011-5 MỞ LẠI: dungTuyChonMo chrome → channel chrome, KHÔNG executablePath", () => {
  const t = dungTuyChonMo("chrome", {});
  assert.equal(t.channel, "chrome");
  assert.equal(t.executablePath, undefined);
  assert.equal(t.locale, "en-US", "locale mặc định");
  assert.equal(t.headless, false);
});

test("1911-10 CA ĐỎ dungTuyChonMo: bỏ nhánh exec (luôn channel chrome) → ĐỎ đúng ca cft", () => {
  const bungNhanh = (uv: string, env: NodeJS.ProcessEnv) => ({ channel: "chrome", headless: false, locale: "en-US" }); // bản phá
  const t = dungTuyChonMo("cft", { ONEHUB_BROWSER_CFT: "/tools/cft" }, {});
  assert.notEqual(t.channel, "chrome", "chọn CFT mà trả channel chrome = bản phá");
  assert.equal(t.executablePath, "/tools/cft");
});
