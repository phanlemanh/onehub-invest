---
slug: s03-jpg-path-fallback
at: 2026-11-25T02:30:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ngưỡng bài mới lỗi 400 /jpg/ bằng 0 va với AC-3 — ảnh chia lại từ link cũ chết cả hai biến thể vẫn giữ 400 | kiem-sau báo KHÔNG ĐẠT dù bản vá chạy đúng; nới tay thì bản thiếu thử lại cũng lọt | Đích là tỉ lệ có ngưỡng; mẫu cả hai biến thể lỗi | fixed: đích thành ảnh link /jpg/ lỗi 400 ≤ 5% (24/11 ≈ 32%) ở contract, opportunity, README, kiem-sau (NGUONG_400); mẫu duoi-tran.json (1/25 = 4%) → ĐẠT, con-jpg-400.json (50%) → KHÔNG ĐẠT; round-trip bản ZC15 → 100% > 5% (E8) |
| P1 | contract | Kiểm host cuối sau chuyển hướng cho lần thử lại không có AC hay eval | Lần thử lại bỏ kiểm host, ảnh từ host lạ vào snapshot bất biến, E1–E8 vẫn xanh | AC-7 + ca CDN giả 302 URL thay thế ra host ngoài danh sách | fixed: AC-7 + ca test «URL thay thế chuyển hướng ra ngoài danh sách thì không lưu» (không tệp, entry http-400, không thư mục media); đối chứng dương là ca 2511-3 (E9) |
| P1 | evals | Phép tính --ty-le không có eval; ngưỡng khoảng 8% không cứng, lẫn thước làn thu với thước DB máy thu | --ty-le lấy mẫu số sai hay lệch múi giờ, ra số dưới ngưỡng trong khi thật cao hơn | --ty-le trên mẫu biết đáp án; ngưỡng số cứng cùng thước | fixed: kiem-sau --ty-le --tu-tep, mẫu ty-le.json (10 bài có ảnh, 2 mất hết, 3 bài rỗng ngoài mẫu số, một bài 16:59Z sang ngày trước) → đòi đúng 20,0% (E8); contract ghi ≤ 8,0% đo cùng thước với mốc 27,5% |
| P2 | evals | Không ca timeout trên link /jpg/ | Điều kiện thử lại viết thành mọi lỗi trừ 404 thì timeout sinh thêm yêu cầu, E3 vẫn xanh | Ca CDN giả treo /jpg/hang.jpg, /hang.jpg nhận 0 yêu cầu | fixed: thêm vào ca ZC16 thứ hai (E3) |
| P2 | evals | Chiều đỏ E1–E3 chỉ đo tay một lần | Ai đó nới assert, ca xanh với cả hai cách cài | Đưa ba đột biến vào lệnh eval theo mẫu TU-THU | fixed: probes/tu-thu.sh chạy ba đột biến (bỏ thử lại, băm url gốc, thử mọi lỗi), đòi đỏ đúng thông điệp ghim; nối vào đuôi lệnh zc16_media_test |
