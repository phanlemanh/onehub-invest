---
slug: px1-ac-10-so-dung-tin-gan-theo-ten
at: 2026-11-22T08:40:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn lối G ghi máy quyết, chưa có lời nhận của GS, lối khác chưa bác | Cổng Phạm vi duyệt định nghĩa người giao việc chưa nhận | Dòng sổ có lời nhận GS, lối bác kèm lý do | fixed: dòng sổ mới thay d-2, trích lời nhận GS 22/11, bác lùi-099 và đếm-riêng |
| P0 | design | Sàn 1.000 ghi một lối mà nhiều mức khác còn sống | Tập S03 co còn ~1.050 tin vẫn xanh | Mức co rút chấp nhận được, phương án và giá | fixed: sàn 1.500 và sàn tập so với G 1.300 (≈ 70%), dòng sổ thay d-3 nêu ba mức bị bác và vì sao |
| P1 | contract | Đối soát 1.908 với 1.900 chưa có; «không loại tin nào» chưa kiểm | Vài tin không vào nhánh G vẫn lệch hoặc bị loại âm thầm | Bảng đối soát, assert theo nhóm | fixed: ca so lại với cột, assert mọi tin lệch thuộc tập bị đè (22/11: 1.900 = 1.900, ngoài 0); ba số 1.900/1.905/1.908 là ba bản chép ở ba giờ, ghi ở design |
| P1 | evals | Tập so với G không có sàn; «bỏ G» có điều kiện nên rỗng là xanh; nhánh dưới sàn không có ca phá | Nhãn đổi khoá, nhánh G rỗng, chiều đỏ bỏ qua im lặng | Sàn tập G, ca phá dưới sàn | fixed: sàn tập G 1.300 trong ca chính và trước «bỏ G» (không còn điều kiện); ca phá cắt S03 còn 10 tin ném thông điệp ghim; chốt khoá goc có ca cấy bắt buộc |
| P2 | contract | Trục «xã danh bạ đã gỡ» ở Coverage không được đếm, in | Tập so co vì tin trỏ xã đã gỡ mà Coverage báo đã phủ | In số tin trỏ xã đã gỡ | fixed: dòng «# PX1-AC-10 đem so» in số tin trỏ xã đã gỡ, không so (22/11: 233) |
