# Thẻ ghép căn hiện người đăng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hàng «Người đăng» đầu bảng so của thẻ ghép căn, đọc danh bạ lúc mở thẻ, có phép đo hai chiều cho từng tiêu chí.

**Architecture:** Hàm thuần ở `review-can-cu.ts` (`chonNguoiNeo`, `timTenGoi`, `soNguoiDang`), truy vấn thứ hai `NGUOI_SQL` trong `loadReviewContext`, hàng đầu của `rows` trong `ReviewCompare`. Không ghi gì, không đổi `evidence`.

**Tech Stack:** Next.js 16, `pg`, `node:test` + `tsx` + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-02-the-duyet-hien-nguoi-dang-design.md`; hợp đồng `_acceptance/the-duyet-hien-nguoi-dang/contract.md`, tiêu chí `evals.yaml`.

## Global Constraints

- Mốc Badge `NGUONG_DANG_NHIEU = 10`, theo người nhiều tin nhất của tin, áp cả hai bên (Hỏi-1, Hỏi-2).
- Khớp chỉ khi chung `party_key`; chung SĐT mà khác người ra `khong_so` kèm «Cùng SĐT <số>».
- `TRUONG_GHEP_CAN` giữ mười hàng. Test PL3, HD6, viewer không sửa ca nào.
- Test dựng lược đồ tạm `nd_<pid>`; mọi bảng `dungNguoi` ghi phải có trong lược đồ đó, không ghi vào `public`.

## Review Focus

- Tên «unknown» của S05: không hiện như tên thật — ca trong Task 1 (AC-7).
- Tin S06 có thêm người khác: neo vẫn theo `ct:<số>`, không rơi về `party_key` nhỏ nhất — ca trong Task 1 (AC-6).
- Người neo từ 10 tin mà có người khác nhiều tin hơn: không hiện thêm chữ phụ — ca trong Task 1 (AC-5).
- Hàng duyệt cạn trên máy thu: phép đo không xanh rỗng nhờ 20 cặp dựng — Task 1 (AC-8).
- Tên có một phần trùng («Hoa» trong «Hoan»): cờ không bật — Task 1 (AC-4).

---

### Task 1: Tệp test hai chiều và chốt mã nháp

`independent: false` · phục vụ E1–E11, E13.

**Files:**
- Create: `app/tests/the-duyet-hien-nguoi-dang.test.tsx`
- Modify (khi test lộ lỗi): `app/src/lib/ops/review-can-cu.ts`, `app/src/lib/ops/review-context.ts`, `app/src/components/ops/review/review-compare.tsx`, `app/src/components/ops/review-card.tsx`

**Interfaces:**
- Consumes: `dungNguoi(c, { gop: false, out })` của `pipeline/lib/danh-ba-nguoi.mjs`; `loadReviewContext(items, query)`.
- Produces: các ca `ND-AC-1` … `ND-AC-8` đúng tên và thông điệp ghim trong `evals.yaml`.

- [ ] **Step 1:** Viết ca theo `evals.yaml`: mỗi tiêu chí có chiều xanh và bản chép tạm đổi đúng một chỗ, đỏ với thông điệp ghim.
- [ ] **Step 2:** Chạy `cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx`. Mong đợi: exit 0, có dòng `ND-AC-8 đo:`.
- [ ] **Step 3:** Chạy `the_so_song`, `the_duyet`, `viewer_the_duyet`, `npx tsc --noEmit`, eslint bốn tệp. Mong đợi: xanh, không sửa test cũ.
- [ ] **Step 4:** Chạy `/verify`, commit `feat(ops): thẻ ghép căn hiện người đăng của mỗi tin`, đặt contract `status: implemented`.
