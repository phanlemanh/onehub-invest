---
slug: api-surface-anh-vai-ops
at: 2026-10-30T10:59:06Z
verdict: findings
p0: 0
p1: 1
p2: 4
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals E4 · contract AC-3 | AC-3 hứa hành vi (chặn bằng 404, chuyển nguyên phiên) mà E4 chỉ dò chuỗi mã; không ca nào gọi handler GET của route | Route chặn bằng 403 hay chuyển serveZaloMedia(req, null) vẫn qua E4 | Ca ASO-AC-3b gọi GET của route với phiên tiêm theo ma trận 5 vai × snapshot, ghim 404 trùng byte lõi, chiều đỏ 403 | fixed: thêm E7 (backend-effect) ca ASO-AC-3b — bản chép route chỉ thay dòng import getSessionUser, ma trận 5 vai, 404 trùng thân lõi, chiều đỏ 403 ghim thông điệp; AC-3 thêm vế hành vi (cross-layer) |
| P2 | evals E1, E4 | Đo chữ có mặt thay vì quan hệ chế độ → vai; vế âm «chỉ admin.» đánh trúng câu đúng | Note đảo cặp vẫn xanh; docstring đúng «?path= chỉ admin.» bị đỏ oan | Ghim quan hệ trong cùng mệnh đề; vế âm ghim nguyên dòng cũ | fixed: E1 ghim ba quan hệ trong cùng mệnh đề + chiều đỏ đảo cặp; E4 vế âm là nguyên văn dòng docstring cũ, vế dương là hai quan hệ |
| P2 | evals E3 | E3 dùng chung lệnh với E1/E2/E4, không chứng bộ lõi thật sự chạy | Lệnh chỉ chạy tệp mới, E3 xanh suông | Lệnh riêng chạy đích danh zalo-media.test.tsx | fixed: thêm khoá executors.test.zalo_media_core chạy đích danh tests/zalo-media.test.tsx; api_surface_ops chỉ chạy tệp mới |
| P2 | evals E6 · AC-5 | Biểu thức §6 đổi mà không có chiều đỏ cho phần route | Biểu thức lỏng để route đọc tệp vẫn qua | Hai chiều đỏ: route có readFile, route gọi serveZaloMedia(req) không phiên | fixed: E6 ghim hai dòng chiều đỏ mới của §6 (route có readFile → báo; serveZaloMedia(req) không phiên → báo) cùng chiều đỏ isAdmin cũ |
| P2 | decisions d-2, d-3 | d-3 ghi mục-tiêu cho một đánh đổi (ops-session kèm note hay chế độ thứ sáu) mà câu trích chỉ cho phép, không quyết | Cổng Phạm vi không thấy đánh đổi; sổ khai viewer «được gọi» route ảnh nội dung tin | Ghi đúng loại căn cứ: chi-nguoi kèm khuyến nghị và giá | fixed: dòng mới thay d-3 thành Hỏi-1 (chi-nguoi, khuyến nghị ops-session kèm note, lối khác chế độ thứ sáu kèm giá); dòng mới thay d-2 nêu ràng buộc giết từng chế độ có sẵn (admin hẹp hơn mã, ops buộc nhánh bearer) |
