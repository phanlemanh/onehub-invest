---
slug: nhan-gia-va-luu-loi-mang
at: 2026-10-30T03:50:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Dấu phẩy theo sau đúng ba chữ số (4,350) mơ hồ như dấu chấm; design quyết «dấu phẩy luôn là thập phân» mà sổ không có dòng — lựa chọn chỉ người có bị máy chốt | Người quen ngăn nghìn bằng phẩy gõ 4,350 triệu (ý 4350 triệu) → lưu 4,35 triệu, thấp 1000 lần, không báo — đúng ngưỡng CHẾT | Dòng Hỏi cho phẩy + 3 chữ số; thêm 4,350 vào ma trận E2 + đối chứng đỏ | human-gate1: thành Hỏi-2 (khuyên từ chối); fixed: AC-2 và E2 thêm 4,350 + đối chứng 'DAU PHAY NGHIN LOT QUA' |
| P1 | evals | Ma trận E2 không có dạng nhiều dấu (4.350.000, 1.200,5, 4.350,5) | Bản cài neo regex cả chuỗi để lọt 4.350.000 xuống bộ đọc cũ mà E2 vẫn xanh | Thêm các ca nhiều dấu, thông điệp ghim | fixed: AC-2 thêm vế nhiều dấu → lỗi «phải là số»; E2 thêm ba ca |
| P1 | design, contract | «Chưa lưu» khẳng định sai khi lỗi mạng xảy ra sau commit; «Lưu lại» khi đó nhận 409 của chính mình và kẹt | Mạng chập sau commit → báo Chưa lưu, bấm Lưu lại → 409 «đã có người gắn» cho tin của mình, không sang tin kế | Ca 409 của chính mình qua route thật, đếm dòng = 1 lượt | fixed: Alert đổi «Không chắc đã lưu»; 409 của chính mình (hằng DA_GAN_CUA_TOI) → da-luu → tin kế; AC-3 và E3 thêm ca |
| P1 | evals | E3 dùng phản hồi tự dựng, không khứ hồi route thật mà vẫn gắn backend-effect | Route thật trả khuôn khác → lỗi theo ô xếp thành lỗi máy chủ trên màn thật, E3 vẫn xanh | Lấy Response từ route thật trên lược đồ tạm cho 200, 400, 409 | fixed: E3 dùng Response của route thật cho 200/400/409 (người khác và chính mình); chỉ 500 và TypeError giả lập |
| P1 | contract | Đường đo đọc tay mẫu 20 tin không chứng minh được 0 nhãn lệch bậc | 2–3 nhãn lệch, mẫu 20 không trúng → chấm SỐNG khi thật là CHẾT | Quét toàn bộ nhãn giá bằng lệnh xác định, đọc tay dòng bị cờ | fixed: Đường đo dùng câu SQL quét toàn lát theo dải giá 300 triệu – 100 tỷ, đọc tay mọi dòng bị cờ; khai giới hạn lệch nhỏ hơn bậc |
