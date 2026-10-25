---
schema_version: 1
slug: hieu-chuan-mot-bo-so
feature: Người vận hành mở «Hiệu chuẩn» trên /ops/quality thấy mỗi thị trường một bộ số nhất quán giữa các bảng, định nghĩa «tự thu» ghi rõ ở từng bảng, mẫu mỏng có cờ, và thị trường chưa có số gộp thành một dòng
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-17) theo lệnh Mạnh 24/10
decided_at: 2026-10-24T22:28:49Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON10
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON10 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở «Hiệu chuẩn» trên /ops/quality thấy mỗi thị trường một bộ số nhất quán giữa các bảng, định nghĩa «tự thu» ghi rõ ở từng bảng, mẫu mỏng có cờ, và thị trường chưa có số gộp thành một dòng

Vì sao: OPS-11: area_sources LIMIT 1 không ORDER BY bốc ngẫu nhiên một market (Cần Thơ score 0 cạnh 97.14), ba định nghĩa «tự thu» cùng nhãn (Hà Nội 257/267/39), mẫu 1 listing không cờ. OPS-15: 10/29 thẻ toàn «—», header vẫn đếm 29. Gốc G4 + G6.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Khu vực gộp nhiều market: chạy hai lần ra cùng số; số «tự thu» của một khu vực giống nhau ở mọi bảng cùng định nghĩa; đếm hiệu chuẩn chỉ tính thị trường có số» chưa?
- Kết quả nào là SỐNG: [đề xuất] Khu vực gộp nhiều market: chạy hai lần ra cùng số; số «tự thu» của một khu vực giống nhau ở mọi bảng cùng định nghĩa; đếm hiệu chuẩn chỉ tính thị trường có số
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Khu vực gộp nhiều market: chạy hai lần ra cùng số; số «tự thu» của một khu vực giống nhau ở mọi bảng cùng định nghĩa; đếm hiệu chuẩn chỉ tính thị trường có số» khi hết timebox
- Timebox: …
