---
slug: nap-s09-quy-can-va-can-cao-tang
at: 2026-11-25T04:20:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ bỏ galleries và geolocation ghi nguồn mục tiêu, nhưng câu trích DATA-CONTRACT chỉ quyết bỏ URL ảnh; toạ độ căn không có trong danh sách tầng A của AGENTS.md — xếp toạ độ là việc của người | Mạnh duyệt tưởng việc bỏ toạ độ đã có lời chốt; kho có tiền lệ tầng A không ai ký | Tách thành dòng chỉ-người có khuyến nghị | human-gate1: dòng sổ bỏ URL ảnh giữ nguồn mục tiêu; toạ độ thành Hỏi-2 (khuyến nghị bỏ khỏi stg, raw giữ) |
| P1 | contract | Đường đo hứa 24 nút có bảng quỹ căn mà không eval đo số 24; định nghĩa nối chưa rõ; Given AC-5 thiếu lượt dựng DA42; dòng phụ AC-7 không có trong đặc tả UX | Thi công lọc nối hẹp, màn sau áp chỉ 1 nút; E7, E8 vẫn xanh trên fixture | Assert 24 · 6 · 10 trên DB thử đã dựng DA42 | fixed: AC-5 Given thêm dựng DA42 và assert 24 nối · 6 thẻ · 10 ngoài danh mục; design §5.3, §6 định nghĩa nối = project_links S09 noi gồm nút ứng viên; AC-7 dòng phụ ba số cộng bằng tổng |
| P1 | evals | Quét tầng A chỉ cấy vào hai khoá đã biết; không kiểm kê khoá viết trước; không quét stg thật sau E5 | Khoá thứ ba mang URL CDN lọt stg rồi lên màn, E2, E9 vẫn xanh | Ma trận khoá lá từ bản thu thật; quét stg thật tìm http và tên miền thật = 0 | fixed: AC-2, E2 thêm bảng kiểm kê viết trước rút từ bản thu thật, số assert bằng số khoá; AC-5, E5 thêm 0 dòng stg có http hay tên miền thật |
| P2 | evals | E10 không hỏi được vế «đúng nhánh @767c70c13, không sửa chữ» vì hội đồng không chạy lệnh | Người gộp sửa chữ DATA-CONTRACT, E10 vẫn PASS | Eval script git diff 767c70c13 rỗng | fixed: thêm E10b script s09_v16_dc; AC-10 ghi lệnh so |
| P2 | evals | Bản hỏng gọi trang từ 1 không có trang 0, du có thể rỗng thay vì false | 394 dự án bản hỏng hiện du rỗng, E3 xanh vì fixture có trang 0 | E5 assert du rỗng = 0 trên bản hỏng thật | fixed: design §5.2 du = false khi không có trang 0; AC-5, E5 assert 0 dòng du rỗng và du=false bằng số dự án bộ đếm |
