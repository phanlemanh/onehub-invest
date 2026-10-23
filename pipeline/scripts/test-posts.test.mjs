// test-posts.test.mjs — vòng canonical-khong-tin-gia (PL2): transform gạt post thử, dọn qua đối soát.
// Ca DB chạy trong BEGIN…ROLLBACK trên Postgres local :5433 — không để lại dòng nào.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { TEST_MARKERS, testMarker } from "../lib/test-posts.mjs";

// Ma trận viết trước (E1): hàng lấy nguyên dạng cột stg_zalo_posts thật ngày 23/10.
const AC1_MATRIX = [
  [{ snapshot_id: "hanoi__zalo-mock__2026-10-18T034152", agent_id: null, group_name: "BĐS Hà Nội" }, "snapshot-source"],
  [{ snapshot_id: "hanoi__example__2026-10-17T153258", agent_id: null, group_name: null }, "snapshot-source"],
  [{ snapshot_id: "hcmc__zalo-e2e__2026-10-20T010101", agent_id: "openclaw-hook", group_name: "Nhóm A" }, "snapshot-source"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-19T073318", agent_id: "e2e-agent", group_name: "BĐS Hà Nội" }, "agent"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "test-hook", group_name: "Nhóm A" }, "agent"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "TEST" }, "group"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "TEST-G1" }, "group"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "BĐS Hà Nội" }, null],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "apify-facebook", group_name: "MUA BÁN NHÀ ĐẤT HÀ NỘI" }, null],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "Hội mua bán test nhà" }, null],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "TESTING ROOM" }, null],
];

/** Thông điệp ghim của một ô ma trận. */
const ac1Message = (row, want) =>
  want === null ? `AC-1 bắt nhầm nhóm thật: ${row.group_name}` : `AC-1 không nhận ra dấu ${want}: ${JSON.stringify(row)}`;

test("AC-1 ma trận dấu", () => {
  let n = 0;
  for (const [row, want] of AC1_MATRIX) {
    assert.equal(testMarker(row), want, ac1Message(row, want));
    n++;
  }
  assert.equal(n, 11, "AC-1 ma trận phải đủ 11 ô");
  assert.deepEqual([...TEST_MARKERS], ["snapshot-source", "agent", "group"]);
});

test("AC-1 chiều đỏ: luật nhóm lỏng bị ma trận bắt", () => {
  // Bản sao luật nhóm bỏ ràng buộc ký tự theo sau — ô «TESTING ROOM» phải đỏ.
  const loose = (row) => (/^test/i.test(row.group_name ?? "") ? "group" : testMarker(row));
  const failed = AC1_MATRIX.filter(([row, want]) => loose(row) !== want).map(([row, want]) => ac1Message(row, want));
  assert.deepEqual(failed, ["AC-1 bắt nhầm nhóm thật: TESTING ROOM"]);
});
