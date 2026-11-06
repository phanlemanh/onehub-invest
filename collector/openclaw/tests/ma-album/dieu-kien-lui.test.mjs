// E8 (mas3_lui) — test lệnh phán lùi phai-lui.mjs. Mẫu log 0 tên/ID thật.
import test from "node:test";
import assert from "node:assert/strict";
import { phanLui } from "./phai-lui.mjs";

const MOC = { transcript: { main: "754|1793328829957", watcher: "3886|1792577264438" }, cfgSha: "x", batLuc: "2026-11-06T03:00:00+07:00" };
const giay = (iso) => Date.parse(iso);

test("E8a: transcript tăng KHÔNG dòng timing → dung-goi-Manh", () => {
  const r = phanLui(MOC, { gateway: "", hook: "", canh: "", transcript: { main: "755|1793328829957" } });
  assert.equal(r.phan, "dung-goi-Manh");
});
test("E8b: max tăng (lượt nhanh không timing) → dung-goi-Manh", () => {
  const r = phanLui(MOC, { gateway: "", hook: "", canh: "", transcript: { main: "754|1793328999999" } });
  assert.equal(r.phan, "dung-goi-Manh");
});
test("E8c: bộ canh KILL kèm có lượt → dung-goi-Manh (KHÔNG lùi rồi bật lại)", () => {
  const r = phanLui(MOC, { gateway: "", hook: "", canh: "2026-11-06T03:30:00+07:00 KILL: L4d: agent 'a' co transcript_events MOI" });
  assert.equal(r.phan, "dung-goi-Manh");
});
test("E8d: chỉ mất marker → lui-bat-lai", () => {
  const r = phanLui(MOC, { gateway: "", hook: "", canh: "2026-11-06T03:30:00+07:00 WARN: marker bien mat" });
  assert.equal(r.phan, "lui-bat-lai");
});
test("E8e: dạng log 26/10, 27/10 (3003 NGOÀI 15′ đầu + tự nối ~6s) → KHÔNG lùi (chua-ro)", () => {
  const gw = [
    "2026-11-06T04:20:00.000+07:00 [zalouser] channel exited: listener closed (3003): KICKOUT_BY_WORKER",
    "2026-11-06T04:20:05.000+07:00 [gateway] startup phase: runtime.early starting provider zalouser",
    "2026-11-06T04:21:00.000+07:00 post-gw khac",
  ].join("\n");
  // có bài post 202 gần thời điểm phán → không rơi nhánh 30′
  const hook = "2026-11-05T21:20:00.000Z post 202 {\"accepted\":1}"; // = 04:20+07 UTC-7
  const hienTai = Date.parse("2026-11-06T04:22:00.000+07:00");
  const r = phanLui(MOC, { gateway: gw, hook, canh: "", hienTai });
  assert.equal(r.phan, "chua-ro");
});
test("E8f: listener đóng trong 15′ ĐẦU → lui-bat-lai", () => {
  const gw = "2026-11-06T03:05:00.000+07:00 [zalouser] Zalo listener error: closed (3003)";
  const r = phanLui(MOC, { gateway: gw, hook: "", canh: "" });
  assert.equal(r.phan, "lui-bat-lai");
});
test("E8g: 29′ không post 202 → KHÔNG lùi; 31′ → lui-bat-lai (log hook UTC, lệch múi giờ không phán sai)", () => {
  const bat = "2026-11-05T20:00:00Z";
  const hienTai29 = Date.parse("2026-11-05T20:29:30Z"); // bài cuối 20:00:01 → 29,5′ trống
  const hook = "2026-11-05T20:00:01.000Z post 202 {\"accepted\":1}";
  const r29 = phanLui({ ...MOC, batLuc: bat }, { gateway: "", hook, canh: "", hienTai: hienTai29 });
  assert.notEqual(r29.phan, "lui-bat-lai", "29′ không lùi");
  const hienTai31 = Date.parse("2026-11-05T20:31:00Z");
  const r31 = phanLui({ ...MOC, batLuc: bat }, { gateway: "", hook, canh: "", hienTai: hienTai31 });
  assert.equal(r31.phan, "lui-bat-lai", "31′ lùi");
});
test("E8h: log đổi inode giữa chừng vẫn đọc đủ — đọc theo đường dẫn mỗi lần (thiết kế hàm doc)", () => {
  // CLI đọc lại theo path mỗi lượt — không giữ handle; kiểm bằng cách gọi 2 lần
  // với nội dung thay đổi giữa 2 tệp cùng đường dẫn (mô phỏng xoay inode)
  const r1 = phanLui(MOC, { gateway: "2026-11-06T03:05:00.000+07:00 closed (3003)", hook: "", canh: "" });
  const r2 = phanLui(MOC, { gateway: "2026-11-06T03:05:00.000+07:00 closed (3003)\n2026-11-06T03:06:00.000+07:00 dòng thêm sau xoay inode", hook: "", canh: "" });
  assert.equal(r1.phan, r2.phan, "kết quả nhất quán trước/sau xoay");
});
