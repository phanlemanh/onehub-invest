// push-ops-facts-import.test.mjs — AC-10 che-ten-nguon-khong-lay-tu-dau: nạp tệp không được gửi bản tin lên cloud.
// Sự cố 19/11: một tác tử chấm import tệp để đọc hàm, tệp tự chạy main() và đẩy bản tin thật lên cloud production.
// Mọi ca dùng máy chủ thu giả của captureOpsFacts trên 127.0.0.1, HOME tạm và token giả; không ca nào dùng INGEST_URL mặc định.
import assert from "node:assert/strict";
import { mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { captureOpsFacts, mutantPush, PUSH } from "./capture-ops-facts.mjs";

const voiTam = async (fn) => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-facts-import-")));
  try { return await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
};

/** Chỉ import tệp `dich`, đếm lời gọi tới máy chủ thu giả. Có lời gọi → ném lỗi ghim. */
const kiemImport = (dich) => voiTam(async (dir) => {
  const boc = path.join(dir, "chi-import.mjs");
  writeFileSync(boc, `await import(${JSON.stringify(pathToFileURL(dich).href)});\n`);
  const r = await captureOpsFacts({ script: boc });
  if (r.posts !== 0) throw new Error(`AC-10 import đã gửi bản tin: ${r.posts} lời gọi`);
  assert.equal(r.code, 0, `import phải thoát 0 — ${r.stderr.slice(0, 300)}`);
});

test("AC-10 chỉ import tệp: 0 lời gọi tới máy chủ thu, thoát 0", () => kiemImport(PUSH));

test("AC-10 chiều đỏ: bản sao gọi main() không chốt → đỏ ghim «AC-10 import đã gửi bản tin»", async () => {
  const dot = mutantPush("push-ops-facts.mjs", (s) => s.replace(/if \(laTepChinh\(\)\) main\(\)/, "main()"));
  await assert.rejects(kiemImport(dot), /AC-10 import đã gửi bản tin/);
});

test("AC-10 đối chứng: chạy tệp làm lệnh chính → đúng 1 lời gọi", async () => {
  const r = await captureOpsFacts();
  assert.equal(r.code, 0, r.stderr.slice(0, 300));
  assert.equal(r.posts, 1);
});

test("AC-10 chạy khô --kho → 0 lời gọi", async () => {
  const r = await captureOpsFacts({ args: ["--kho"] });
  assert.equal(r.posts, 0);
  assert.equal(r.code, 0, r.stderr.slice(0, 300));
  assert.match(r.stdout, /ops-facts khô: sạch, 0 chỗ chặn/, "AC-10 --kho phải dựng xong bản tin");
});

test("AC-10 chạy qua symlink như launchd (~/dev/one-invest) → vẫn là lệnh chính, đúng 1 lời gọi", () => voiTam(async (dir) => {
  const lienKet = path.join(dir, "one-invest");
  symlinkSync(path.resolve(path.dirname(PUSH), ".."), lienKet);
  const r = await captureOpsFacts({ script: path.join(lienKet, "pipeline", "push-ops-facts.mjs") });
  assert.equal(r.code, 0, r.stderr.slice(0, 300));
  assert.equal(r.posts, 1);
}));
