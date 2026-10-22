---
slug: ui-clean-b1-ops
at: 2026-10-22T22:56:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

# Phản biện context sạch — ui-clean-b1-ops

Một tác tử tươi đọc đúng 4 tệp (design, contract, evals, decisions); không có input thứ 5 (claim-scan rỗng — kho chưa có bài học xuyên feature).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Ba dòng sổ máy tự quyết mà căn cứ không đứng: mở rộng InsightGrid (dùng chung với Invest công khai, lối khác còn sống); Dialog cho form (câu trích không quyết form phải là modal); hoãn trạng thái sang B4 (câu trích không phải căn cứ hoãn) | Sửa InsightGrid lệch đầu bảng /yield, /listing công khai mà không eval nào nhìn Invest | Chuyển d-2, d-5 thành câu hỏi hoặc bỏ; sửa căn cứ d-9 | fixed: bỏ hẳn sửa InsightGrid (toolbar vào OpsSection, Skeleton thay isLoading) — dòng mới supersedes d-2; form thành Hỏi-5 supersedes d-5; d-9 thay bằng dòng trích kế hoạch Phần B giao việc cho B4 |
| P0 | evals | E12 không che tầng A; E13 che có điều kiện vào chữ "đã duyệt" không tồn tại | Ảnh chứa tên nguồn thật/tên nhóm Zalo bị commit lên GitHub | Che vô điều kiện + kiểm máy DOM không còn tên thật | fixed: E12, E13, E14 chạy mask-tier-a.js vô điều kiện, script tự kiểm innerText không còn tên lấy từ DB local, ghi masked: true; contract Notes thành câu khẳng định; code đánh dấu data-tier-a (đo ở E15). Hỏi-1 vẫn để Mạnh xác nhận |
| P1 | contract | Bảng trạng thái UX và mục Hành vi không có AC/eval | review-card quên disabled → bấm đúp gửi 2 POST; toggle 500 mà Switch vẫn bật | AC mới cho các ST-*; test component hoặc quét AST | fixed: thêm AC-11 + E15 (quét AST quan hệ: disabled gắn cờ đang gửi, nhánh lỗi hoàn giá trị + toast.error, Empty, Skeleton, Alert + Thử lại, chặn form thiếu trường, aria-label, data-tier-a). Không dựng test component vì app chưa có framework test (CLAUDE.md app) |
| P1 | evals | E6 đo chuỗi có mặt (có import toast) thay cho quan hệ "mọi thông báo qua toast" | Đổi tên setMsg thành setNotice + <p>{notice}</p> vẫn xanh | AST: state chuỗi render làm chữ JSX → đỏ; cặp đỏ setNotice | fixed: E6 (b)(c) đo quan hệ bằng AST, có danh sách cho phép kèm lý do (groupsError), selftest có cặp đỏ setNotice |
| P1 | evals | E7 so snapshot do chính bộ trích sinh — bộ trích sót kiểu gọi thì hai phía cùng sót | Lời gọi qua hàm phụ không được trích; E7 xanh dù body đổi | Ma trận viết tay từ design mục 4; snapshot ⊇ ma trận | fixed: E7 thêm b1-api-expected.json viết tay (từ design mục 4, trước code), kiểm snapshot ⊇ ma trận và sau-sửa = snapshot; selftest có ca hàm phụ |
