// test-posts.test.mjs — hồ sơ _acceptance/lay-mau-khu-trung-theo-tin E4 (AC-4): dấu bài thử «noi-dung» theo bảng viết trước.
// Nhánh «nhóm tên toàn chữ số» đọc câu Mạnh trả Hỏi-2 ở Cổng Phạm vi (dòng gate1 mới nhất của sổ), không gõ tay trong test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TEST_MARKERS, testMarker } from "./test-posts.mjs";

const GOC = fileURLToPath(new URL("./test-posts.mjs", import.meta.url));
const SO = fileURLToPath(new URL("../../_acceptance/lay-mau-khu-trung-theo-tin/decisions.jsonl", import.meta.url));

/** Câu Hỏi-2 mới nhất ở Cổng Phạm vi: có chọn gạt nhóm toàn chữ số hay không. */
function nhomSoLaDau() {
  const dong = readFileSync(SO, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter((d) => d?.stage === "gate1" && /^Hỏi-2:/.test(d.decision ?? ""));
  assert.ok(dong.length, "sổ chưa có câu Hỏi-2 ở Cổng Phạm vi");
  const cau = dong.at(-1).decision;
  return !/không dùng nhóm toàn chữ số/i.test(cau) && /nhóm toàn chữ số/i.test(cau);
}

const THAT = { snapshot_id: "hanoi__zalo-agent__2026-11-01T000000", agent_id: "openclaw-hook", group_name: "Ocean Park 2" };
const bang = (nhomSo) => [
  [{ ...THAT, text: "Xem căn mẫu tại https://abc-def.trycloudflare.com/x" }, "noi-dung"],
  [{ ...THAT, text: "Căn 2PN đăng trên [Tên sàn] giá tốt" }, "noi-dung"],
  [{ ...THAT, text: "Căn 2PN đăng trên [TÊN SÀN] giá tốt" }, "noi-dung"],
  [{ ...THAT, group_name: "1234567890123456789", text: "Bán căn 2PN" }, nhomSo ? "group" : null],
  [{ ...THAT, text: "Bán căn 2PN" }, null],
  [{ ...THAT, group_name: "TEST-G1", text: "Bán căn" }, "group"],
  [{ ...THAT, snapshot_id: "hanoi__zalo-mock__2026-10-20T000000", text: "Bán căn" }, "snapshot-source"],
  [{ ...THAT, text: "Ảnh https://photo-stal-1.zdn.vn/abc.jpg căn 2PN" }, null],
  [{ ...THAT, text: "Liên hệ tên sàn Anh Phát để xem nhà" }, null],
  [{ ...THAT, group_name: "Masteri 2 Toà M3", text: "Bán căn" }, null],
  [{ ...THAT, text: null }, null],
];

async function banDot(a, b) {
  const src = readFileSync(GOC, "utf8");
  assert.ok(src.includes(a), `chỗ đột biến không còn: ${a}`);
  const dir = mkdtempSync(path.join(path.dirname(GOC), ".tp-dot-"));
  try {
    writeFileSync(path.join(dir, "test-posts.mjs"), src.replace(a, b));
    return await import(pathToFileURL(path.join(dir, "test-posts.mjs")).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("GN2-AC-4 dấu bài thử noi-dung theo bảng viết trước, nhóm toàn chữ số theo Hỏi-2", async () => {
  const nhomSo = nhomSoLaDau();
  assert.equal(nhomSo, false, "Hỏi-2 ngày 07/11: không dùng nhóm toàn chữ số");
  const b = bang(nhomSo);
  assert.equal(b.length, 11);
  for (const [row, want] of b) assert.equal(testMarker(row), want, `${row.group_name} · ${row.text}`);
  assert.ok(TEST_MARKERS.includes("noi-dung"));
  // Chiều đỏ: bắt mọi nhóm có chữ số; không đọc chữ bài.
  const nhomLong = await banDot('  if (GROUP_TEST.test((row.group_name ?? "").trim())) return "group";', '  if (GROUP_TEST.test((row.group_name ?? "").trim()) || /\\d/.test(row.group_name ?? "")) return "group";');
  assert.ok(b.some(([row, want]) => nhomLong.testMarker(row) !== want), "NHOM CO SO BI GAT");
  const khongDoc = await banDot('  if (NOI_DUNG_TEST.test((row.text ?? "").normalize("NFC"))) return "noi-dung";\n', "");
  assert.ok(b.some(([row, want]) => khongDoc.testMarker(row) !== want), "BAI THU NOI DUNG LOT");
});
