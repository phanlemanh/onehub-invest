---
slug: tin-rao-gan-khu-vuc-dung
at: 2026-10-26T09:20:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Loại khu vực airbnb-discovery do máy quyết, kho_dao false, trong khi lựa chọn đổi số liệu tin bán theo phường người dùng thấy sau lượt nạp theo lịch | Mạnh ký Cổng Phạm vi tưởng hàng chỉ lọc khu vực lạc; lượt đêm sau merge gỡ 9 tin S05 khỏi bốn khu vực «Quận …» mà không ai ký đánh đổi | Thành câu hỏi chỉ-người kho_dao true kèm số đếm chỉ đọc những gì trỏ vào bốn khu vực | human-gate1: Hỏi-1 trên thẻ, kèm số đếm DB local (9 tin S05, 22 dòng market_asset_stats, 0 saved_markets/properties/market_metrics/listings) |
| P0 | evals | Bỏ coverage-scan với lý do tự vòng; E7 chỉ quét bốn tệp đã biết; kiểm «gọi ganPhuongTheoToaDo» đo chuỗi có mặt | Một bước gán thứ năm còn câu chọn submarket riêng mà E7 vẫn xanh; hcmc-simple viết lại UPDATE khác chữ chỉ nhắc tên hàm trong comment | Ma trận viết trước mọi tệp pipeline/ khớp mẫu, nhãn dùng-chung/miễn; E7 assert tập tệp bằng ma trận | fixed: AC-7 viết lại thành ma trận viết trước (design doc §5, 11 tệp) có chiều đỏ tệp mới ngoài ma trận; AC-6 đổi kiểm hcmc-simple thành «không còn UPDATE … area_id riêng» qua ma trận; dòng sổ coverage-scan thay bằng dòng mới |
| P1 | contract | Vế không tụt của AC-8 đo bằng tổng đếm theo nguồn trong khi lời hứa là quan hệ theo từng tin | Tin mới từ stg bù số tin hợp lệ bị gỡ nhãn; E8 vẫn PASS | Nối từng tin theo offer_id, 0 tin có phường hợp lệ trước bị gỡ hay đổi; đối chứng dương tin mồi bị gỡ nhãn → đỏ | fixed: AC-8 và E8 nối theo offer_id kèm đối chứng dương tin mồi |
| P1 | evals | Giả định 2 của ô cơ hội (9 tin S05 vẫn tìm được phường) không có đường đo có thể đỏ | Cả 9 tin mất nhãn mà E8 vẫn PASS, Cổng Bằng chứng ghi giả định đã thử | E8 in riêng các tin trỏ khu vực không hợp lệ trước lượt: bao nhiêu sang phường, bao nhiêu NULL | fixed: AC-8/E8 in số theo nguồn; kết quả ghi vào cột Trạng thái của giả định 2 ở Cổng Bằng chứng |
| P2 | design | Chưa ghim thị trường mỗi transform truyền vào docPhuongHopLe | transform-zalo truyền cả vn-hcmc, bài S03 Hà Nội khớp nhầm phường TP.HCM trùng tên | Design ghi thị trường từng transform; AC-2 thêm ca phường vn-hcmc trùng tên | fixed: design doc §2.1 ghim thị trường; AC-2 + E2 thêm ca trùng tên vn-hcmc |
