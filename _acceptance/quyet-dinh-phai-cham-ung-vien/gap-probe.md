---
slug: quyet-dinh-phai-cham-ung-vien
at: 2026-10-31T00:00:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ d-3 ghi máy quyết chặn cả «Để sau» khi không chạm ứng viên, nhưng câu giao chỉ quyết các nút đóng thẻ; «Để sau» còn lối khác (cho đi qua) — lựa chọn của người | Mạnh ký mà nghĩ thẻ khoá chết vẫn dời được bằng «Để sau»; thực tế không nút nào gạt được thẻ chết khỏi hàng chờ | Dòng Hỏi người supersedes d-3 về «Để sau» | human-gate1: d-6 thay d-3 cho Cùng căn/Khác căn; d-7 là Hỏi-1 về Để sau, AC-1 ghi «Để sau theo Hỏi-1» |
| P1 | contract | Không văn bản nào nói route quyết định ở bản thật chạy trên DB nào; AC-8 đo trên bản chép DB máy thu | Ops quyết trên cloud với bảng ứng viên khác, E8 vẫn xanh | Ghi nơi route chạy và DB nó ghi | fixed: thiết kế §1 thêm dòng «Nơi route chạy» — review_queue là bảng tầng A 0 dòng ở cloud, review.decide chưa vào bộ áp lệnh kéo; sổ d-8 |
| P2 | evals | Coverage thiếu ô một dòng còn chờ + một dòng đã quyết; E4, E5, E6 chưa quét đủ ba quyết định | Bản cài đặt đếm mọi dòng trước khi lọc trạng thái trả 422 oan cho thẻ hợp lệ | Thêm ô hỗn hợp, ghi «× 3 quyết định» vào E4–E6 | fixed: AC-5 thêm ô hỗn hợp; Coverage ghi ma trận ô + mọi ô × 3 quyết định; E4–E6 sửa expected |
| P2 | evals | E6 âm tính không chiều đỏ, không đòi so_dong, không phân biệt 422 có chủ đích | Route bỏ kiểm khuôn vẫn qua E6; khoá ba phần (pair:A, B, C) khớp nhầm ứng viên thật | Chiều đỏ + đối chứng dương + so_dong | fixed: E6 thêm khoá ba phần khi có ứng viên sống đúng cặp, đối chứng dương khoá đúng khuôn → 200, chiều đỏ ghim 'HD9-AC-6: khoá sai khuôn vẫn chạm ứng viên' |
