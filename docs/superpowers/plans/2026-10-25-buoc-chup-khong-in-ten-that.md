# Bước chụp không in tên thật Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `scripts/ui-capture-login.mjs` không bao giờ đưa tên tầng A ra argv, stdout hay stderr, và không ghi ảnh khi bước che chưa xong.

**Architecture:** Tên ở lại Node; trang chỉ che `[data-tier-a]` rồi trả chữ + thuộc tính (bỏ cây con `[data-tier-a]`, `<script>`, `<style>`); Node so bằng hàm thuần `tierALeaks`. Mọi lệnh con qua lớp bọc `step()` ném `CaptureError` → `capture()` trả 7 với lời chung đã xoá tên.

**Tech Stack:** Node ESM, node:test, playwright-cli.

**Spec:** `docs/superpowers/specs/2026-10-25-buoc-chup-khong-in-ten-that-design.md` · hợp đồng `_acceptance/buoc-chup-khong-in-ten-that/contract.md` (AC-1…AC-7) · evals E1…E7.

## Global Constraints

- Mã thoát mới: 7 = lệnh con lỗi (kể cả eval đọc chữ không đọc được). Giữ 0/2/3/4/5/6 như cũ.
- Lời lỗi: `bước chụp lỗi ở «<bước>» (mã <n>)` + tối đa một dòng stderr đã thay mọi tên bằng `███`; không argv.
- Không biến môi trường đổi nguồn danh sách tên.
- Không sửa `scripts/ui-standards/mask-tier-a.js`.

## Review Focus

- Tên chứa ký tự regex (`(`, `.`) → `tierALeaks` dùng `includes`, không regex (ma trận E2).
- Eval đọc chữ trả `undefined` (trang trống) → mã 7, không «không lộ» (E4).
- `tierANames()` ném lỗi sau khi đã ghi tệp → tệp bị xoá (E5).

---

### Task 1: Tên ở lại Node + bọc lệnh con + dọn tệp tạm

independent: false · phục vụ E1, E2, E4, E5, E7

**Files:** Modify `scripts/ui-capture-login.mjs`, `scripts/ui-capture-login.test.mjs`

**Interfaces — Produces:** `tierALeaks(names: string[], page: { text: string; attrs: string[] }) → { leaked: number; attrLeaked: number }` · `PAGE_TEXT_FN: string` (hàm trang trả `{ text, attrs }`, bỏ cây con `[data-tier-a]`, script/style) · `class CaptureError extends Error { step; code }` · `capture()` thêm mã 7; `tierANames` của CLI trả `{ names, cleanup }`.

- [ ] Test hỏng: UC-TA-1 (argv sạch + đối chứng dương), UC-TA-2 (ma trận `tierALeaks` + mã 5), UC-TA-4 (7 bước lỗi → mã 7, đầu ra sạch), UC-TA-5 (tệp tạm), sửa runner giả của UC-AC-9/10 cho eval mới (không đổi dòng assert).
- [ ] Chạy test trên bản cũ → đỏ; ghi sha + thông điệp ghim vào sổ (chiều đỏ của E1/E4).
- [ ] Sửa `ui-capture-login.mjs`; test xanh.
- [ ] Commit.

### Task 2: Phép đo trình duyệt thật

independent: false (dùng Task 1) · phục vụ E3, E6

**Files:** Create `scripts/ui-capture-browser.test.mjs`

- [ ] Máy chủ `node:http`: `/login` (khuôn server action), `/ops/x?ca=<chu|title|tierA|sach>`; gọi `capture()` với runner thật (`playwright-cli -s=<phiên>`), `ensureAccount: () => {}`, `readCred` cố định, `tierANames` tiêm bộ 3 tên giả; ảnh ra thư mục tạm.
- [ ] Ca: chữ → 5 không ảnh; title → 5 không ảnh; `[data-tier-a]` (chữ + title) → 0, ảnh > 0 byte, «đã che 1»; sạch → 0 có ảnh; đầu ra không chứa tên.
- [ ] `node --test scripts/ui-capture-browser.test.mjs` xanh; commit.

### Task 3: Kiểm nhánh

- [ ] `node --test scripts/*.test.mjs` (ngoài ca job-exit tồn đọng), `cd pipeline && npm test` (lối vào realpath), contract `implemented`, commit.
