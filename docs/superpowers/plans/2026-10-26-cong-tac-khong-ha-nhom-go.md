# cong-tac-khong-ha-nhom-go Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Công tắc của route `source-groups` theo ma trận 5 × 2 của TV2a (trừ hai ô tắt `retired`/`completed` trả 409 có
chữ — Hỏi-1), không còn hồi sinh nhóm đã gỡ, không đổi nhóm nháp thành tạm dừng.

**Architecture:** Sửa một hàm `toggleVongDoi` trong `app/src/app/api/v1/ops/source-groups/route.ts`: sau khi đọc trạng
thái cũ (`SELECT … FOR UPDATE`, đã có), tra bảng 5 × 2 → `409` (chữ theo trạng thái) · `unchanged` (200, ROLLBACK) ·
UPDATE + audit. Giao diện không đổi.

**Tech Stack:** Next.js route (TS), PostgreSQL :5433, `node:test` + `tsx` + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-26-cong-tac-khong-ha-nhom-go-design.md` · hợp đồng
`_acceptance/cong-tac-khong-ha-nhom-go/contract.md` (duyệt 26/10, Hỏi-1 = 409 có chữ) · evals E1–E6.

## Global Constraints

- Chữ 409 nguyên văn: `nhóm đã gỡ — không bật lại` · `nhóm đã gỡ — công tắc không đổi trạng thái` · `nhóm đã xong — không
  bật lại` · `nhóm đã xong — công tắc không đổi trạng thái`.
- Ô `unchanged` trả `{ ok: true, unchanged: true }` (giữ khuôn hiện có); không UPDATE, không audit.
- Lược đồ tạm ở khuôn sau 047 + 048 qua `pipeline/scripts/so-nhom-fixture.mjs` (`dungSauGop`); chụp `public` trước/sau.
- Không sửa `app/src/components/**`. Không migration.

## Review Focus

1. Hai lệnh đồng thời trên cùng nhóm `retired` → cả hai 409, không lệnh nào ghi. Ca: Task 1 `CT-AC-2`.
2. Nhóm `paused` bị tắt lại kèm lý do mới → `unchanged`, lý do cũ giữ nguyên (không ghi đè). Ca: Task 1 `CT-AC-1` ô paused+tắt.
3. Nhóm không tồn tại → giữ `{ ok: false }` như hôm nay. Ca: Task 1 `CT-AC-1` thêm một ô ngoài bảng.

---

### Task 1: Ca thử ma trận + sửa route

**independent: false** · phục vụ E1–E4, E6

**Files:**
- Create: `app/tests/cong-tac-nhom-go.test.tsx`
- Modify: `app/src/app/api/v1/ops/source-groups/route.ts` (`toggleVongDoi`)

- [ ] **Step 1: Viết `CT-AC-1`…`CT-AC-5`** theo E1–E4, E6 nguyên văn: bảng 10 ô viết trước (`BANG.length === 10`), mỗi ô một
  lược đồ tạm; đối chứng E1/E2 chạy bản chép route cũ (`git show origin/main:<route>` ghi ra tệp tạm cạnh route, import động,
  xoá trong `finally`); E4 hai lược đồ song song (UPDATE enabled vs route); E6 vẽ `SourceGroups` trong jsdom với `Toaster`.
- [ ] **Step 2: Chạy** `config:executors.test.cong_tac` → FAIL ở các ô retired/completed/draft × tắt và chữ 409 completed.
- [ ] **Step 3: Sửa `toggleVongDoi`** theo bảng design (một hằng bảng chữ 409 theo trạng thái; nhánh tắt với `cu.status !==
  'active'` → retired/completed 409, còn lại `unchanged`).
- [ ] **Step 4: Chạy lại** E1–E6 (`cong_tac` + `vong_doi_nguon_route`) → PASS; `cd app && npx tsc --noEmit && npm run lint`.
- [ ] **Step 5: Commit** `fix(ops): công tắc nhóm thu theo ma trận vòng đời — không hạ nhóm đã gỡ, không đổi nhóm nháp`.

### Task 2: Tài liệu

**independent: false** (sau Task 1)

- [ ] ROADMAP §4 một dòng trạng thái; commit `docs`.
