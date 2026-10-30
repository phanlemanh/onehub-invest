---
slug: bang-yeu-cau
at: 2026-10-30T10:30:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ ghi máy quyết (một lối) cho bảng ánh xạ chữ sang loại hình, nhưng lối «để trống» chưa chết và bảng là nghĩa sản phẩm; dự phòng mua/thuê theo chữ và ngưỡng chặn ngân sách không có dòng sổ; design vẫn đọc phát biểu loại hình trước dù bài Yêu cầu không có | Cổng duyệt bảng ánh xạ như quyết định kỹ thuật; hàng đo cầu đếm theo loại hình Mạnh chưa chọn; E3 vẫn xanh vì ma trận viết theo luật máy | Hỏi-3 nguồn chỉ-người supersedes dòng cũ; ma trận mỗi mục bảng ánh xạ một dòng + dòng «nhà» đứng một mình | fixed: Hỏi-3 (chỉ người) supersedes d-5, gồm bảng ánh xạ + dự phòng mua/thuê; ngưỡng chặn ngân sách dùng lại lyDoGiaPhiLy (dòng sổ mục tiêu, bỏ «dưới 500 nghìn»); design ghi rõ phát biểu loại hình hôm nay không có, người gắn sau thì thắng; AC-3/E3 mỗi mục một dòng |
| P1 | contract | Trục vòng đời chỉ chạy lại cùng tập bài: thiếu bài đăng lại tới ở lượt sau, một bài trong nhóm đổi ý; chưa nói transform xét toàn bộ stg hay lô mới; câu trích bỏ coverage-scan không quyết | Đêm 2 bài đăng lại ghi đè post_ids, first_seen nhảy; transform theo lô thì Yêu cầu ngoài lô bị nghỉ; post_ids không co khi một bài đổi ý | YC-AC-5b ba lượt với bước Kev thật + ca đỏ upsert ghi đè post_ids | fixed: AC-5/E5 thêm YC-AC-5b (lượt hai cộng dồn, lượt ba co lại qua bước Kev thật, ca đỏ ghi đè post_ids); design: mỗi lượt xét toàn bộ bài thật của stg, post_ids dựng lại tập đầy đủ; dòng bỏ coverage-scan tách riêng, nguồn một-lối |
| P1 | evals | E9 so hai số đếm thay cho quan hệ bài ↔ Yêu cầu; SQL «độc lập» phải chép lại cách chuẩn hoá chữ; bài không người gửi lẫn SĐT có thể bị gom chéo | Tách nhóm X và nhập nhóm Y vẫn bằng số; SQL khác chuẩn hoá đỏ giả | So tập: 0 bài vắng, 0 bài lặp; mỗi nhóm khớp đúng một dòng; ma trận cho bài không người gửi | fixed: AC-9/E9 đo quan hệ (0 bài vắng, 0 bài lặp; mỗi Yêu cầu một bộ nguồn · người · chữ, không hai Yêu cầu chung bộ); design ghi luật chuẩn hoá chữ; bài không người gửi lẫn SĐT không gom (khoá gồm post_id), AC-5/E5 có dòng ấy |
| P1 | contract | AC-4 đòi bài gate down không thành Yêu cầu nhưng design không có bộ lọc gate; «tầm X» rơi vào khe giữa trần và Hỏi-1 | Làm theo design thì E4 đỏ hoặc thêm bộ lọc không ai duyệt; Mạnh chọn lối khác Hỏi-1 nhưng «tầm» vẫn theo trần | Design nói rõ điều kiện gate; Hỏi-1 ghi phạm vi các dạng; ma trận mỗi dạng một dòng | fixed: design + AC-4 nói rõ bài gate down không có phát biểu (PL5 không ghi) nên không cần bộ lọc; Hỏi-1 mới supersedes, liệt «tầm / khoảng / tài chính / ngân sách X» thuộc Hỏi-1, «tầm dưới X» luôn là trần; E3 mỗi dạng một dòng |
| P1 | contract | Ngưỡng SỐNG của ô viết «số bài» trong khi AC-9 đếm nhóm; «tiêu chí đọc được ở bài có viết» đo bằng tỉ lệ trên mọi Yêu cầu, không phải trên bài có viết | Bộ đọc ngân sách bỏ sót «8tr», «8 củ» mà vẫn qua; chọn lối khác Hỏi-2 thì phải viết lại AC-5, E9 | Dòng sổ sửa ngưỡng theo nhóm; tỉ lệ trên số bài có dấu hiệu chữ; ngưỡng hoặc descope có giá | fixed: dòng sổ sửa ngưỡng SỐNG theo nhóm đăng lại (Hỏi-2), ô cơ hội viết lại; AC-9/E9 in số bài có dấu hiệu chữ và tỉ lệ đọc ra trên mẫu số ấy; không đặt ngưỡng tỉ lệ — dòng sổ ghi giá (người đọc tỉ lệ ở Cổng Bằng chứng); đơn vị «tr / củ» vào ma trận E3 |
