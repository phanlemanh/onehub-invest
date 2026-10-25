# dq-moi-nhat-moi-kiem (ON9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bảng «Kiểm chất lượng» hiện bản mới nhất theo (kiểm, đối tượng), đếm đúng, nhãn kiểm số tham chiếu không xanh lá.

**Spec:** `docs/superpowers/specs/2026-10-24-dq-moi-nhat-moi-kiem-design.md` · hợp đồng `_acceptance/dq-moi-nhat-moi-kiem/contract.md` (Mạnh duyệt 24/10, Hỏi-1 = khuyến nghị).

### Task 1: Nguồn dữ liệu + nhãn — phục vụ E1–E4 · independent: false
**Files:** Create `app/src/lib/dq-checks.ts` (`dqLatestSql`, `dqStats`, `loadDqChecks`, `dqResult`), `app/tests/dq-moi-nhat.test.tsx`; Modify `app/src/components/ops/quality/dq-checks-table.tsx`, `app/src/app/ops/quality/page.tsx`.
**Verify:** `cd app && npx tsc --noEmit && npm run lint && npm test` (lượt phá: nhãn bỏ qua tên kiểm, màu ép xanh lá, trang tự truy vấn → đỏ).

### Task 2: Đo dữ liệu thật + từ điển — phục vụ E5, E6 · independent: false
**Files:** Create `scripts/dq-moi-nhat-do.mjs`; Modify `_acceptance/config.yaml` (`dq_moi_nhat_do`), `CONTEXT.md`.
**Verify:** `cd app && node --import tsx ../scripts/dq-moi-nhat-do.mjs` exit 0.
