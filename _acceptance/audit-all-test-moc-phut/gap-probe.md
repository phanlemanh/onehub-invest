---
slug: audit-all-test-moc-phut
at: 2026-10-26T15:45:00Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design + evals | Không đo dòng tiêu đề là nguồn giờ duy nhất trong đầu ra audit; căn cứ bỏ coverage-scan không quyết «một chiều» | audit-all.sh thêm một dòng tính từ giờ thật → ON16-AC-2 dòng 334 vẫn đỏ trên CI trong khi E1–E4 xanh | Kiểm kê nguồn giờ của audit-all.sh, khớp đúng tập đã khai, nguồn mới thì đỏ gọi tên dòng | fixed: AC-2 + qua-phut.sh kiểm kê (date, stat, -mmin/-mtime/-newer, SECONDS, printf %() khớp tập {tiêu đề, find -mtime -8}; d-3 thay bằng dòng mới có câu trích |
| P1 | evals | Hai vế AC-1 không có eval: định dạng khác đi qua date thật; nhật ký có lời gọi date | Bản giả trả mốc cho mọi đối số hoặc quên ghi nhật ký → ca canh vẫn xanh | Hai đột biến cùng bản sao, mỗi đột biến đỏ với thông điệp ghim riêng, đối chứng dương bản sửa xanh | fixed: ca canh MP-AC-1 thêm assert date +%s lệch dưới 5 giây và assert nhật ký; ca-canh.sh thêm đột biến «ghim» và «log» |
| P2 | design | d-2 gắn mot-loi mà lối lọc không chết vì ràng buộc nêu được | Người duyệt không coi đây là lựa chọn cần soi | Căn cứ nêu ràng buộc thật hoặc thành câu hỏi | fixed: dòng sổ mới supersedes d-2 nêu ràng buộc — lọc phải đổi assert của hai ca thuộc hồ sơ đã ký audit-all-doc-log-o-checkout; env nằm ngoài ranh_gioi |
| P2 | evals | E3 ngưỡng t ≥ 25 viết tay; không kiểm cây sạch | Lỡ xoá một ca mà t vẫn ≥ 25 → E3 xanh; chạy trên cây bẩn → bằng chứng lệch sha | t = số ca của 53e2b83b + 1; git status sạch trước vòng lặp | fixed: lap.sh đếm ca từ 53e2b83b, đòi t = t_cu + 1, CAY BAN khi tệp theo dõi bị sửa |
| P2 | evals | ROOT suy từ thư mục hiện hành | Tác tử chấm đứng ở checkout chính → E3 chạy tệp test của main | ROOT suy từ vị trí script, in root + sha | fixed: cả bốn đầu dò suy ROOT từ dirname $0 và in dòng root <gốc> sha <sha> |
