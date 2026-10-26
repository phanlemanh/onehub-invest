# cong-tac-test-ghim-ban-cu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ca thử công tắc nhóm thu đối chứng với bản route trước sửa đã ghim thành fixture, nên vẫn xanh sau khi #142 gộp.

**Architecture:** Fixture `app/tests/fixtures/source-groups-route.truoc-cong-tac.ts.txt` = route ở 8fc9603d; `chepRouteCu()`
chép fixture ra chỗ cũ (cạnh route) thay cho `git show origin/main:…`. Ca kiểm `scripts/cong-tac-ghim.itest.mjs` mô phỏng
«origin/main sau gộp» bằng một `git` giả đứng đầu PATH.

**Tech Stack:** `node:test`, `tsx`, PostgreSQL :5433 (ca thử app).

**Spec:** `docs/superpowers/specs/2026-10-26-cong-tac-test-ghim-ban-cu-design.md` · `_acceptance/cong-tac-test-ghim-ban-cu/contract.md` · E1–E2.

## Global Constraints

- Văn bản ca thử không chứa `origin/main`, `merge-base`, `execFileSync("git"`, `git show`.
- Fixture giống từng byte `git show 8fc9603d:app/src/app/api/v1/ops/source-groups/route.ts`.

## Review Focus

1. Tiến trình con `node --test` thừa hưởng `NODE_TEST_CONTEXT` thì in khuôn tuần tự hoá, không có `ℹ pass` — ca kiểm xoá biến này. Ca: `GB-AC-2`.
2. Ca thử ở đỉnh #142 chép route vào `app/src` và tự xoá trong `finally`; ca kiểm xoá bản chép ca thử của nó. Ca: `GB-AC-2`.

---

### Task 1: Fixture + ca thử + ca kiểm

**independent: false** · phục vụ E1, E2

**Files:**
- Create: `app/tests/fixtures/source-groups-route.truoc-cong-tac.ts.txt`, `scripts/cong-tac-ghim.itest.mjs`
- Modify: `app/tests/cong-tac-nhom-go.test.tsx` (`chepRouteCu`, chú thích đầu tệp, import)

- [ ] Viết `GB-AC-1`, `GB-AC-2` theo E1, E2; chạy `config:executors.test.cong_tac_ghim` → FAIL ở GB-AC-1 (văn bản còn `origin/main`).
- [ ] Ghim fixture, sửa `chepRouteCu()` dùng `copyFileSync(FIXTURE, p)`.
- [ ] Chạy lại `cong_tac_ghim` + `cong_tac` → PASS; `cd app && npx tsc --noEmit && npm run lint`.
- [ ] Commit `fix(test): ca thử công tắc đối chứng với route trước sửa đã ghim`.
