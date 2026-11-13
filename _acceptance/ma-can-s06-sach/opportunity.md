---
schema_version: 1
slug: ma-can-s06-sach
feature: Tin S06 không còn mã căn và số nhà rác từ cờ nguồn, và mang toà từ trường block của nguồn thành phát biểu
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-12     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DA5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/danh-ba-du-an.md#cc5a831db25ee1071ba8fee913a250b558c97b07` — chưa có trang: trang đợt danh-ba-du-an-0811
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Tin S06 không còn mã căn và số nhà rác từ cờ nguồn, và mang toà từ trường block của nguồn thành phát biểu

Vì sao: pipeline/lib/dac-trung-s06.mjs:55 đọc cờ unitnumber_display trước unitnumber: khoảng 11.530 phát biểu mã căn rác lớp source_field sẽ thắng chữ bài; block thô không được đọc.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «0 phát biểu mã căn «0»/«1» còn hiệu lực; 0 số nhà «0»; tin S06 có toà ≥ 95% số tin có block trong thô; có bảng nghĩa pty_project_type kèm số mẫu từng giá trị» chưa?
- Kết quả nào là SỐNG: [đề xuất] 0 phát biểu mã căn «0»/«1» còn hiệu lực; 0 số nhà «0»; tin S06 có toà ≥ 95% số tin có block trong thô; có bảng nghĩa pty_project_type kèm số mẫu từng giá trị
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «0 phát biểu mã căn «0»/«1» còn hiệu lực; 0 số nhà «0»; tin S06 có toà ≥ 95% số tin có block trong thô; có bảng nghĩa pty_project_type kèm số mẫu từng giá trị» khi hết timebox
- Timebox: …

## Quyết định Cổng Đáng

Mạnh, 2026-11-12, gõ ở phiên giám sát đợt dot0-cam-mau (giám sát chuyển nguyên văn), trả lời câu «Cho làm DA5, DA6 và PL20 (ba Cổng Đáng của chuỗi định vị căn)?»: «Làm cả ba».
