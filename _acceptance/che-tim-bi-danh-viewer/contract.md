---
schema_version: 1
feature: Vai Người xem không dò được bí danh đã che qua ô tìm của /ops/people — máy chủ bỏ ?q= và trang ẩn ô tìm với vai dưới Vận hành
slug: che-tim-bi-danh-viewer
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-che-tim-bi-danh-viewer-design.md
---

# Acceptance Contract: che-tim-bi-danh-viewer

## Context

Ngoài-1 và Ngoài-3 của `danh-ba-nguoi-tren-ops`: vai Người xem không thấy giá trị bí danh nhưng ô tìm `?q=` vẫn lọc trên
giá trị thô, nên gõ dần là dựng lại được tên, tài khoản đã che. Mạnh chọn «mở hợp đồng mới» khi ký Cổng Bằng chứng 30/10.

## Criteria

- AC-1: Given lược đồ tạm có ma trận người của `danh-ba-nguoi-tren-ops`, When phiên vai Người xem mở `/ops/people?q=<chuỗi khớp đúng một bí danh>` qua page thật, Then danh sách, tổng «m người khớp» và ba số đầu trang giống hệt khi không có `q`, kèm dòng báo «Tìm theo tên hay tài khoản chỉ dành cho vai Vận hành» (theo Hỏi-1); còn phiên Vận hành và Quản trị cùng `q` ấy thì chỉ nhận đúng người khớp, không có dòng báo; và `PeopleContent` là chỗ gọi duy nhất của hàm danh sách trong `app/src`. (cross-layer)
- AC-2: Given ma trận 5 vai (khách, user, viewer, ops, admin), When dựng `/ops/people` qua page thật, Then ô tìm (`name="q"`) và nút «Tìm» chỉ có với ops và admin; viewer vẫn có bộ chọn nguồn; khách và user không thấy trang.
- AC-3: Given phiên Người xem, When mở `/ops/people?source=S05&q=<chuỗi bất kỳ>`, Then tập người trả về bằng đúng tập của viewer với `?source=S05` không có `q` (lọc nguồn vẫn áp, `q` bị bỏ). (cross-layer)
- AC-4: Given bộ test của `danh-ba-nguoi-tren-ops`, When chạy lại, Then mọi ca cũ vẫn xanh (tìm của vai Vận hành, phân trang, che bí danh không đổi).

## Coverage

- Trục A — Vai phiên: khách | user | viewer | ops | admin [thước CE: `BAC_VAI` của `app/src/lib/ops-access.ts`] → AC-1, AC-2.
- Trục B — Tham số: chỉ `q` | `q` + `source` | không tham số [thước CE: `PeopleContent` của `app/src/components/ops/people/people-content.tsx`] → AC-1, AC-3.
- Never: đổi quyền xem bí danh của vai Vận hành trở lên (Out of scope).

## Out of scope

- Đổi quyền xem bí danh của vai Vận hành trở lên.
- Hiện số điện thoại gốc trên trang.
- Tìm theo mã người `pty_…`.

## Notes

- Hỏi-1: nếu Mạnh chọn cho viewer tìm theo mã `pty_`, AC-1 đổi Then thành: viewer với `q` là một phần mã người nhận đúng người khớp mã, `q` theo tên bị bỏ; AC-2 giữ ô tìm cho viewer với chữ gợi ý «Mã người».
