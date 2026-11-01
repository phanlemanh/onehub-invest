# pb-ac-5-khong-quet-tep-tam — kế hoạch thi công

**Goal:** PB-AC-5/PB-AC-6 trong `pipeline/scripts/phat-bieu.test.mjs` không đỏ khi bản đột biến ẩn của test khác biến mất giữa lúc quét.

**Spec:** `docs/superpowers/specs/2026-11-01-pb-ac-5-khong-quet-tep-tam-design.md` · hợp đồng `_acceptance/pb-ac-5-khong-quet-tep-tam/contract.md`.

## Task 1 — lớp bọc + ba ca TT-AC (independent: false)

- Files: `pipeline/scripts/phat-bieu.test.mjs`.
- `quetChiuTepTam(fn, lan = 100)`: quét lại khi `ENOENT` rơi vào tệp tên bắt đầu dấu chấm; mọi lỗi khác ném ngay.
- Năm lời gọi quét cây thật (`filesOfTree(ROOT)`, `findCallSites(ROOT)`, ba `kiemVai(ROOT…)`) đi qua lớp bọc; assertion giữ nguyên.
- Ca TT-AC-1 (tải sinh-xoá trên cây tạm, hai bộ quét), TT-AC-2 (ma trận lỗi + bản lỏng), TT-AC-3 (soát tĩnh lời gọi).
- Verify: `cd pipeline && node --test scripts/phat-bieu.test.mjs` xanh; đột biến `lan = 1` làm TT-AC-1 đỏ.
- Phục vụ: E1, E2, E3.

## Task 2 — hồi quy

- Verify: `cd pipeline && npm test` xanh (E4).
