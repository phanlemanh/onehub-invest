---
slug: tach-o-duong-dau-vao-ban
at: 2026-11-15T02:08:09Z
verdict: findings
p0: 0
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Probe CD-AC-8 chỉ chọn giá trị có cụm ở đầu chuỗi nên không thấy L2, L3; giá của lựa chọn C trong Hỏi-1 nói như thể mọi lớp mới đều lộ | Người chọn C vì tin /ops-check sẽ báo, trong khi một dạng L3 mới vẫn ra ✅ | Probe chọn theo từng lớp, đếm theo lớp, đột biến L3 phải đỏ; sửa giá trong Hỏi-1 | fixed: thêm ca CD-AC-12 probe lớp (L1–L5, cụm ở mọi vị trí, đếm tối thiểu L3 ≥ 30, L2 ≥ 1, đột biến bỏ L3 đỏ) vào AC-7/E7; giá của C trong design §4 nói rõ lớp chưa đặt tên không probe nào thấy |
| P1 | evals | CD-AC-11 kiểm audit-all.sh bằng chuỗi có mặt, không chạy nhánh ✅/❌ | Mục chạy sai thư mục hay ❌ không vào bộ đếm FAIL mà ca vẫn xanh | Chạy mục ở hai nhánh, nhánh ❌ phải thoát 1 và vào fail | fixed: mục tách thành scripts/o-duong-that.sh có chế độ đột biến O_DUONG_DOT_BIEN=1; CD-AC-11 chạy cả hai nhánh (exit 0 có ✅ và lớp, exit 1 có ❌ và giá trị lệch) và khớp dòng gọi trong nhánh pass/fail của audit-all; phần /ops-check đưa FAIL vào báo cáo dựa trên bước 2 sẵn có của skill (không đo máy) |
| P2 | contract/evals | CD-AC-10 kiểm theo tên bảng; chưa đo nền các tệp suite nhắc hai bảng | Tệp suite tự ghi fixture vào review_queue làm ca đỏ oan, hoặc đọc qua helper thì lọt | Đo nền, đổi tiêu chí, danh sách cho phép có lý do | fixed: đo nền — 13 tệp suite nhắc hai bảng (phần lớn ghi fixture trên DB của lượt) và 4 ca probe dữ liệu thật khác; CD-AC-10 nay đếm dấu probe (t.skip «cần DB máy thu») theo danh sách nợ {khong-dau 1, luat 2, khác 0}, có đối chứng vượt nợ; dời bốn ca là Hỏi-2 |
