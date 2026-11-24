---
slug: ghep-tin-vao-truc-can
at: 2026-11-24T13:20:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ngưỡng SỐNG có vế «mã căn khớp bí danh» mà AC-3 không có ô; ngưỡng ghi tập PL35 trong khi AC-10 chấm lát mới | Cổng Bằng chứng ký trên ngưỡng khác ngưỡng đã duyệt | Thêm ô bí danh vào AC-3, E3 hoặc descope có tên | fixed: AC-3 và E3 thêm ô bí danh khớp một căn và bí danh trỏ hai căn; opportunity.md đổi «tập PL35» thành tập nhãn trục OP1 của Hỏi-2 |
| P1 | evals | E10 judgment chỉ đọc một tệp tự khai số Wilson, không lệnh sinh, không ghim băm, không bảng bài sai | Số Wilson qua cổng T3 mà không ai tái lập được | Tách script tính Wilson có ghim băm + judgment đọc bảng bài sai | fixed: thêm E10a (script cham-truc.sh, so băm, thoát 1 dưới 0,95, chiều đỏ đổi nhãn); E10 chỉ hỏi kiểu lỗi trên bảng bài sai; AC-10 viết lại |
| P1 | design | Lý do viết lại offer_building là offer_unit sẽ quá 120 giây, nhưng không AC nào đo offer_unit | Viết lại offer_building mà offer_unit vẫn chậm | Đo thời gian offer_unit trong AC-7, E7 | fixed: AC-7, E7 đo count(*) và SELECT mức sâu của offer_unit dưới 15 giây; chiều đỏ bỏ MATERIALIZED |
| P2 | evals | Tầng 09 với 9, toà có tầng 12A không có ô; mức căn không có phép soát người | tang-lech giả hoặc căn sai tầng mà E3 vẫn xanh | Thêm hai ô vào AC-3, E3; AC-9 in từng tin mức căn | fixed: AC-3, E3 thêm hai ô; AC-9, E9 in từng tin mức căn kèm mã, tầng mã, tầng danh bạ |
| P2 | evals | E5 chỉ dùng dòng chèn tay, không nối đầu ra thật của hàm gắn với view | Khuôn ghi và khuôn view lệch mà E5 vẫn xanh | Ô đầu–cuối + kiểm phủ trên bản chép | fixed: AC-5, E5 thêm ô đầu–cuối trên ba bài thật và kiểm mọi dòng ghep-can-* sống hiện ở đúng một dòng offer_unit |
