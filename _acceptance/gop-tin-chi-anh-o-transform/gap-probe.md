---
slug: gop-tin-chi-anh-o-transform
at: 2026-10-30T06:10:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ «gộp ở bảng media» ghi máy quyết (một lối) nhưng lối gắn vào post_ids chưa chết — sửa được năm chỗ đọc; «ngoài vùng hàng» không phải luật đã ký; đánh đổi người dùng thấy (trang dòng chảy vẫn đếm bài chỉ-ảnh là không đọc được, con số L06) không có dòng descope | Mạnh duyệt vì tưởng máy đã loại lối kia theo luật, sau gộp thấy con số L06 không đổi, hàng phải mở lại | Chuyển thành câu Hỏi chi-nguoi có khuyến nghị và lối khác; thêm dòng descope về trang dòng chảy | human-gate1: dòng sổ mới Hỏi-2 (chi-nguoi, supersedes dòng cũ), dòng descope «không đổi trang dòng chảy và n_reposts», design ghi lối (a) thành lối người chọn kèm giá; Out of scope nêu dòng chảy |
| P1 | evals | Ngưỡng ≥ 50% của ô cơ hội không có đường đo; «trước» của E6 chưa định nghĩa; bản chép DB thử không ghim độ lớn | Bảng media trên DB thử cũ hay rỗng làm «sau > trước» xanh dễ; Cổng Giá trị đọc 47,7% là TRƯỢT mà không eval nào báo | Chạy cây cũ rồi cây mới trong cùng giao dịch; kiểm số offer; so ngưỡng đọc từ ô cơ hội | fixed: AC-6/E6 chạy transform-media bằng bản nền ghim rồi bằng cây trong cùng giao dịch ROLLBACK, số offer S03 < 500 → exit 1, tỉ lệ sau ≥ ngưỡng đọc từ opportunity.md (không viết cứng) |
| P1 | contract | AC-4, đột biến E4, SQL của AC-6 viết cứng theo khuyến nghị Hỏi-1; đột biến E4 không dựng được trong gop-anh | Mạnh chọn lối khác thì bản đúng chính là đột biến của E4, E4 đỏ, hợp đồng phải sửa sau chữ ký | AC-4 hai nhánh; dời đột biến sang transform-media | fixed: AC-4 ghi Then của lối khác và cam kết sửa AC-4/E4/E6 trước khi duyệt nếu Mạnh chọn lối khác (Cổng Phạm vi dừng chờ Hỏi-1 nên sửa trước chữ ký); đột biến E4 dời sang bản sao transform-media lọc bài chữ chỉ còn bài thuộc offer |
| P1 | evals | Quy tắc gần nhất không đơn điệu theo thời gian; không ca nào kiểm gán lại khi có bài chữ mới gần hơn và gỡ dòng ở offer cũ | Ảnh vào offer A, bài chữ B gần hơn tới sau, lượt kế gán sang B mà dòng cũ ở A còn — ảnh căn này trên thẻ căn khác | Ca GA-AC-3b chèn bài chữ gần hơn, lượt ba, kiểm offer cũ 0 dòng; ca đỏ bỏ bước gỡ | fixed: AC-3 thêm vế lượt ba (offer khác và biến thể không offer); E3 thêm ca GA-AC-3b và ca đỏ bỏ bước xoá dòng không còn sinh; design ghi transform-media dựng lại trọn nguồn và xoá dòng không còn sinh |
| P2 | evals | Cặp ảnh→offer của E6 chưa rõ cách truy dòng media về bài nguồn, ngày mẫu chưa ghim, luật lọc/hoà của SQL độc lập chưa nói, so một hay hai chiều | Ảnh trùng URL gộp mất dòng, SQL đếm bài không cột ảnh → E6 đỏ oan; ngày mẫu ít bài làm so vô nghĩa | Ghim ngày, lọc bài thử và bài không cột ảnh, luật hoà, so hai chiều, nói cách truy dòng media | fixed: ngày mẫu 2026-10-28 (giờ VN); SQL bỏ bài thử và bài không cột ảnh, hoà → bài chữ đứng sau; dòng media truy về post_id qua originating_system_resource_record_key, bài mà mọi ảnh đã có ở offer theo URL/tệp tính là đã gộp; so hai chiều, in từng cặp lệch |
