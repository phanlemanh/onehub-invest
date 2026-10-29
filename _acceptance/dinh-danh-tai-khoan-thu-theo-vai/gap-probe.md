---
slug: dinh-danh-tai-khoan-thu-theo-vai
at: 2026-10-29T10:30:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Ngưỡng vai (Vận hành trở lên) ghi là máy quyết, trích mặc định an toàn của giám sát; Mạnh mới chọn «mở hàng riêng», chưa chọn ngưỡng; vế «cloud không mang định danh» lệch với việc mã tài khoản vẫn lên cloud cho ops | Mạnh tưởng ngưỡng đã có người chốt, chỉ duyệt Hỏi-1; sau ký mới thấy mã tài khoản vẫn ở bản tin và API cloud | Thay dòng máy quyết bằng một câu chỉ-người (Hỏi-2) có khuyến nghị, lối khác, supersedes | fixed: thêm Hỏi-2 (supersedes d-20261029T094042Z-2), nói rõ mã tài khoản vẫn lên cloud cho ops theo quyết định ở soat-tang-a-moi-duong-len-cloud |
| P1 | evals | Ô bearer ở E3/E4 có thể giả bằng tiêm người null, không đi qua lớp xác thực bearer thật | Lớp xác thực ánh bearer sang một người có vai; E1/E3/E4 vẫn xanh vì tiêm null; máy giữ bearer vẫn nhận mã tài khoản | Ô bearer bắt buộc là Request có header Authorization thật qua kiemQuyen; đối chứng coi bearer như vai ops thì đỏ | fixed: E3 và E4 ghim header Authorization thật qua kiemQuyen, thêm đối chứng che theo actor |
| P1 | contract | Trục B thiếu ô trang /ops/collections ở cloud; dữ liệu bản tin có thể vào props client của viewer | Viewer mở trang trên cloud, payload RSC còn mã tài khoản và hồ sơ; không eval nào dựng trang ở VERCEL=1 | Thêm ô trang cloud: dựng thân trang VERCEL=1 với viewer, props không khớp mã cấy; đối chứng ops | fixed: AC-5 thêm vế chế độ cloud, E5 thêm ca VERCEL=1, Trục B thêm ô trang cloud |
| P1 | design | Hỏi-1 không nói về các dòng ops_heartbeat cũ đã mang mã nhóm | Mạnh chọn A tưởng mã nhóm hết trên cloud, nhưng dòng cũ còn giữ | Thêm vế xoá/giữ dòng cũ vào Hỏi-1 | rejected: ops_heartbeat chỉ có một dòng id 'primary', ingest ghi đè bằng ON CONFLICT mỗi lượt đẩy (~15 phút) — sau lượt đẩy đầu tiên của bản mới không còn mã nhóm cũ trên cloud |
| P2 | evals | E4 không cấy và không quét hồ sơ (profile) ở bề mặt API cloud | Nhánh cloud quên che profile, E4 vẫn xanh | Cấy 'dd-prof-1', quét /dd-(acc,prof,grp)-/, assert profile null, đối chứng bỏ dòng che profile | fixed: E4 cấy và quét profile, thêm đối chứng 'profile' |
