---
slug: judge-luat-loai-tru-dac-trung
at: 2026-10-31T06:30:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E6 không ghim số thẻ và không nói diện tích có tính là đặc trưng khác không | Bảy thẻ chỉ khác diện tích rơi khỏi mẫu số, luật diện tích hỏng mà E6 vẫn xanh | Danh sách thẻ viết trước, ngưỡng viết thẳng, chiều đỏ bỏ luật diện tích | fixed: E6/AC-6 ghim tập [13..22, 24] đếm 11 và [23] đếm 1, ngưỡng 0,015 viết thẳng, thêm chiều đỏ bỏ luật diện tích |
| P1 | evals | Không eval nào chạy qua bộ nạp cặp thật | Bộ nạp thiếu trường đặc trưng, luật mới không bao giờ chạy với WC, đường, mã căn, tầng | Ca queryPair thật trên DB máy thu | fixed: E6 thêm ca queryPair thật (judge-run gọi queryPair của native.ts, tệp trong ranh) — trường đặc trưng khác null ở ít nhất một bên |
| P1 | contract | Mã căn và tầng không có AC cho dạng viết khác, tầng không có số | «Tầng 12» và «12» bị loại nhầm | Ma trận dạng viết + chuỗi không số là thiếu | fixed: thêm AC-8/E8 kèm chiều đỏ so nguyên văn |
| P2 | decisions | Sửa ma trận PL25 của hồ sơ đã ký mà không có bước ghim lại | Lưới trước-gộp chặn PR | Dòng sổ + lưới xanh | fixed: dòng sổ S1 ghim lại các hồ sơ đã ký có eval chạy judge-nguong.test.ts khi lưới báo hoá cũ |
| P2 | contract | Thiếu ô diện tích thiếu một bên và ô đúng ngưỡng | Rỗng thành 0 ra khác căn; đột biến «>=» thành «>» lọt | Hai ô mới + chiều đỏ | fixed: AC-2/E2 thêm ô 50↔null và 100↔101,5, chiều đỏ đột biến «>» |
