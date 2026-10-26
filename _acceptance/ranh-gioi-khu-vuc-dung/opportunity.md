---
schema_version: 1
slug: ranh-gioi-khu-vuc-dung
feature: Khu vực Hà Nội chỉ gồm phường/xã của Hà Nội và Đà Nẵng có phường riêng; metrics tính lại theo ranh giới đúng
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU9
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU9 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Khu vực Hà Nội chỉ gồm phường/xã của Hà Nội và Đà Nẵng có phường riêng; metrics tính lại theo ranh giới đúng

Vì sao: Audit L8, P5: 33 khu vực cấp tỉnh gắn dưới vn-hanoi, 19 listing gán sai; bản đồ Hà Nội phủ cả nước.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «ST_Extent của vn-hanoi nằm trong Hà Nội; 0 khu vực tên «Tỉnh…» dưới vn-hanoi» chưa?
- Kết quả nào là SỐNG: [đề xuất] ST_Extent của vn-hanoi nằm trong Hà Nội; 0 khu vực tên «Tỉnh…» dưới vn-hanoi
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «ST_Extent của vn-hanoi nằm trong Hà Nội; 0 khu vực tên «Tỉnh…» dưới vn-hanoi» khi hết timebox
- Timebox: …
