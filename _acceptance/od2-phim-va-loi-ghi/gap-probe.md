---
slug: od2-phim-va-loi-ghi
at: 2026-11-08T15:05:06Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | Dòng bỏ ui-observed ghi lối chết không chết: route decide tự trả 409 khi thẻ đã quyết, dựng được lỗi thật bằng tab thứ hai mà không chạm route T3; hợp đồng có mặt ui mà không eval ui-check nào | Trên app thật toast lỗi không hiện sau khi chuyển route (toast gắn cây cũ hoặc «Mở thẻ» trỏ provider đã gỡ) trong khi E1 jsdom vẫn xanh | Eval ui-check trên dev: tab A bấm đáp án thẻ X, tab B quyết X, tab A chuyển trang Ops trong 5 giây → frame có toast «Không ghi được #X» + «Mở thẻ» → URL /ops/review?card=X | fixed: thêm E6 ui-check layer ui-observed; dòng sổ mới supersedes dòng bỏ ui-observed |
| P0 | contract | Giữ chữ «Đã ghi» lúc bấm là nghĩa sản phẩm chỉ người có nhưng sổ ghi máy quyết; AC-2 vế «đã ghi chỉ khi 200» tự mâu thuẫn với tin lúc bấm | Cổng Phạm vi duyệt mà Mạnh không được hỏi; E2 đo suông nhờ khác hoa thường | Dòng Hỏi chi-nguoi supersedes dòng cũ; khoanh vế AC-2 vào tin trả lời của Hoàn tác; E2 assert không phân biệt hoa thường trên tin sau cú bấm | fixed: Hỏi-1 (chi-nguoi, khuyên giữ) supersedes dòng cũ; AC-2 khoanh vế vào tin trả lời của «Hoàn tác»; E2 so không phân biệt hoa thường trên tin sinh sau cú bấm |
| P1 | evals | E1 không đo «đúng một lần» theo thời gian sau khi xả | Hẹn giờ 5 giây không huỷ → gửi hai lần, lệnh 200 lại báo lỗi 409 | Vặn đồng hồ giả 6 giây sau gỡ và sau pagehide, số fetch không đổi; chiều đỏ XA GUI HAI LAN | fixed: E1 thêm vặn 6000 ms + chiều đỏ 'XA GUI HAI LAN'; AC-1 thêm vế 6 giây |
| P1 | evals | E2 chưa đo Hoàn tác sau khi đã rời Hàng duyệt (chính kịch bản Ngoài-5) | Bảng tình trạng mất khi gỡ → Hoàn tác vẫn báo «đã ghi» với lệnh 409 | Đường B ba ô viết trước sau gỡ + «Mở thẻ» điều hướng; chiều đỏ tình trạng mất khi gỡ | fixed: E2 thành 3 tình trạng × 2 đường (6 assert chữ) + chiều đỏ 'TINH TRANG MAT KHI GO'; AC-2 nêu cả hai đường |
| P2 | evals | E3 chỉ assert phím 1 và j | Chặn lặp chỉ phím 1 hay chặn cả K/↓/↑ mà E3 vẫn xanh | Ma trận 8 phím viết trước, chiều đỏ từng nhóm | fixed: E3 ma trận 8 phím + chiều đỏ chặn chỉ '1' và chặn phím đi thẻ |
