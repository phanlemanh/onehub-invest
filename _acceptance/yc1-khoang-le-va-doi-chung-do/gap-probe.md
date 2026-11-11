---
slug: yc1-khoang-le-va-doi-chung-do
at: 2026-11-11T14:20:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E3, E4 dùng bộ đọc giả viết tay đúng khuôn bên đọc, không round-trip từ bộ đọc thật | Fixture dùng mã dịch vụ tự đặt, nhánh đỏ bật trong test mà không bật trên dữ liệu thật | Dựng bài bằng docNganSach và docDichVu thật rồi đột biến đầu ra | fixed: AC-3 và E3 dựng danh sách bằng bộ đọc thật trên chữ thật, đột biến trên đầu ra thật, kiểm kind bài thuê là KIND.rent_lt |
| P1 | evals | E2 không đòi tổng và số có ngân sách gốc lớn hơn 0, không chứng bộ đọc mới khác bộ gốc | DB rỗng hoặc bộ mới trùng bộ gốc thì mọi số 0 và E2 vẫn xanh | Đòi n lớn hơn 0, a lớn hơn 0, in băm hai bộ đọc và đòi khác nhau | fixed: AC-2 và E2 đòi n, a lớn hơn 0 và dòng băm gốc khác băm mới; d lớn hơn hoặc bằng 1 không đòi vì DB có thể không có bài khoảng lẻ rời |
| P1 | contract | Coverage nói bốn dấu nối mà liệt ba, bảng chỉ bốn ô | Người ký tin tám ô đã đo | Liệt đủ dấu nối mà NOI nhận nhân hai đơn vị | fixed: ma trận sáu dấu nối nhân hai đơn vị bằng 12 ô sinh từ danh sách, E1 đếm số ô bằng 14 |
| P2 | evals | E1 không ghim số ca cũ và mới, không chứng ca cũ không đổi | Sửa đích một ca cũ rồi cập nhật tổng ghim thì hồi quy lọt | Ghim 34 thành 48 và băm dòng ca cũ | fixed: E1 ghim TONG_CA 48 và băm 34 dòng ca cũ bằng hằng lấy từ main 7e7b7073, chiều đỏ BANG CA CU DOI |
| P2 | decisions | Dòng gộp hai mục trích câu chỉ quyết Ngoài-3 | Cổng đọc như Mạnh đã chốt gộp | Nguồn đúng cho lựa chọn gộp | fixed: dòng mới thay dòng 3, nguồn một-lối (hai hồ sơ cần hai lượt s4 và sửa cùng tệp) |
