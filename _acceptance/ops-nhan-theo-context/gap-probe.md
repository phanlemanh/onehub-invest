---
slug: ops-nhan-theo-context
at: 2026-10-24T15:05:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design, contract, evals | Giá trị kỳ vọng tự đụng luật đo: `areas.name` «Thành phố Hà Nội» chứa chữ _Avoid_ «thành phố»; «TP.» không trong danh sách giữ; «24h», «m²» tách ra token một chữ cái | Lúc build trang thật in «Thành phố Hà Nội» hay «TP. Hồ Chí Minh», AC-1/AC-8 báo, người làm phải nới luật sau Cổng 1 | Chốt trước Cổng 1 cách hiện tên khu vực và đơn vị; thêm ca ma trận E2 cho các chữ đó | fixed: tên thị trường bỏ tiền tố «Thành phố »/«Tỉnh » (design §2.4, AC-7); từ điển S02 «Hồ Chí Minh», «Vũng Tàu» không «TP.»; token một chữ cái không xét (design §2.2, Notes); ma trận AC-2/E2 thêm «Hà Nội», «Hồ Chí Minh», «24h», «m²», «tr/m²», `hanoi`, `hcmc` |
| P1 | design, contract, evals | Lối thoát `<code>` không có thước: bọc chữ tiếng Anh hay mã thô vào `<code>` thì mọi thước xanh | Người làm bọc «Heartbeat» hay `truthful-coverage` trong `<code>`; E1/E2/E5/E8 xanh, người vận hành vẫn đọc chữ cũ | Soi `<code>` bằng luật _Avoid_ + tên kiểm; đếm dấu dự phòng trên trang thật; chiều đỏ `<code>` | fixed: AC-1 và AC-8 (a)(c)(f) soi cả trong `<code>`, chỉ luật tiếng Anh (b) bỏ `<code>`; chữ tiếng Anh cũ thành `_Avoid_` qua AC-9 nên bọc không lách được; AC-8 đếm 0 dấu dự phòng, in danh sách chuỗi `<code>` từng trang; chiều đỏ AC-1 `Heartbeat` trong code, AC-8 `<code>Hàng chờ duyệt</code>` |
| P1 | contract, evals | Mã khu vực thô lọt luật âm tiết (`vn-tinh-an-giang` tách ra âm tiết hợp lệ); AC-5/6/7 đi qua DB mà test tự cấp bảng tên, không qua hàm nạp thật | Bộ nạp tên khu vực của trang thiếu dòng → trang in `vn-tinh-an-giang`, E5/E6/E7/E8 vẫn xanh | Luật mã khu vực trên trang thật; eval dùng đúng hàm nạp của trang | fixed: AC-8 luật (e) 0 `vn-…`, 0 `vn` thường, 0 snake_case + chiều đỏ; AC-5/6/7 gắn (cross-layer), eval E5/E6/E7 `layer: backend-effect` nạp bằng hàm thật (`getAreaNames`, `getAirdnaMarkets`, `readRotationPreview`, `getCoverageOverview`), paths gồm tệp truy vấn |
| P2 | design, evals | Phạm vi quét «đóng» chưa kê đủ; `ops-labels.ts` vắng; tệp quét một phần không có ranh giới | Nhãn tiếng Anh trong `ops-labels.ts` cho giá trị không có trên DB local lọt mọi thước | Kê đủ danh sách, ghim ranh giới theo tên hàm, E1 so danh sách | fixed: design §3.1 kê mẫu + tệp lib trọn tệp và một phần ghim theo tên hàm; AC-1/E1 deepEqual danh sách viết trước, tệp mới → đỏ nêu tệp |
| P2 | evals | E10 đo lớp trên `td` trong khi data-grid đặt `truncate` ở phần tử bọc bên trong | `td` có `whitespace-normal` nhưng div con vẫn `truncate`, tên vẫn bị cắt mà E10 xanh | Soi cả cây con của ô + đối chứng | fixed: AC-10/E10 đòi cả cây con ô (kể cả `td`) không `truncate`/`whitespace-nowrap`/`text-ellipsis`, đối chứng cột khác vẫn `truncate` đúng vị trí |
