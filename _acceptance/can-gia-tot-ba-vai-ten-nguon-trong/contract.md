---
schema_version: 1
feature: Script đo ba vai của Căn giá tốt bỏ qua dòng sổ nguồn không có tên, không gãy giữa chừng và không báo «lộ tên nguồn» giả trên mọi trang
slug: can-gia-tot-ba-vai-ten-nguon-trong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-22T08:50:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-22-can-gia-tot-ba-vai-ten-nguon-trong-design.md
---

# Acceptance Contract: can-gia-tot-ba-vai-ten-nguon-trong

## Context

Hàng CG20 (dãy N1), từ Ngoài-4 của NK1 — Mạnh «mở hợp đồng mới». `scripts/can-gia-tot-ba-vai.mjs` (thước E10 của
`can-gia-tot-biet-can`) gọi `.toLowerCase()` trên `source_registry.real_name` không lọc NULL: dòng NULL làm script ném lỗi, dòng rỗng
khớp mọi chuỗi nên mọi trang thành «lộ tên nguồn» giả. DB máy thu hôm nay 15/15 dòng có tên; lỗi lộ ở DB thử hay bản chép. Hàng chỉ
đổi script và thêm một mô-đun nhỏ; không ghi DB. Thiết kế: `design_doc`.

## Criteria

- AC-1: Given các dòng sổ nguồn có `real_name` là tên thường, NULL, chuỗi rỗng, chỉ khoảng trắng, thiếu cột, dòng null, giá trị không
  phải chuỗi, tên có khoảng trắng hai đầu, When dựng danh sách tên nguồn, Then không ném lỗi, mọi dòng không có tên dùng được bị bỏ, tên
  còn lại cắt khoảng trắng và về chữ thường.
- AC-2: Given danh sách dựng từ các dòng ấy, When soát một chuỗi trang, Then chuỗi không chứa tên nguồn nào không bị báo lộ (kể cả
  chuỗi rỗng — tên rỗng không còn khớp mọi chuỗi), còn chuỗi chứa một tên, khác hoa thường, vẫn bị bắt.
- AC-3: Given script đo ba vai, When nó lấy tên nguồn và soát trang, Then nó đọc sổ nguồn qua hàm nạp chung (câu đọc đặt một chỗ),
  chặn danh sách rỗng bằng hàm của AC-4, soát mỗi chuỗi trang bằng hàm soát của AC-2, và không còn gọi `real_name.toLowerCase()` trực tiếp.
- AC-4: Given mọi dòng sổ nguồn đều không có tên dùng được, When script dựng danh sách, Then script dừng «chưa đo được» (thoát 2) với
  thông điệp «0 tên nguồn để soát (bỏ N dòng sổ nguồn không có tên)» thay vì cho mọi trang qua; còn ít nhất một tên thì chạy tiếp và in
  số dòng đã bỏ.
- AC-5: Given DB của riêng lượt chép từ máy thu, cấy thêm một dòng tên rỗng và một dòng chỉ khoảng trắng trong giao dịch, When hàm nạp
  chạy đúng câu đọc của script, Then số tên bằng số dòng có tên đếm độc lập bằng SQL, số dòng bỏ bằng phần còn lại (≥ 2), không tên nào
  rỗng; chỉ in số đếm, không in tên nguồn.

## Coverage

Bỏ bộ quét hình thái (dòng `descope` trong sổ): không gian một chiều là giá trị của một cột — tám ca của AC-1 phủ mọi dạng
`real_name` đọc được từ pg (chuỗi, NULL, rỗng, khoảng trắng) cộng ba dạng phòng thủ (thiếu cột, dòng null, không phải chuỗi).
Thêm hai trục: số tên còn lại (0 → AC-4 dừng · ≥ 1 → chạy tiếp) và nguồn dòng (đối tượng viết tay AC-1 · câu SQL thật trên DB AC-5).
`public.source_registry.real_name` là NOT NULL (migration 012) nên NULL chỉ có ở lược đồ thử; rỗng và khoảng trắng có thể có ở public.

Ai đọc đầu ra phía sau: thước E10 của hồ sơ `can-gia-tot-biet-can` và mọi lượt ghim lại chạy script này.

## Out of scope

- Chạy trọn script đo ba vai (cần bản app đang chạy và tài khoản thử; đó là việc của thước E10 hồ sơ CG1).
- Làm sạch dữ liệu `source_registry`.
- Các chỗ khác đọc `real_name` (bộ che, bộ soát tầng A).

## Known limits

## Notes
