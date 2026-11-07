---
schema_version: 1
feature: Diễn giải dòng kiểm «Nhãn số chưa xác minh» trên /ops/quality, kể cả vế S03 qua người đăng
slug: dq-so-chua-xac-minh-qua-nguoi
owner: phanlemanh@gmail.com
risk_tier: T1      # một nhánh khớp chuỗi trong dqDetail (nhãn hiển thị /ops/quality) + ca test; không đổi dữ liệu, truy vấn, quyền hay cổng Invest
surfaces: [ui]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: dq-so-chua-xac-minh-qua-nguoi

## Context

Kiểm 450 `so-chua-xac-minh` (070) ghi chi tiết `S06 có số: N, chưa xác minh: N, nguồn khác có nhãn: N`; PR #329
(enrich-nguoi-s03, 079) thêm vế `, S03 qua người đăng: N`. `dqDetail()` ở `app/src/lib/dq-labels.ts` chưa nhận khuôn
này, nên sau khi DB máy thu áp 079 và chạy 450 (06/11), suite `app_ui` đỏ ở ON12-AC-5
(`app/tests/ops-nhan-theo-context.test.tsx`) «dòng kiểm chưa diễn giải» — chặn S4 của GN1. Giám sát đợt
`dieu-phoi-dot0-cam-mau` giao 07/11.

Thay đổi: một nhánh khớp trong `dqDetail()` cho đúng kiểm `so-chua-xac-minh`, nhận cả dạng 070 cũ lẫn dạng 079; ca test
trong `app/tests/dq-data-level-label.test.tsx`.

## Cắt / hoãn

- Không đổi chuỗi detail của `pipeline/sql/450_dq_checks.sql`.
- Không đổi tên kiểm hay nhãn đối tượng (đã có `Nhãn số chưa xác minh`).

## Acceptance Criteria

- AC-1: hai dạng detail (có và không có vế S03 qua người đăng) ra chữ tiếng Việt, `known: true`; khuôn thiếu vế hay sai kiểm
  vẫn `known: false`.
- AC-2: ON12-AC-5 trên DB local xanh (1162 dòng, 21 loại kiểm trong 7 ngày lúc sửa).
