# Trang Thu thập không có số S02 (ON6) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính).

**Goal:** Trang `/ops/collections` không hiện số S02 nào; tab Listing chỉ tự thu; Rotation chỉ lịch + lượt thu + giờ
cập nhật; hàng S02 của lưới nguồn hiện «Xem Chất lượng».

**Architecture:** Bớt chuỗi/cột/ô trong năm component có sẵn; `FlowDay` bỏ hai trường S02; luật tĩnh mới trong
`check-portal-compliance`. Đo bằng SSR với ma trận 7 số lính canh (hợp đồng §Context), vòng trọn bên ghi → `readOpsFacts`
→ trang cho phía máy chủ, đối chứng dương trên bản mã main 9e759b4 rút bằng `git show`.

**Tech Stack:** Next.js 16, ReUI, `node --test` + tsx, pg, playwright-core.

**Spec:** `docs/superpowers/specs/2026-10-25-collections-khong-so-s02-design.md` · hợp đồng
`_acceptance/collections-khong-so-s02/contract.md` (Hỏi-1, Hỏi-2 theo khuyến nghị).

## Global Constraints

- Ô S02 của lưới nguồn: liên kết chữ mờ «Xem Chất lượng» tới `/ops/quality`. Rotation: lịch 19:05, «6 lượt thu mỗi
  đêm», giờ cập nhật — không `total`, `cursor`, tên.
- Ô «Bản ghi 24h»: lọc đúng mã `S02` (so khớp chính xác) ở máy thu và máy chủ; chú thích «không tính S02».
- Không sửa vendor, không sửa `push-ops-facts.mjs`.

## Review Focus

1. Số S02 in dạng vi-VN / rút gọn lọt qua phép đếm — đếm ba dạng (AC-6).
2. S02 là nguồn nhiều nhất trong 24 giờ — «Nhiều nhất» không là S02 (AC-5).
3. Bản tin máy chủ mang mã S02 viết khác — tổng lệch phải bị bắt (AC-5 chiều đỏ).
4. Test ON5/ON8 ghim cột S02 của bảng luồng / trường `airdna*` của `FlowDay` — sửa có ghi chú.

---

### Task 1: Bớt số S02 ở năm vùng + luật tĩnh (independent: false) — phục vụ E1–E6b

**Files:** Modify `app/src/lib/collections-queries.ts`, `collections/sync-activity.tsx`, `collections-tables.tsx`,
`collections/pipe-panels.tsx`, `collections/feeds-grid.tsx`, `collections/collections-tiles.tsx`,
`collections/collections-view.tsx`, `scripts/check-portal-compliance.mjs`. Create
`app/tests/collections-khong-so-s02.test.tsx`.
- [ ] Ca `ON6-AC-1` … `ON6-AC-6` theo `evals.yaml`, mỗi ca có chiều đỏ; `tsc`, `lint`, `npm test`, portal xanh.

### Task 2: Smoke trang thật (independent: false) — phục vụ E7

**Files:** Create `scripts/smoke-collections-khong-so-s02.mjs` (khuôn ON13, `scripts/lib/ops-app.mjs`).
- [ ] 1280px máy thu: bảng không cột S02, tab Listing một mục chú giải, Rotation không huy hiệu, ô S02 «Xem Chất lượng»,
  ảnh chụp; chiều đỏ chèn huy hiệu tên.
