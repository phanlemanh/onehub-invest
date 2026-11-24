---
slug: tran-tong-luot-dem-va-tran-doc-gop
at: 2026-11-24T01:11:15Z
verdict: findings
p0: 0
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Đường đo và AC-9 chỉ đo lượt 00:00 đầu tiên sau áp — đêm biến 32400, không đại diện cho trần mặc định 21600 ở lại lâu dài | Đêm 24→25 ĐẠT với đọc gộp 26700 s; từ đêm 25→26 trần 21600 lại cắt enrich mà hồ sơ đã đóng | kiem-sau.sh chạy thêm trên lượt 00:00 đầu tiên trần 21600, ghi cạnh số chạy thử; ca mẫu 32400 không được tính thay | fixed: kiem-sau.sh thêm cờ --tran (đòi đúng trần của lượt), README bước 5 kiểm HAI sáng (25/11 không cờ, 26/11 --tran 21600), ca mẫu luot-32400-dat với --tran 21600 → KHÔNG ĐẠT; AC-9, E9 sửa lời |
| P1 | evals | Ba log mẫu E9 viết tay, một lượt mỗi tệp, đo chuỗi-có-mặt thay vì quan hệ «enrich-run thuộc đúng lượt 00:00 ấy» | Log launchd nối nhiều lượt: lượt mới bị cắt, enrich-run của lượt khác vẫn làm bộ kiểm báo ĐẠT sai; khuôn viết tay lệch khuôn thật | Rút mẫu từ đầu ra thật của bản sao script; thêm mẫu nhiều lượt; phá ràng buộc cùng lượt phải đỏ | fixed: bảy log mẫu rút từ đầu ra thật của bản sao script (đường tạm thay <ROOT>, hai chỗ chỉnh tay có tên trong kiem.sh); kiem-sau.sh chỉ xét đoạn từ dòng khai lượt 00:00 mới nhất tới dòng khai kế; hai mẫu nhiều lượt; phá giới hạn đoạn → ca nhieu-luot-dat-roi-nhanh-cat đỏ (đo 24/11) |
| P2 | evals | E4 đo quan hệ trên bước giả 0 giây; giả định thật (bước trước đọc gộp ≤ trần nạp + 600, bước sau đọc gộp + enrich ≤ 3000) không có phép đo | Máy thu: xep-hang-gia hay enrich vượt khoản chừa, enrich vẫn bị cắt mà E4 xanh | Lấy thời lượng JOB STEP của lượt thật, đối chiếu hai khoản chừa | fixed: kiem-sau.sh cộng giây JOB STEP trước và sau bước đọc gộp trong đúng lượt, KHÔNG ĐẠT khi vượt trần nạp + 600 hay 3000 (ca mẫu luot-vuot-cho-enrich 3100 s → KHÔNG ĐẠT; nới chừa → ca đỏ); số thật đo ở lệnh kiểm sau hai sáng, ghi cạnh số chạy thử |
