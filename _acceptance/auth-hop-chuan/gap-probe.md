---
slug: auth-hop-chuan
at: 2026-10-26T09:52:00Z
verdict: findings
p0: 2
p1: 1
p2: 2
---
# Gap-probe — auth-hop-chuan

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + evals | Dòng sổ chỉ đo đầu-cuối luồng đăng nhập ghi mot-loi, lối đăng ký đầu-cuối còn sống; E5 không đo action và cảnh báo lỗi của form đăng ký [ops-review-khung-hang-cho#F2] | Sửa register-form lỡ rơi action hay Alert lỗi mà E5, E6 vẫn xanh | Smoke POST /register email dùng-một-lần + xoá; E5 đo action + Alert | human-gate1: Hỏi-3 (khuyên thêm smoke đăng ký có dọn tài khoản); fixed: E5 thêm action + Alert lỗi đăng ký |
| P0 | design + contract | Dòng sổ cỡ chữ ghi muc-tieu nhưng câu trích không quyết cỡ đích; vế FrameTitle không trích luật [listing-detail-product-detail-5#F1] | Tiêu đề nhỏ đi mà không ai chọn | Tách cỡ hero thành câu hỏi, FrameTitle trích AGENTS.md | fixed: dòng sổ mới (supersedes) — FrameTitle trích «never resize FrameTitle or CardTitle»; human-gate1: Hỏi-2 cỡ tiêu đề đăng ký |
| P1 | contract + evals | AC-3/E3 chỉ soi h1 + FrameTitle; E7 chỉ xoá 3 khoá đặt tên | Còn text-[..] ở tệp khác của nhóm mà mọi eval xanh | Quét cỡ tuỳ ý toàn nhóm + 0 khoá tiền tố (auth) | fixed: E3 quét /(text|leading|tracking)-\[/ mọi tệp + chiều đỏ; E7 0 khoá tiền tố + 7 vi phạm viết trước |
| P2 | evals | E3 ghim chuỗi text-sm | Cỡ mặc định Frame khác thì đỏ mãi hoặc bị hợp thức hoá | So với FrameTitle trần cùng ca | fixed: E3 so tập lớp với FrameTitle trần |
| P2 | evals | Ui-check không chứng chế độ tối thật áp, bỏ trạng thái lỗi | Ảnh tối vẫn sáng mà người chấm ghi đạt | Ghi className + màu nền ở bước tối; chụp /login?error | fixed: E9 thêm bước chứng tối + chụp lỗi đăng nhập; lỗi dựng trang (error.tsx) giữ đo jsdom |
