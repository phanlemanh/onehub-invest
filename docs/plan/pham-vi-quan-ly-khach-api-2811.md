# Bản phạm vi — Quản lý khách API cho data-api (28/11/2026)

Lời Mạnh: 28/11 06:00Z, gõ «Đồng ý» ở phiên kiểm data-api, trả lời bản đề xuất «Quản lý khách API». Mạnh đồng ý năm câu theo
khuyến nghị; nội dung ở ROADMAP §3 mục 65. Lời ấy không phủ ba việc:
- DDL và quyền role trên cloud;
- triển khai AH2;
- cấp khoá thật đầu tiên.

Mã do GS cấp ngày 28/11. Bản này có thêm ba hàng ngoài đề xuất:
- PB10, từ Ngoài-2 của PB7;
- PB17, hợp đồng mới từ PB6;
- HT44, hợp đồng mới từ HT20.

Việc vận hành (áp cloud và cấp khoá đầu tiên) không vào bản này, mà liệt ở «Ra khỏi kho» của PR cắt lượt.

<!-- <<<PHAM-VI-MA -->
```
dot: quan-ly-khach-api-2811
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/quan-ly-khach-api-2811.md#296aca2745fb61a6d7d2e95014c4b3862d692864

- `PB10` — sổ nguồn ẩn rỗng thì /v1/listings đóng (không mở tin nguồn ẩn); thêm ô «không lọc» của ma trận AC-3 — xong khi: sổ rỗng → đóng, có ca chiều đỏ cho ô «không lọc»
- `PB12` — bảng đường → lớp ở một chỗ trong data-api/src/contract/, đường chưa khai thì đóng, bảng in vào /openapi.json — xong khi: mọi đường đang mount có lớp; cấy một đường không khai thì test đỏ
- `PB13` — migration bốn bảng (khách, thoả thuận, khoá, lượt dùng ngày) + quyền role data-api; lược đồ mẫu có bảng rỗng — xong khi: áp trên DB thử rồi dựng lại lược đồ mẫu, PB8 vẫn 0 đường 500
- `PB14` — data-api kiểm khoá băm, lớp, thoả thuận từ DB; giữ fail-closed của PB3 — xong khi: khoá đã thu hồi → 401 trong ≤ 60 s; khoá L0 gọi /v1/listings → 403; mất bảng → 503; ca chiều đỏ cho từng nhánh
- `PB15` — hạn mức ngày, 429, header hạn mức, ghi api_usage_daily — xong khi: trần 5 lượt trên DB thử, lượt thứ 6 → 429; số trong bảng khớp số lời gọi
- `PB16` — trang /ops/api-clients: cấp, thu hồi, xoay khoá, sửa thoả thuận, xem lượt; quyền owner/admin; ghi ops_audit — xong khi: ô «Khách API đang hoạt động» trên màn từ 0 → 1 (khách nội bộ đầu tiên), không phải triển khai lại
- `PB17` — tài nguyên Property thôi phụ thuộc bảng nguồn nội bộ (source_registry chỉ ở máy thu) — xong khi: danh bạ có trên DB mà không có source_registry thì /v1/properties* không ra 500
- `HT44` — executor chm_api của hồ sơ chuyen-huong-ma-thi-truong chạy lại được sau khi insights trả 410 — xong khi: executor chm_api xanh trên main, có ca chiều đỏ
```
<!-- PHAM-VI-MA>>> -->
