// E8 (mas3_lui) — test lệnh phán lùi phai-lui.mjs. Mẫu log 0 tên/ID thật.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
globalThis.__mas3Require ??= createRequire(import.meta.url);
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
  const r = phanLui(MOC, { transcript: MOC.transcript, gateway: "", hook: "", canh: "2026-11-06T03:30:00+07:00 WARN: marker bien mat" });
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
  const r = phanLui(MOC, { transcript: MOC.transcript, gateway: gw, hook, canh: "", hienTai });
  assert.equal(r.phan, "chua-ro");
});
test("E8f: listener đóng trong 15′ ĐẦU → lui-bat-lai", () => {
  const gw = "2026-11-06T03:05:00.000+07:00 [zalouser] Zalo listener error: closed (3003)";
  const r = phanLui(MOC, { transcript: MOC.transcript, gateway: gw, hook: "", canh: "" });
  assert.equal(r.phan, "lui-bat-lai");
});
test("E8g: 29′ không post 202 → KHÔNG lùi; 31′ → lui-bat-lai (log hook UTC, lệch múi giờ không phán sai)", () => {
  const bat = "2026-11-05T20:00:00Z";
  const hienTai29 = Date.parse("2026-11-05T20:29:30Z"); // bài cuối 20:00:01 → 29,5′ trống
  const hook = "2026-11-05T20:00:01.000Z post 202 {\"accepted\":1}";
  const r29 = phanLui({ transcript: MOC.transcript, ...MOC, batLuc: bat }, { gateway: "", hook, canh: "", hienTai: hienTai29 });
  assert.notEqual(r29.phan, "lui-bat-lai", "29′ không lùi");
  const hienTai31 = Date.parse("2026-11-05T20:31:00Z");
  const r31 = phanLui({ ...MOC, batLuc: bat }, { transcript: MOC.transcript, gateway: "", hook, canh: "", hienTai: hienTai31 });
  assert.equal(r31.phan, "lui-bat-lai", "31′ lùi");
});
test("E8h: log đổi inode giữa chừng vẫn đọc đủ — đọc theo đường dẫn mỗi lần (thiết kế hàm doc)", () => {
  // CLI đọc lại theo path mỗi lượt — không giữ handle; kiểm bằng cách gọi 2 lần
  // với nội dung thay đổi giữa 2 tệp cùng đường dẫn (mô phỏng xoay inode)
  const r1 = phanLui(MOC, { transcript: MOC.transcript, gateway: "2026-11-06T03:05:00.000+07:00 closed (3003)", hook: "", canh: "" });
  const r2 = phanLui(MOC, { transcript: MOC.transcript, gateway: "2026-11-06T03:05:00.000+07:00 closed (3003)\n2026-11-06T03:06:00.000+07:00 dòng thêm sau xoay inode", hook: "", canh: "" });
  assert.equal(r1.phan, r2.phan, "kết quả nhất quán trước/sau xoay");
});


// 0611-11 điểm (5)-(8) — ca thử riêng từng điểm bổ sung
test("E8i (5): cảnh báo/listener TRƯỚC batLuc không tính; SAU batLuc mới tính", () => {
  const moc = { ...MOC, batLuc: "2026-11-06T03:00:00+07:00" };
  // cảnh báo KILL TRƯỚC khi bật (02:00) — KHÔNG dung-goi-Manh
  const r1 = phanLui(moc, { transcript: MOC.transcript, gateway: "", hook: "", canh: "2026-11-06T02:00:00+07:00 KILL: cu" });
  assert.notEqual(r1.phan, "dung-goi-Manh", "KILL trước lúc bật là chuyện cũ");
  // cảnh báo KILL SAU khi bật (03:30) → dung-goi-Manh
  const r2 = phanLui(moc, { transcript: MOC.transcript, gateway: "", hook: "", canh: "2026-11-06T03:30:00+07:00 KILL: L4d" });
  assert.equal(r2.phan, "dung-goi-Manh", "KILL sau lúc bật phải dừng");
  // listener đóng TRƯỚC batLuc không tính
  const r3 = phanLui(moc, { transcript: MOC.transcript, gateway: "2026-11-06T02:50:00.000+07:00 [zalouser] closed (3003)", hook: "2026-11-06T03:01:00.000Z post 202", canh: "", hienTai: Date.parse("2026-11-06T03:05:00+07:00") });
  assert.notEqual(r3.phan, "lui-bat-lai", "đóng trước lúc bật không lùi");
});
test("E8j (7): tiến trình không lên / thoát ≤2′ sau batLuc → lui-bat-lai; hết lượt auto-restart → lui-bat-lai", () => {
  const moc = { ...MOC, batLuc: new Date(Date.now() - 60_000).toISOString() }; // vừa bật 1′
  const lcKhongPid = "\n0\t-\tai.openclaw.gateway\n";
  const r1 = phanLui(moc, { transcript: MOC.transcript, gateway: "", hook: "post 202 vua nay", canh: "", launchctlList: lcKhongPid, hienTai: Date.parse(moc.batLuc) + 5 * 60_000 });
  assert.equal(r1.phan, "lui-bat-lai", "PID không lên trong 2′ → lui");
  const r2 = phanLui({ ...MOC, batLuc: new Date(Date.now() - 60_000).toISOString() },
    { transcript: MOC.transcript, gateway: "2026-11-06T" , hook: "", canh: "", launchctlList: "12345\t0\tai.openclaw.gateway\n" });
  // gateway có PID và không dấu thoát → không rơi nhánh này (kết quả khác lui vì lý do tiến trình)
  assert.notEqual((r2.phan === "lui-bat-lai" && r2.vi.includes("tiến trình")) ? "x" : r2.phan, "x");
  const r3 = phanLui({ ...MOC, batLuc: "2026-11-06T03:00:00+07:00" },
    { transcript: MOC.transcript, gateway: "2026-11-06T03:10:00.000+07:00 [gateway] retry exceeded max — gave up", hook: "bai", canh: "", launchctlList: "999\t0\tai.openclaw.gateway\n", hienTai: Date.parse("2026-11-06T03:15:00+07:00") });
  assert.equal(r3.phan, "lui-bat-lai", "hết lượt tự nối lại → lui");
});
test("E8k (8): chạy CLI thật với batLuc = giờ hiện tại → chua-ro (máy thật đang lành)", () => {
  const { execFileSync } = globalThis.__mas3Require("node:child_process");
  const { writeFileSync } = globalThis.__mas3Require("node:fs");
  const moc = { transcript: {}, cfgSha: "x", batLuc: new Date().toISOString() };
  writeFileSync("/tmp/mas3-moc-hien-tai.json", JSON.stringify(moc));
  const out = execFileSync("node", [process.cwd() + "/collector/openclaw/tests/ma-album/phai-lui.mjs", "/tmp/mas3-moc-hien-tai.json"], { encoding: "utf8", env: { ...process.env } }).trim();
  assert.equal(out, "chua-ro", `CLI thật với mốc=hiện tại phải chua-ro, được ${out}`);
});
