---
slug: ui-clean-b3-charts
at: 2026-10-22T23:05:14Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
# Phản biện context sạch — ui-clean-b3-charts

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design + contract | Danh sách miễn 3:1 (expenses, share3, rest, hatch) là lựa chọn của người nhưng sổ không có dòng chỉ-người | Người duyệt chọn phương án A mà không biết mình đồng thời ký luật miễn; Chi phí 1,48:1 ship ra /yield | Hỏi riêng, thẻ hiện bảng tỉ lệ cạnh Hỏi-1 | human-gate1: thêm Hỏi-3 (d-…-9) + AC-2 đọc danh sách người chốt; Coverage ghi [GIẢ ĐỊNH] |
| P1 | evals E9 + design §8 | Bản chụp cấu trúc không ghim bản script, không ghim thời điểm/dữ liệu, chiều đỏ chỉ sửa JSON | Dữ liệu đêm đổi giữa hai lần chụp → đỏ giả; script lọc quá tay → xanh rỗng | Ghim mã băm script + khung thời gian; phá-thử thật | fixed: AC-8/E9 đòi cùng capture_sha, cách ≤ 2 giờ, before chụp lại từ cây gốc liền trước after; S3 phá-thử thật một lần (evidence/phá-thử-E9.txt) |
| P1 | contract AC-8 + evals | Thao tác bỏ sót CSV, sao chép/toast, bật tắt mốc, trạng thái mix rỗng | Gộp actions.ts làm lệch CSV/toast mà E9, E10 vẫn xanh | Ghi tên tệp + sha256 CSV, chữ toast được/bị chặn, bật tắt mốc | fixed: AC-8 + E9 mở rộng đủ các thao tác; trạng thái mix rỗng deferred: dữ liệu local không có khu vực tổng = 0 và khối Empty nằm trong vùng B2 không đụng (ghi Coverage) |
| P1 | contract AC-1 + evals E1 | Lớp literal màu không có ma trận viết trước; lời hứa quan hệ nghĩa→khoá chỉ đo vắng mặt chuỗi | Đường doanh thu lấy share1 hoặc stroke hex lọt qua | Ma trận 7 dạng + assert nghĩa→khoá | fixed: AC-1 + E1 + E11 (mỗi dạng một ca phá) |
| P1 | evals + sổ d-8 | Lối so pixel không chết với khung P&L (không đổi màu, tách nặng nhất) | Lệch lớp/khoảng cách khi tách margin-plot lọt khỏi thước cấu trúc | So pixel P&L 4 chế độ | fixed: AC-8 + E14 so từng byte (ảnh chụp lặp 20/20 giống byte); dòng mới thay d-8 |
