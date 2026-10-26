# Thước tin rao đổi/mất phường nối qua bài — Implementation Plan

**Goal:** `lechTheoBai` so tin trước/sau theo từng bài; phép đo AC-8 dùng nó, đối chứng qua cùng hàm, chặn «nối hỏng».

**Spec:** `docs/superpowers/specs/2026-10-26-tin-rao-doi-phuong-noi-post-ids-design.md`, `_acceptance/tin-rao-doi-phuong-noi-post-ids/contract.md`

## Global Constraints

- Không đổi transform hay cách băm `offer_id`. Mọi chạm DB trong BEGIN…ROLLBACK, khoá tư vấn 33033.

## Review Focus

- Tin có `post_ids` NULL (không phải mảng rỗng) → coi như rỗng.
- Một bài thuộc hai tin sau lượt (giả định 1 sai) → lấy tin đầu tiên theo `offer_id`, ghi chú.

### Task 1: scripts/lib/doi-phuong.mjs + test AC-1 — phục vụ E1 · independent: false
- `lechTheoBai(truoc: Map, sau: Map) → { lech: {offer_id, post_id, loai, truoc, sau}[], khongCon: {offer_id, post_id, source}[] }`
- Test `scripts/lib/doi-phuong.test.mjs` ca DP-AC-1 (mười ca), verify `node --test scripts/lib/doi-phuong.test.mjs` + phá-thử (bỏ so từng bài → ca h đỏ)

### Task 2: test AC-2 mồi S03 + S05 — phục vụ E2 · independent: false
- Cùng tệp test, ca DP-AC-2 (hai bài mồi, hai lượt transform) và chiều đỏ thước cũ

### Task 3: phép đo AC-3 — phục vụ E3 · independent: false
- `scripts/kiem-tin-rao-gan-khu-vuc.mjs`: chụp 0 → mồi → lượt A → chụp 1 → lac → lượt B → chụp 2; dòng chính, đối chứng qua cùng hàm, chặn nối hỏng
- Verify `node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` + phá-thử (thay lechTheoBai bằng lech cũ → đỏ)
