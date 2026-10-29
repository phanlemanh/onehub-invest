---
slug: don-hex-tho
at: 2026-10-29T09:10:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn chỗ đặt màu bản đồ ghi nguồn một-lối nhưng chỉ loại hai lối; lối đổi hex sang rgb()/hsl() tại chỗ và lối đọc token lúc chạy vẫn sống theo những ràng buộc đã nêu. | Cổng Phạm vi duyệt «chỉ một lối» trong khi máy đã tự chọn giữa ba lối, quyết chỗ đặt màu bản đồ lâu dài. Cùng lớp [dung-m2-song-song#F2]. | Dòng một-lối nêu ràng buộc giết từng lối còn lại, hoặc trích ý định, hoặc đưa thành câu hỏi. | fixed: ghi dòng sổ mới thay dòng cũ (supersedes), nêu ràng buộc giết cả bốn lối kia — MapLibre không đọc biến CSS; getComputedStyle trả oklch(); luật no-hardcoded-color của kho cấm rgb()/hsl() và M2 bắt lại; để nguyên thì M1 chặn |
| P1 | evals | Phép quét 0 chỗ của E1 chỉ có đối chứng dương là một hex chèn tay; không ca nào chạy trên mã cũ thật, regex của test không được ghim với kit. | Test chép regex hẹp hơn kit (chỉ 6 chữ số) thì #000 ba chữ số còn mà E1 vẫn xanh; tới noi-design-floor sàn S4 thật mới chặn. | Ca dương trên năm tệp ở 3936e3d0 báo đúng 15 chỗ viết trước; ghim RE_HEX với kit. | fixed: AC-1 và E1 thêm (b) git show 3936e3d0 năm tệp → đúng 15 chỗ tệp:dòng:giá trị viết trước gồm #000; (d) so RE_HEX.source với design-floor-s4.mjs khi máy có kit |
| P1 | contract | AC-2 hứa ma trận 14 màu viết trước nhưng hợp đồng không liệt tên vai nào ứng giá trị nào. | Gõ sai một giá trị ở lib rồi chép ngược vào test thì E2 vẫn xanh; không còn frame nào để bắt vì đã bỏ ui-observed. | Bảng 14 dòng trong AC-2; test so với bảng; quan hệ tập hex xoá = tập giá trị lib. | fixed: AC-2 mang bảng 14 dòng (vai · tên · hex · nguồn 3936e3d0); E2 so giá trị lúc chạy (import .ts dưới node 24); quan hệ tập hex cũ được ca dương (b) của AC-1 giữ |
| P1 | evals | E3 hứa quan hệ mỗi chỗ dùng nhận đúng vai nhưng chỉ đo chuỗi có mặt; số 14 chỗ không khớp thiết kế (bins.ts chỉ tái xuất). | Gán đảo ink/paper hay dark/light vẫn xanh vì mọi tên đều có mặt; đột biến đã khai chỉ phủ một tệp. | Ma trận neo chỗ dùng viết trước; đột biến đảo cặp ở cả bốn tệp, đỏ ghim neo. | fixed: AC-3 thành 7 neo viết trước phủ đủ 14 giá trị; E3 khai đột biến ở cả bốn tệp, mỗi đột biến đỏ ghim đúng neo |
| P1 | evals | E9 đo trên ref di động merge-base(origin/main)..HEAD trong bộ thường trực chạy ở CI mọi nhánh. Cùng lớp [m2-ac10-so-cap-co-dinh#F1]. | Sau gộp, nhánh sau có lý do chính đáng đụng vendor làm DHT-AC-8 đỏ CI; checkout nông thiếu ref thì ca bị bỏ qua mà vẫn xanh. | Ghim cặp sha hoặc chỉ tính commit của vòng; thiếu ref thì đỏ có thông điệp. | fixed: AC-8 chỉ tính commit không gộp từ 3936e3d0 chạm tệp riêng của vòng; commit chỉ chạm vendor không tính; thiếu ref thì đỏ ghim (CI job scripts checkout fetch-depth 0) |
