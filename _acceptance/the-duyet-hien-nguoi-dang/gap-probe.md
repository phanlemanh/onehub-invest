---
slug: the-duyet-hien-nguoi-dang
at: 2026-11-02T02:01:00Z
verdict: findings
p0: 3
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Dòng sổ cho nhãn Khớp theo SĐT trích câu không quyết nhãn; audit §7.5 quyết ngược: so theo party_key, trước khi nối thì «Không so được» | Thẻ hiện Khớp theo SĐT chung trong khi danh bạ nói hai người, người duyệt chọn Cùng căn | Viết lại nhãn theo §7.5, ô AC-3 viết lại | fixed: thay dòng sổ, Khớp chỉ theo party_key, chung SĐT ra «Không so được» kèm dòng phụ; không cần Hỏi vì §7.5 quyết và đo 02/11 không có SĐT mang hai người trong một nguồn |
| P0 | design, evals | Quy tắc đại diện và Badge của tin nhiều người ghi là máy quyết bằng câu trích không quyết | Tin 11 người có tài khoản hơn nghìn tin không phải người neo: ô không Badge; Khớp qua người không neo mà hai ô hai tên | Dòng Hỏi, ca E5/E6, assert nêu người chung | fixed + human-gate1: thành Hỏi-1; Badge lấy người nhiều tin nhất trong nháp; dòng phụ nêu tên người chung; E11 in số tin đi nhánh dự phòng |
| P0 | design, contract | Vị trí hàng, áp Badge cho Tin A, bỏ design-pass ghi là máy quyết | Mạnh duyệt bằng chữ, tưởng đã có căn cứ; lật sau khi làm xong | Tách dòng sổ, chạy design-pass | fixed + human-gate1: Hỏi-2 và Hỏi-3; bỏ dòng descope, chạy design-pass nac-1 gửi ảnh kèm thẻ |
| P1 | contract, evals | Lời hứa «nhận ra ngay» không có đường đo đầu-cuối; E2 thiếu ca hai vai một tin; E11 có thể rỗng nghĩa, đo tồn tại thay quan hệ | Lỗi nối làm thẻ thật không bao giờ Khớp mà eval vẫn xanh; hàng duyệt cạn thì E11 không đo gì | Tag cross-layer, ca đầu-cuối, E11 so tập độc lập | fixed: AC-3, AC-4 cross-layer; E3, E6 dựng danh bạ bằng dungNguoi thật; E2 thêm ca; E11 cộng 20 cặp dựng từ tin sống, so tập Badge với đếm độc lập, đỏ khi không đủ mẫu |
| P2 | design, evals | Cờ tên gọi không đo dương giả; luật so dấu là chi tiết chưa ghi | «nhà mình bán» bật cờ Minh, người duyệt nghiêng về cùng người | Ca âm, E11 in cờ thật | fixed: so đúng dấu, đòi chữ đầu hoa, dòng sổ riêng; E4 thêm ca; E11 in số cờ; dương giả còn lại ghi Notes |
