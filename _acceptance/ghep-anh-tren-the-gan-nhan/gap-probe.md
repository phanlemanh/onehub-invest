---
slug: ghep-anh-tren-the-gan-nhan
at: 2026-11-05T08:50:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Khuôn `ghep` không định nghĩa bài có chữ không cụm (176 bài) | Bên ghi đặt `chu_ref` là chính bài, `anh_refs` rỗng; thẻ hiện «Ghép suy ra · 0 ảnh»; seed chèn tay nên phép đo vẫn xanh | Khai giá trị, thêm loại thứ sáu, seed sinh từ bên ghi thật | fixed: bảng bốn loại trong design, NULL cho loại này; AC-1, AC-3, E1, E3, E4, E11 |
| P1 | evals | Phép đo mù E8 không có đối chứng dương trên phản hồi; không lớp nào đo mã bài trong phản hồi HTTP | Curl nhận trang đăng nhập nên 0 mồi, E8 xanh | Status 200, chứa chữ seed, đếm mồi và mã bài bằng 0 | fixed: E8 bước 1, AC-3 |
| P1 | design | `so_chu_gan` theo bài ảnh, cờ hiện trên thẻ cả cụm, không có luật gộp | Dòng đại diện N=1, dòng N=2 bị ẩn, thẻ mất cờ đúng ở ca sai rõ | N của thẻ là lớn nhất trên cụm, đo trên đơn vị thật | fixed: design, AC-1, E11 'ok cum lech co co' |
| P1 | evals | Căn cứ mặc định, Ghép sai, tiến độ, ảnh lỗi giữa cụm không có bước trên màn | Biểu mẫu không có Ghép sai mà route vẫn xanh; tiến độ kẹt | Thêm bước ui-check | fixed: E5 ba bước, E8 một bước, AC-4 |
| P1 | contract | Phần chạm DB thật không có câu hỏi; d-2 ghi một lối, không khó đảo | Mạnh ký mà không biết chữ ký kéo theo đổi bảng thật | Hỏi-4 riêng, sửa căn cứ d-2 | fixed: Hỏi-4 kho_dao true, dòng mới thay d-2 nêu lối đã xét |
