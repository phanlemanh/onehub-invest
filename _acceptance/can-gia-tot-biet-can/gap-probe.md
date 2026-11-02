---
slug: can-gia-tot-biet-can
at: 2026-11-02T23:00:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions, design, contract, evals | Dòng sổ về căn rời danh sách ghi một lối là chính, lối chết nêu sai, và là lựa chọn chỉ người có; căn thiếu thước không tới được trang nên nhãn thiếu không chạm được qua page thật | Đường dẫn đã gửi ra «không tìm thấy» khi căn quá 45 ngày; căn mất thước ra 404 thay vì ghi thiếu gì, E5 và E8 vẫn xanh | Dòng chỉ người kèm câu hỏi; AC-5 đi qua trang thật | human-gate1: Hỏi-1, máy khuyên mở trang kèm nhãn lý do; E5 đổi sang loader và page thật, E7 thêm bốn lý do |
| P0 | decisions, design, evals | Dòng cloud gói cả liên hệ dù luật 6 đã cho tên, SĐT lên cloud; đo cloud chỉ là truy vấn giả 42P01 | Đội từ xa thấy «liên hệ chỉ có ở máy thu»; trên cloud thiếu `unit_number`, `street_number` nên câu lỗi 42703, trang rơi vào khối lỗi, E7 xanh | Tách dòng; lược đồ rút từ `CLOUD_ALLOW` kèm ca 42703 | human-gate1: Hỏi-2, máy khuyên hiện liên hệ; đã tách dòng ảnh, chữ; đã xác nhận hai cột không có trong `CLOUD_ALLOW`, E7 dựng lược đồ từ danh sách đó |
| P0 | decisions, contract, evals | Căn cứ sai ở nhiều dòng [s03-va-doc-tin#F2]: dòng ngưỡng trích một hằng số, dòng bỏ tách địa chỉ trích giả định chưa thử, dòng vai gói hai lựa chọn; chưa có dòng cho địa chỉ của vai Người xem; biên 5, 35, 50 không đo | Mạnh tưởng đã có căn cứ; vai Người xem đọc được số căn mà chưa ai quyết; đổi 50 trong SQL mà E4 xanh | Viết lại dòng; ca bốn biên qua `dealsSql` thật, đỏ khi SQL lệch hằng | fixed: bốn dòng thay thế và một dòng tách; human-gate1: Hỏi-3, Hỏi-4; E4 có ma trận bảy mức và đối chứng SQL lệch hằng |
| P1 | evals, contract | Lời hứa là vai Vận hành thấy ảnh nhưng eval đo src đúng khuôn; «Ảnh hỏng» tính là đạt; `?snapshot=` chưa có căn cứ | Mọi ảnh hỏng mà E3, E8, E9, E10 vẫn xanh, Mạnh gặp lại lỗi đã chấm 3 | E10 GET mọi ảnh, tách theo đường; sàn cho mỗi căn | fixed: E10 GET mọi ảnh hai vai theo từng đường, mỗi căn có ít nhất một ảnh 200; E9 ghi tỉ lệ, trên 50% là lỗi; đã đọc route, `?snapshot=` mở cho vai Vận hành |
| P1 | contract, evals | Ngưỡng CHẾT «ở đâu» không có đường đo; E8 không định nghĩa đạt từng câu; phiên chấm sớm trên 4 căn không có chỗ | Có phường là đạt nên E8 in 4/4 trong khi người vận hành vẫn gọi hỏi địa chỉ, không ai biết tới sau CG2 | Định nghĩa từng câu; dòng đường đo cho CHẾT và chấm sớm | fixed: mục Đường đo định nghĩa từng câu, chỉ có phường không đạt «ở đâu»; thêm hai dòng đường đo |
