# qv-ac-9-khong-chap-chon — kế hoạch thi công

**Goal:** `scripts/check-api-surface.mjs` quét `app/src` mà không ném `ENOENT` khi tệp đột biến tạm của test khác biến mất.

**Spec:** `docs/superpowers/specs/2026-10-31-qv-ac-9-khong-chap-chon-design.md` · hợp đồng `_acceptance/qv-ac-9-khong-chap-chon/contract.md`.

## Task 1 — test viết trước (independent: false)

- Files: tạo `app/tests/api-surface-tep-an.test.tsx`.
- Ca `TA-AC-1`, `TA-AC-2` (a/b/c/d), `TA-AC-3` đúng `expected` của E1–E3; bản đột biến sinh bằng thay chuỗi trên mã
  hiện tại, ghi vào thư mục tạm cùng bản chép `check-deals-api.mjs`.
- Verify: `cd app && node --import tsx --test tests/api-surface-tep-an.test.tsx` — đỏ trước Task 2 (loadFiles chưa nhận
  `base`/`io`).
- Phục vụ: E1, E2, E3.

## Task 2 — sửa bộ quét (independent: false)

- Files: `scripts/check-api-surface.mjs`.
- `walk(dir, out, io)` bỏ tệp tên bắt đầu `.`; `statSync`, `readdirSync` của thư mục con, `readFileSync` gặp `ENOENT`
  thì bỏ mục; lỗi khác ném. `loadFiles(base = root, io = fs)` trả khoá tương đối `base`.
- Verify: test Task 1 xanh; `node scripts/check-api-surface.mjs static` và `mutation` ĐẠT; `cd app && npx tsc --noEmit && npm run lint`.
- Phục vụ: E1–E5, E7.

## Task 3 — hồi quy

- Verify: `cd app && npm test` xanh (E6).
