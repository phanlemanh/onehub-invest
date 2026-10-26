# auth-error-e2-superseded Implementation Plan

**Goal:** Ô auth-error-thu-lai-retry/E2 (đã ký) khai `status: not-run` + `superseded_by: auth-error-e2-superseded#AC-1`; AC-1 tả đúng ba ca AC-2 hiện có.
**Spec:** `_acceptance/auth-error-e2-superseded/contract.md` (T2, làn V).

### Task 1 (xong): test AE2-AC-2 + khai ô E2
`independent: true` · phục vụ E2 · Files: `scripts/auth-error-e2-superseded.test.mjs`, `_acceptance/auth-error-thu-lai-retry/evals.yaml`
- [x] Test đỏ trước (ô E2 chưa khai) → khai `status: not-run` + `superseded_by` (giữ `cmd`) → xanh; `node --test scripts/auth-error-*.test.mjs` 10/10.

### Task 2: S4 → Cổng Bằng chứng (hồ sơ thay phải signed-off) → ghim lại auth-error-thu-lai-retry → pre-merge-check → đẩy.
