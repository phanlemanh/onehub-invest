---
slug: go-tai-khoan-kiem-cfg-truoc-logout
at: 2026-10-25T03:40:30Z
verdict: findings
p0: 0
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E1 ghi «5 dòng ma trận» nhưng không neo vào tập lớp bộ kiểm thật sinh ra; nhãn kỳ vọng viết tay | Bộ kiểm có lớp thứ sáu thì Gate 1 ký ma trận «toàn phần» thiếu một lớp; thông điệp thật khác nhãn viết tay thì E1 đỏ dù AC-1 đạt | Tập nhãn 5 dòng bằng tập lớp của một fixture gộp; thông điệp 400 so bằng đầu ra zaloConfigViolations của bản sau khi gỡ | fixed: E1 expected + GC-AC-1 so thông điệp bằng đầu ra bộ kiểm thật và kiểm tập lớp bằng fixture gộp |
| P1 | contract | Ngưỡng SỐNG/CHẾT ở opportunity.md chưa nối với eval; timebox trống | CHẾT không bao giờ tuyên được; Gate 1 ký ngưỡng không có đường đo | Mục «Đường đo» nối SỐNG với E1/E4, E2/E3; CHẾT = dòng E1 có lệnh logout | fixed: thêm mục «Đường đo» vào contract, timebox = vòng này (tối đa 3 lượt chấm S4) |
| P2 | evals | E1–E5 chấm bằng exit 0 của cả bộ app npm test, không kiểm ca GC-AC-n thật sự chạy | Ca bị đổi tên hay skip mà cả bộ vẫn exit 0 | Đọc reporter, assert từng ca GC-AC-n passed | rejected: lượt chấm S4 đọc đầu ra reporter theo tên ca trong expected (khuôn kit của mọi hồ sơ test.app_ui); không dựng thêm rào |
| P2 | evals | Bản sao đột biến của E4 phát lệnh logout mà không được rào trước khi gọi | Bản sao phân giải đường khác rồi gọi logout vào openclaw thật | Rào zaloAdminPaths() của bản sao trước khi gọi | fixed: E4 expected + GC-AC-4 rào bản sao trước khi gọi |
