---
slug: dung-m2-song-song
at: 2026-10-29T04:30:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-6 và d-7 ghi nguồn muc-tieu nhưng câu trích chỉ liên quan: dòng catalog có ui/empty không chọn giữa quy ước kho và mẫu Nhóm/Tên; «ReUI block → shadcn/ui → custom» chỉ xếp ưu tiên, không quyết block section và ví dụ c-* có phải template. | Người duyệt tưởng đã chốt; mười vòng M1 viết reuse-plan theo cách xếp này, bật M2 mới thấy lệch và phải viết lại mọi kế hoạch. | d-6 thay căn cứ bằng quyết định đã duyệt; d-7 thành câu hỏi hoặc trỏ căn cứ quyết được, supersedes dòng cũ. | fixed: d-6 thay bằng dòng mot-loi trỏ ý định đã duyệt («tên có số giữ nguyên»); d-7 thay bằng dòng muc-tieu trích routes.md «Block đích: block ReUI … mà trang được dựng từ đó» — câu này liệt cả block section và ví dụ c-*, nên c-* cũng thành template (bỏ nhóm example; contract AC-5, design, mã sửa theo). |
| P0 | design | Dòng d-5 ghi mot-loi nhưng lối alias {color.X} cho cầu nối vẫn sống. | Người viết kế hoạch gõ token theo tên Tailwind và nhận UNRESOLVED_TOKEN hàng loạt ở M2; cổng duyệt trên «lối khác chết» sai. | Nêu ràng buộc thật hoặc đổi thành dòng có kê lối alias. | fixed: dòng thay nêu ràng buộc thật — Design OS phát tên biến CSS từ đường token (color.background → --color-background), nên lá hay alias color.color-X ứng với biến --color-color-X không có; cầu nối chính là tên CSS của lá color.X. |
| P1 | evals | E1 chỉ đếm, không có ma trận tên → (sáng, tối) cho cả 41 biến. | Giá trị tối của --card gắn nhầm vào card-foreground; đếm vẫn đúng, E1 xanh. | Ma trận rút độc lập từ globals.css so từng lá; đột biến tráo giá trị tối → đỏ nêu tên. | fixed: E1 thêm ma trận đủ 41 biến và cặp đỏ tráo giá trị tối của hai lá. |
| P1 | evals | E4 chỉ kiểm ui/button, không ma trận trục=giá trị viết trước, không round-trip bậc 4. | Bộ tách lấy nhầm khoá defaultVariants hoặc chỉ đọc cva đầu tiên của thư mục; reui/badge thiếu success-light, E4 vẫn xanh. | Ma trận viết trước cho reui/badge, thư mục nhiều cva, tệp có defaultVariants/compoundVariants; round-trip bậc 4. | fixed: E4 thêm ma trận viết tay (reui/badge 30 cặp đọc tay từ badge.tsx, ui/button 14, ui/item 8, reui/filters thư mục), fixture thư mục hai tệp cva, round-trip mọi cặp qua reuse-plan check bậc 4. |
| P2 | evals | E5 không đo description = ô File; đối chứng regex cùng khuôn bộ sinh. | Bộ sinh lấy nhầm cột; E5 xanh; người viết kế hoạch không tìm ra tệp chuyển thể. | Ca description viết tay trước; số block mỗi bảng viết trước; đột biến description rỗng → đỏ. | fixed: E5 thêm số dòng mỗi bảng đếm trước (36, 10, 12 dòng / 15 tên), description của @reui/hero-8 và @mapcn/store-locator viết tay, đột biến description rỗng → đỏ. |
