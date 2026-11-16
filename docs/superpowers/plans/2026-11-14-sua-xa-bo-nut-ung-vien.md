# sua-xa-bo-nut-ung-vien Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `danh-ba-vat-the --sua-xa` bỏ qua nút dự án `mot_loi_khai` để vẫn chạy sau khi áp thẻ luật S06.

**Architecture:** Một hằng `SQL_NUT_SUA_XA` (export) thay câu đọc nút trong `suaXaNut`; lọc qua `to_jsonb` để chạy trên DB
chưa có cột. Một itest riêng.

**Tech Stack:** Node ESM, `pg`, `node:test`, DB thử `db/db-thu.sh oneinvest_suite_sxu --chay`.

**Spec:** `docs/superpowers/specs/2026-11-14-sua-xa-bo-nut-ung-vien-design.md`

## Global Constraints

- Chỉ đổi câu đọc nút trong `suaXaNut` (`pipeline/danh-ba-vat-the.mjs`); không định dạng lại tệp, không đụng `pipeline/lib/danh-ba-vat-the.mjs`.
- Câu lọc: `(to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'`.

## Review Focus

- Nút `catalog_tier` NULL (bảng có cột nhưng giá trị rỗng) vẫn được đọc — ca E4.
- Nút xác minh bị lệch xã được sửa về đúng sau khi lọc — ca E1.

### Task 1: Câu đọc nút lọc ứng viên + itest [independent: false]

**Files:** Modify `pipeline/danh-ba-vat-the.mjs:308-309` · Create `pipeline/scripts/sua-xa-ung-vien.itest.mjs` · Modify
`_acceptance/config.yaml` (`executors.test.sxu_db`).

- [ ] Viết itest ca `SXU-AC-1`, `SXU-AC-2`, `SXU-AC-3` đúng expected của E1, E2, E4; chiều đỏ E1 dùng bản sao lệnh (tệp tạm, import tuyệt đối).
- [ ] Chạy, thấy đỏ (thiếu `SQL_NUT_SUA_XA`).
- [ ] Thêm `export const SQL_NUT_SUA_XA` và dùng nó trong `suaXaNut`.
- [ ] Chạy itest + `dv1_db` → xanh; khai `sxu_db`.
- [ ] Commit `fix(pipeline): --sua-xa bỏ qua nút dự án ứng viên S06`.
