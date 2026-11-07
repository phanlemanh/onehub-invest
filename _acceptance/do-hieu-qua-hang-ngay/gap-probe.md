---
slug: do-hieu-qua-hang-ngay
at: 2026-11-07T09:37:35Z
verdict: findings
p0: 1
p1: 3
p2: 1
claims_input: ok
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Bước gọi đọc gộp cho bài mẫu chưa có kết quả (Hỏi-1, trần 0,05 USD/ngày) không có AC nào giữ: tập bài được gọi, trần, thứ tự gọi rồi mới chụp nháp | Chụp nháp trước khi lời gọi trả về nên ngày nào cũng thiếu số đọc gộp; hoặc gọi lại khi chạy lại, vượt trần tiền | Ca DO1-AC-1-GOI với đọc gộp giả đếm lời gọi: 8/20 bài được gọi, chạy lại 0 lời, chạm trần thì dừng | fixed: AC-1 thêm vế gọi một lần trước chụp, dừng ở trần, chạy lại 0 lời gọi; E1 thêm ca DO1-AC-1-GOI và ba chiều đỏ |
| P1 | design | Khuôn draft không tách cách đọc vắng, không nhận là tin rao, và ô không nêu; AC-4 không nói đọc từ draft hay sale_offers | Thẻ thiếu đọc gộp bị đếm là bỏ sót; bài không thành tin toàn null thành giữ giả; transform chạy lại làm số tuần cũ đổi | E4 thêm thẻ thiếu nháp đếm riêng; sửa sale_offers sau lúc rút không đổi số | fixed: draft mang trang_thai co / khong-tin / vang; AC-4 đọc từ draft đã chụp, vang đếm riêng thieu_nhap; E1, E4 thêm chiều đỏ |
| P1 | evals | Fixture draft của E2, E3 viết tay, khoá cách đọc lệch khuôn, không round-trip qua writer và route lưu thật | Biểu mẫu tra nháp theo tiền tố khớp fixture nhưng không khớp draft thật; giá số và chuỗi lệch khuôn làm giữ nháp gần 0% | Ca DO1-RT: rút bằng writer thật, lưu không sửa qua route, giữ nháp 100% | fixed: E2 lấy draft từ hàm ghi của mau-soat, thêm ca DO1-RT và chiều đỏ KHOA CACH DOC LECH KHUON, CHUAN HOA LECH; draft lưu giá trị đã chuẩn hoá bằng hàm của màn gắn nhãn |
| P1 | evals | AC-2 có mặt người nhìn mà không ui-check; căn cứ bỏ design-pass chỉ trỏ E9; nhánh dự phòng bộ đọc luật không được đo | Select nhận giá trị lệch option nên màn chỉ hiện chữ gợi ý trong khi jsdom vẫn xanh; thẻ chỉ có bộ đọc luật hiện trống | E11 ui-check ba cảnh trên /ops/labels | fixed: thêm E11 ui-check; E1 kiểm hien = bo-doc-luat khi không có đọc gộp; dòng sổ bỏ design-pass ghi lại với căn cứ E9 + E11 |
| P2 | evals | E6 không có ca do-luong và ca một đơn vị đổi hai trường lõi cùng ngày | Lý do do-luong gán nhầm hay trống; một đơn vị sinh hai dòng | E6 thêm căn F (do-luong) và tin G (hai lý do, một dòng) | fixed: lý do thành mảng theo thứ tự năm trường lõi 056; E6 thêm F, G và chiều đỏ THIEU DO LUONG, HAI DONG MOT DON VI |
