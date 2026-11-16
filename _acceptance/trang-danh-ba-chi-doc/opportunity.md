---
schema_version: 1
slug: trang-danh-ba-chi-doc
feature: Người vận hành mở trang Danh bạ chỉ đọc trên Ops máy thu (/ops/registry) và thấy cây dự án → phân khu → toà → căn kèm số đếm, bậc danh mục, nguồn S0x, số tin đang rao; tìm theo tên và bí danh, lọc theo tỉnh và nguồn, thấy chỗ thiếu
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build             # Mạnh 17/11 tại phiên giám sát dot0 (local_4194042c), nguyên văn «Cổng Đáng trang Danh bạ: build lát chỉ đọc ngay»
decided_by: Mạnh
decided_at: 2026-11-16T23:20:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DN2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Lát đầu, chỉ đọc, tách từ hàng DN2 `trang-do-phu-danh-ba` của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Phần còn lại của DN2 (số tin gắn từng toà, căn; màn «Hồ sơ đối chiếu trường × nguồn») đi sau, không thuộc hồ sơ này.

Mạnh sáng 17/11: «Hiện nay trên ops chưa có danh bạ căn và danh bạ dự án, vì tôi không thấy được nên gần như không quản
lý được». Từ 03/11 kho đã gộp 18 hàng về danh bạ (dự án, toà · trục · căn) nhưng mọi thứ chỉ nằm trong DB — Ops không
có trang nào để nhìn.

Số đo hiện trạng DB máy thu (17/11 ~05:50 VN, giám sát đếm): `asset_nodes` 344 nút dự án (20 `xac_minh`, 324
`mot_loi_khai`), 31 phân khu, 3 nút building; `buildings` 198 toà; `units` 1.748 căn (69 toà có căn) ở Ocean Park 1 và
Grand Park; `project_links` S06: 341 nối, 8 chưa nối; `offer_project`: 5.470 tin S03 và 11.883 tin S06 đang rao có dự
án; `stg_s08_project` 357 dự án và `stg_s09_item` 345 mục đã nạp nhưng chưa nối vào danh bạ.

Ai đọc trang này phía sau: Mạnh (quản lý danh bạ bằng mắt), phiên duyệt thẻ nhóm, hàng nạp S16 (toà và mã căn sẽ tự
hiện khi nạp).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Mạnh có nhìn thấy và quản lý được danh bạ dự án, toà, căn trên Ops máy thu không?
- Kết quả nào là SỐNG: [đề xuất] Trang /ops/registry trên máy thu hiện dải số (dự án, phân khu, toà, căn, đã xác minh, danh mục đã nạp chưa nối) khớp đếm SQL độc lập trên cùng DB; Mạnh mở được một dự án bất kỳ xuống tới căn và chỉ ra được ít nhất một chỗ thiếu (dự án chưa có toà, toà chưa có căn, mã nguồn chưa nối) trong phiên nghiệm thu.
- Kết quả nào là CHẾT: [đề xuất] Số trên màn lệch đếm SQL, hoặc Mạnh không tìm được dự án theo tên/bí danh, hoặc trang lộ tên nguồn thật.
- Timebox: [đề xuất] 3 ngày từ khi Mạnh duyệt Cổng Phạm vi; quá hạn báo giám sát.
