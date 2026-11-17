---
slug: nap-s16-vao-danh-ba
at: 2026-11-14T05:41:48Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Thẻ review_queue của bước S16 mang mã căn và toa_id lên cloud (ADR-0015 cho thẻ lên vai ops) mà bộ soát chỉ quét asset_nodes | Dựng trên dữ liệu thật sinh vài trăm thẻ ghi mã căn và hai toà; đường đẩy thẻ đưa lên cloud; E9 vẫn xanh vì không ca nào cấy vào thẻ | Ca đỏ cấy token vào evidence thẻ; bộ soát quét mọi bảng sẽ đẩy; E10 chạy thử sync đếm token S16 = 0 | fixed: thiết kế §5.2 thẻ S16 chỉ mang khoá vật thể và s16_ref; §6 quét mọi bảng trong danh sách đẩy và xuất soatS16 cho đường thẻ; AC-9 thêm ca (d), (e); AC-5, AC-6, AC-10 assert evidence thẻ sạch và chạy thử sync |
| P0 | design | Căn cứ dòng d-20261114T054055Z-3 (bậc xac_minh cho toà đúc từ toa_id) trích câu về mã căn, không quyết bậc toà; nhãn gom có toa_id có thể thành toà ảo bậc xác minh; AC-10 không đếm theo toà | Toà «Rainbow» và nhãn gom khác được đúc bậc xac_minh với 0 căn; không phép đo nào bắt | Thay bằng Hỏi chi-nguoi; AC-10 in bảng căn theo toà mới và số toà mới ít căn; ca nhãn gom trong AC-5 | fixed: dòng mới d-…-9 supersedes d-…-3, nguồn chi-nguoi (Hỏi-2); thiết kế §5.3 không đúc toà 0 căn; AC-5 thêm ca «Rainbow»; AC-10 in căn theo toà mới và số toà dưới 10 căn |
| P1 | contract | AC-7 không có mã chung khác toà, nên độc lập thứ tự không được đo ở chỗ hai nhánh khác nhau | S08 trước ra căn S08 cộng thẻ; S16 trước rồi S08 gắn bí danh không xét toà; hai DB khác nhau mà E7 xanh | Fixture có mã chung khác toà; assert cùng kết quả; chiều đỏ bỏ kiểm toà | fixed: thiết kế §5.5 bước S08 kiểm toà, lệch thì thẻ; AC-7 và E7 thêm ca khác toà và chiều đỏ «lệch toà» |
| P1 | contract | Ngưỡng AC-10 «GP ≥ 1.283, OP1 ≥ 153» đếm số mã S08 có trong S16, chưa trừ thẻ lệch toà và căn mơ hồ | Code đúng thiết kế mà E10 đỏ; chỉ nới luật lệch toà mới xanh | Đẳng thức ba phần đếm bằng SELECT riêng | fixed: AC-10 và E10 đổi thành ba phần (bí danh · thẻ lệch toà · mơ hồ) cộng bằng số mã S08 có trong S16 đếm lúc chạy |
| P1 | contract | «Đường đo» thay ý «khớp manifest» bằng bộ đếm độc lập mà không nói, và ý «bộ nạp làn thu, schemaVersion mới» không có đường đo | Cổng tưởng ngưỡng đã đo đủ; lúc tích hợp lệch 2 dòng với tệp kê và bộ nạp chưa có | Viết thẳng ở Đường đo; E2 in số tệp kê cạnh số đếm; ý bộ nạp đo ở bước tích hợp | fixed: Đường đo nói rõ bộ đếm độc lập thay manifest và lệch 147.268/147.266; E2 in số tệp kê; ý bộ nạp + schemaVersion đo ở bước tích hợp import-s16* |
