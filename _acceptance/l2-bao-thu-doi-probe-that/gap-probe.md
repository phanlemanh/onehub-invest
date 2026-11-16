---
slug: l2-bao-thu-doi-probe-that
at: 2026-11-15T05:21:16Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract, evals | Con số «11 giá trị đổi khoá» lệch chính bảng design (7 + 2 = 9) | E3 không bản cài nào xanh: 9 ≠ 11 hoặc deepEqual đỏ | Một tập duy nhất, so tập | fixed: đếm lại — L2 main bóc 14: giữ 4, đổi khoá 9, như cũ 1; design §1, AC-3, E3 và dòng sổ Hỏi-1 (supersedes) sửa theo |
| P1 | contract, evals | AC-3/E3 đếm cứng trên DB thật | Dữ liệu mới làm CD-AC-16 đỏ dù L2 đúng — tái tạo bẫy | Tập con + luật lớp, số đếm chỉ in | fixed: chín giá trị bảng phải nằm trong tập đổi khoá; mọi giá trị đổi khoá ra Thiếu hoặc khoá số, khoá đường mới thì đỏ; không assert số bằng |
| P1 | contract, evals | Chín tiền tố cho phép mà chỉ có ca Đường/Hẻm; không ca ranh giới từ | Cài thiếu tiền tố hoặc khớp «pho» không ranh giới mà vẫn xanh | Mỗi tiền tố một ca Khớp, ca âm «12, Phong Phú», đột biến bỏ ranh giới đỏ | fixed: AC-1/E1 thêm ca Phố, Đ., duong, pho, Ngõ, Ngách, Kiệt; AC-2/E2 thêm «12, Phong Phú», «8, Phổ Quang» và chiều đỏ bỏ ranh giới từ |
| P1 | design, evals | E9 dùng O_DUONG_DOT_BIEN mà bốn probe không đọc biến ấy | Script đúng thiết kế ra bốn ✅, E9 đỏ | Cơ chế đỏ không sửa mã nguồn | fixed: biến PROBE_GIA_DO=<tên tệp> làm đúng tệp ấy ❌; E9 ghim exit 1 + đúng một dòng ❌ gọi tên tệp; design §2 ghi cơ chế |
| P2 | contract, evals | Quét suite theo chuỗi dấu, không đo quan hệ đọc dữ liệu thật | Ca đọc DB không có dấu lọt quét | Chạy suite trên DB chép có cắm dòng độc | deferred: cắm dòng độc vào DB chép của db-thu.sh là việc hạ tầng riêng; lát này giữ quét chuỗi (dấu + tên ca) và AC-10 đo hai suite xanh trên bản chép máy thu thật |
