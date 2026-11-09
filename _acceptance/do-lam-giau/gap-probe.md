---
slug: do-lam-giau
at: 2026-11-08T15:10:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-20261108T144838Z-2, d-20261108T144838Z-4) | Hai dòng S1 ghi nguồn muc-tieu với câu trích chỉ liên quan, không quyết lựa chọn: d-2 (luật migration không chọn giữa bảng ảnh chụp và dấu thời gian), d-4 (câu «không gọi model» không quyết định nghĩa tập đo, cách bỏ một ra, mẫu số) — cùng mẫu lỗi [ops-duyet-nhip-va-chu#F1] | Cổng Phạm vi duyệt định nghĩa tỉ lệ đúng như đã có căn cứ; Cổng Giá trị đọc số đo trên tin có số riêng như độ đúng của 901 tin được làm giàu, trong khi không ai chọn định nghĩa này | Dòng sổ supersedes d-2 nguồn mot-loi có loi_chet; tách d-4 thành vế không gọi model (muc-tieu) và Hỏi chi-nguoi về tập đo | fixed: dòng supersedes d-2 nguồn mot-loi (rút xoá luôn khoá provenance nên dấu thời gian không đếm được máy rút); d-4 tách thành dòng muc-tieu không gọi model + Hỏi-2 về tập đo và mẫu số (human-gate1); AC-4 và design ghi `tap_do` |
| P1 | evals | E4 không ghim việc giấu cả bài sinh ra tin; ma trận N2 là ca hoà, kỳ vọng đoán cách chonSoNguoi phá hoà | Bản cài đặt bỏ tin nhưng giữ bài, rutLienLac đọc lại số từ chữ bài của chính tin, N3 thành dung, tỉ lệ phồng mà E4 vẫn xanh | Số đặt trong chữ bài; chiều đỏ 'RO BAI CUA TIN'; ca một bài sinh hai tin; ma trận không hoà | fixed: AC-4 bỏ tin, bài và tin cùng bài; E4 đặt số trong chữ bài, N2 thành 3 X với 1 Y, N3 một bài sinh hai tin, thêm chiều đỏ 'RO BAI CUA TIN' và 'RO TIN CUNG BAI' |
| P1 | evals | E1–E3 dựng giá trị sống bằng tay theo khuôn bên đọc, không đi qua bên ghi thật | Bên ghi thật lưu dấu khác khuôn câu đọc giả định, trên máy thu câu đọc trả 0, so-qua-nguoi-dang thành chua-chay, ngưỡng SỐNG chết ngày đầu mà E1–E3 vẫn xanh | Dựng giá trị bằng hàm ghi thật; lý do rút qua lối 045; ca chỉ đọc DB máy thu song > 0 | fixed: E1–E3 ghi bằng ganSdtQuaNguoi, writeAssertions, lối hitl-thay và revert_enrichment của 045; thêm ca 'DO3-AC-1-THAT' chỉ đọc DB máy thu, song cả hai đường > 0 |
| P1 | contract | AC-4, AC-5 gắn kiểm ngược vào «lượt đầu tuần», không vào «tuần chưa có dòng»; không ca lượt đầu tuần lỗi | Lượt đầu tuần lỗi rồi rút giao dịch, lượt kế coi là lượt sau nên không chạy, mất một tuần trong timebox hai tuần → CHẾT | Điều kiện «tuần W chưa có dòng»; ca lỗi tiêm rồi lượt kế ghi; chiều đỏ 'MAT TUAN KHI LUOT DAU LOI' | fixed: AC-4, AC-5, design đổi điều kiện; E4 thêm ca lỗi tiêm ba lượt và chiều đỏ 'MAT TUAN KHI LUOT DAU LOI' |
| P1 | contract | AC-1 không có luật status fail; may_rut và nguoi_rut chồng nhau khi người rút | Màn tô đỏ tuỳ ý theo luật người làm chọn; một lần người rút đếm cả máy rút lẫn người rút, tín hiệu «làm giàu bị sửa/rút» sai nghĩa | Luật status xác định; chủ thể người rút không vào may_rut; ca hitl-thay; chiều đỏ 'NGUOI RUT DEM HAI LAN' | fixed: AC-1 fail chỉ khi bộ tự soát lệch (song hôm nay ≠ hôm qua + them − may_rut − nguoi_rut, hoặc tổng lát lệch); AC-2 người rút không vào may_rut; E1 kiểm status hai đường; E2 thêm phát biểu R hitl-thay và chiều đỏ 'NGUOI RUT DEM HAI LAN' |
