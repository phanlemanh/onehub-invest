---
slug: dau-noi-dung-sql-bai-thu
at: 2026-11-10T11:25:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E1 với S03_POSTS_SQL chỉ so tổng đếm theo ngày, mọi dòng cùng một ngày, nên không đối chiếu từng post_id | bản SQL sai hai chỗ bù nhau (gạt nhầm «tên sàn» không ngoặc, bỏ sót NFD) vẫn ra cùng tổng, E1 xanh | mỗi dòng ma trận một ngày riêng, so từng dòng; đột biến bù trừ phải đỏ gọi tên post_id | fixed: E1 và AC-1 đổi sang mỗi dòng một ngày, so từng dòng; thêm đột biến bù trừ vào chiều đỏ |
| P1 | contract | Design nói regex JS có lookahead (?!\p{L}) mà vế SQL noi-dung không có, ma trận thiếu dòng gần trúng chạm lookahead | bài thật có chữ dính sau đoạn khớp: testMarker null mà SQL gạt | thêm dòng gần trúng chạm lookahead, hoặc ghi vì sao không cần | rejected: lookahead chỉ ở GROUP_TEST (bản SQL đã có vế «hết chuỗi hoặc ký tự không phải chữ», dòng TESTING ROOM canh); NOI_DUNG_TEST chỉ có hai nhánh trycloudflare.com và «[tên sàn]», không lookahead — design đã viết rõ câu này; thêm dòng gần trúng «[Tên sàn mới]» |
| P1 | contract | Bản chép trong app không nằm trong ma trận AC-1; E2 chỉ thử chữ thường NFC | bản app thiếu normalize hoặc dùng ~ thay ~*: máy thu đếm bài «[TÊN SÀN]» hay NFD còn cloud thì không | đưa bản app vào ma trận E1 với đột biến bỏ normalize phải đỏ | fixed: AC-1 thành bốn bản (thêm bản app rút từ collections-queries.ts), E1 thêm hai đột biến của bản app (bỏ NFC, ~ thay ~*) |
| P2 | evals | E5 xanh ngay trên mã cũ vì DB máy thu có 0 tin noi-dung, không có chiều đỏ | Gate 1 tưởng E5 chứng bản sửa | ghi rõ E5 xanh cả trên mã cũ, chiều phân biệt ở E4 | fixed: expected của E5 ghi rõ, chiều phân biệt ở E4 và E1 |
| P2 | design | Dòng sổ d-3 ghi mot-loi mà lối hàm SQL qua migration không chết, chỉ cần lời Mạnh (DDL) | Gate 1 duyệt khi tin chỉ còn một lối, Mạnh không được hỏi về DDL | đổi thành câu hỏi trên thẻ, dòng mới supersedes d-3 | fixed: dòng S1 mới Hỏi-1 (chi-nguoi) supersedes d-20261110T110034Z-3, khuyến nghị giữ ở mã |
