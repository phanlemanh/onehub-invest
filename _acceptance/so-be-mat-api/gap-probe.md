---
slug: so-be-mat-api
at: 2026-10-23T10:52:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design + sổ d-3 + E8/E9 | Lối danh sách cho phép không được chứng là chết; fixture QR là tên gõ tay theo giả định bên đọc, không rút từ bên viết. Cùng dạng [ui-clean-b1-ops#F1] | Bên viết đặt tên QR khác mẫu regex → admin vẫn tải QR mà E8/E9 xanh | Rút tên QR từ bên viết; nêu vì sao danh sách cho phép chết | fixed: tên QR do app đặt ở zalo-admin.ts qrFile → tách hằng LOGIN_QR_PREFIX + isLoginQrFile/loginQrPath dùng chung; test dựng tệp bằng loginQrPath (round-trip); dòng sổ mới supersedes d-3 nêu vì sao danh sách cho phép chết |
| P1 | evals E2–E4 + design §2 + Coverage | Ma trận đột biến không toàn phần, design và E4 lệch nhau, Coverage nhận ô đơn vị không có eval | Nhánh ops-session hay session-or-noop luôn đạt mà E1–E4 vẫn xanh | Bảng đột biến viết trước, mỗi chế độ và mỗi điều kiện một bản ghim thông điệp | fixed: bảng M1–M14 trong design §2, E2/E3/E4 chép đúng bảng; Coverage sửa đúng lớp có eval |
| P1 | evals E3 + design §2 | Chỉ quét import một tầng, đo chuỗi trong khi lời hứa là quan hệ đọc bảng | Route public import @/lib/a → ./b truy vấn sale_offers mà kiểm vẫn đạt | Bao đóng import bắc cầu + hai bản đột biến tầng 1, tầng 2 | fixed: design §2 định nghĩa bao đóng bắc cầu cả @/lib lẫn tương đối; M5, M6 trong bảng và E3 |
| P1 | design §5 + AC-6 | Không nói ai đang xem QR hợp lệ qua zalo-media. Cùng dạng [ui-clean-b3-charts#F1] | Luồng đăng nhập Zalo ở /ops dùng zalo-media → 403 → không đăng nhập lại được | Liệt kê người gọi QR; câu hỏi nếu có đánh đổi | fixed: tra mã — luồng /ops/zalo/login đọc QR bằng readFile trong zalo-admin.ts readQr rồi trả base64, không qua zalo-media; ghi căn cứ vào design §5 và AC-6 (luồng đăng nhập không đổi) — không phát sinh câu hỏi |
| P2 | Đường đo + E5/E7/E9 | Không có --chi-doc cho smoke mới; E5 không ghim thân 401; E9 thiếu ca symlink; E7 đếm tổng bảng dùng chung | Không đo được prod; thân 401 khác vẫn đạt; beacon của phiên thật làm lệch đếm | --chi-doc, ghim thân, thêm symlink, lọc theo user_id | fixed: design §7 + Đường đo có --chi-doc; E5 ghim thân 401; E9 thêm dòng symlink; E7 lọc theo user_id của user tạm |
