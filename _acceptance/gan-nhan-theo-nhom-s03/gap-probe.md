---
slug: gan-nhan-theo-nhom-s03
at: 2026-11-04T09:07:03Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Ba dòng sổ máy tự quyết có căn cứ sai: bỏ design-pass, không nhập bảng tính, bảng riêng cho lý do | Mạnh duyệt biểu mẫu qua bản vẽ tĩnh mà không biết đang bỏ bước bấm thử; nhãn thử bị loại trong khi sổ ghi là máy quyết | Mỗi dòng một lối nêu được ràng buộc làm lối kia không chạy | fixed: tách dòng, hai câu thành Hỏi-3, Hỏi-4; human-gate1 |
| P0 | contract | Ngưỡng và cỡ mẫu là lựa chọn của người mà sổ không ghi; «trọn 30» chưa định nghĩa, tin chờ người thứ hai không có trạng thái | Mạnh ký mà không biết nhận khoảng 7.750 ô công; không phân xử được sống hay chết | Hỏi riêng kèm phép tính; định nghĩa bằng đếm; ca kiểm trạng thái | fixed: Hỏi-5, Hỏi-6, Đường đo, trạng thái, ca test; human-gate1 |
| P1 | evals | Lý do và ghi chú của người khác có thể lộ qua bảng trên màn; luật viewer chỉ đo trên hàm; thiếu ui-check bảng và khổ 390 | Người B đọc lý do của A rồi gắn theo, đồng thuận cao giả | Chuỗi đánh dấu ở lý do, ghi chú; quét HTML, RSC; ui-check | fixed: bảng chỉ có số, chữ chỉ qua lệnh xuất; E7, E8, E17 |
| P1 | evals | Đường ngữ cảnh nhóm chưa được đo: căn cứ mặc định dễ để nhầm, thiếu đối chứng dương, chưa đo trả lời thẻ, không có chuỗi thật | Điền Grand Park để nguyên «Chữ bài» vẫn lưu được, cột ngữ cảnh về 0, GCQ1 không có danh sách | Luật so giá trị với chữ, ca dương, ca thẻ, phép đo chuỗi thật | fixed: luật ở AC-4, E6, E9, E11, E18; Đường đo thêm tỉ lệ đọc sau lượt đầu |
| P1 | contract | Bài nhiều căn chưa có luật; view chỉ đo có mặt; E3 mâu thuẫn E2 về khử trùng; số migration, cổng ghi cứng | Hai người chọn hai căn khác nhau, đồng thuận thấp giả; «RB» và «Rainbow» thành bất đồng giả | Luật căn đầu, 16 assert view, thứ tự khử trùng, fixture có trùng | fixed: Notes, AC-2, AC-5, E1, E2, E3, E8; số 072 đã được LL cấp; cổng theo dãy mượn; tên đầy đủ cho dự án, phân khu |
