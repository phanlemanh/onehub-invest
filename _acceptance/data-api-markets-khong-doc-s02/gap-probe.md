---
slug: data-api-markets-khong-doc-s02
at: 2026-11-27T03:30:00Z
verdict: findings
p0: 0
p1: 5
p2: 10
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract AC-1 · E1 | DB thử là bản chép dữ liệu thật (34 thị trường, 29 có điểm S02); `?country=vn&limit=5` không ghim dòng cấy vào trang | Dòng cấy bị thị trường thật đẩy khỏi 5 dòng → soát chuỗi canh xanh vô điều kiện; chiều đỏ chỉ đúng khi điểm canh lớn hơn mọi điểm thật | Quốc gia riêng hoặc limit đủ phủ; điểm canh > max thật; khẳng định dòng cấy có mặt | fixed: khối chung của Criteria — dòng cấy ở quốc gia `zz`, điểm canh lớn hơn mọi số thật, mỗi ca khẳng định dòng cấy có mặt; AC-1 gọi `country=zz`, ghim ba dòng và thứ tự |
| P1 | contract AC-5 · E5 | Rào chỉ soát văn bản câu; tham số không được ghi | `WHERE source = $1` với `['S02']` qua cả hai lớp | Cấm hẳn `area_sources`, ghi tham số, đột biến tham số hoá | fixed: AC-5 cấm `area_sources` trong mọi câu của bốn đường, bộ ghi chép mảng tham số và đỏ khi có `S02`, đột biến `WHERE source = $1` với `['S02']` |
| P1 | contract AC-5 · E5 | Rào tĩnh không phủ tên bảng S02 phía cloud `ref_calib_*` | Route đọc `ref_calib_scores` khi trỏ DB cloud mà rào xanh | Mẫu `ref_calib_` + đột biến | fixed: AC-5 thêm `ref_calib_` vào cả lớp lúc chạy lẫn rào tĩnh, đột biến `FROM ref_calib_scores` |
| P1 | contract AC-6 · E6 | Đối chứng bản cũ bỏ AC-3 | Ca submarkets viết lỏng mà không ai chứng nó phân biệt bản cũ/mới | Thêm AC-3 vào danh sách đỏ | fixed: AC-6 và E6 đòi đủ năm ca AC-1…AC-5 đỏ trên bản merge-base |
| P1 | contract AC-4/AC-5 · E5 | E5 đòi ≥ 1 câu mỗi đường, insights 410 thì 0 câu; insights với mã không có bỏ ngỏ | Người làm thêm câu thừa, hoặc E5 đỏ giả | Ghim 410 mọi mã, 0 câu, miễn insights | fixed: AC-4 — mã có, mã cũ, mã không có đều 410, 0 câu SQL; AC-5 đòi ≥ 1 câu chỉ ở ba đường còn lại, insights 0 câu |
| P2 | contract AC-7 · E7 | Chỉ soát chữ «Market Score» | README còn «score breakdown», «ADR…» mà xanh | Danh sách chữ cấm | fixed: AC-7, E7 dùng danh sách chữ cấm (score, Market Score, ADR, occupancy, revenue, metrics) trên các dòng đường markets |
| P2 | contract AC-2 · E2 | Không ghim `listingCount` của chi tiết | Chi tiết trả 0 cố định mà xanh | Bằng số tin cấy và bằng dòng danh sách | fixed: AC-2, E2 |
| P2 | contract AC-1 · AC-6 | Nửa «bằng nhau theo tên» không có chiều đỏ | Bỏ khoá xếp theo tên mà không ca nào đỏ | Đột biến hoặc giới hạn đã biết | deferred: ghi Notes «Giới hạn đã biết», cùng giới hạn HT23 đã nhận, đo ở hàng HT28 nếu GS mở rộng |
| P2 | contract AC-1 | Không ghim `meta` | `meta` đổi hình | Ghim hai khoá | fixed: AC-1 ghim `meta` = `{total: 3, limit: 5}` |
| P2 | contract AC-5 | Đơn vị vi phạm và phạm vi quét chưa định nghĩa | Rào đếm hai vi phạm cho một câu → đỏ giả | Một vi phạm mỗi tệp; mọi chuỗi trong mã | fixed: AC-5 — đơn vị là một tệp, quét mọi chuỗi trong mã sau khi bỏ chú thích |
| P2 | contract AC-5 | Rào bỏ sót `data-api/api/` | Handler Vercel đọc S02 mà rào không thấy | `data-api/{src,api}/**` | fixed: AC-5, E5 quét `data-api/{src,api}/**` |
| P2 | contract AC-7 · E7 | Lưới PB5 vắng thì tự xanh | Không phép soát tên nguồn nào chạy | In «bỏ qua» + phép thay | fixed: AC-7, E7 in đúng dòng «bỏ qua — PB5 chưa gộp» và chạy phép soát tier-a-source-names trên tệp đổi |
| P2 | contract Notes Hỏi-2 | Gộp hai quyết định; chưa liệt AC/E phụ thuộc | Mạnh chọn khác mà evals lệch | Tách câu, liệt phụ thuộc | fixed: tách Hỏi-2 (tiểu vùng) và Hỏi-3 (insights), mỗi câu liệt AC, E đổi theo; sổ có hai dòng mới thay dòng cũ |
| P2 | contract Coverage Trục B | Mã cũ, mã không có chỉ có ở chi tiết | Submarkets với mã cũ trả rỗng mà xanh | Thêm ca ở AC-3 | fixed: AC-3 (mã cũ cùng thân, mã không có → 200 rỗng), AC-4 (ba loại mã); Trục B ghi đủ bốn đường |
| P2 | contract Context | Vùng thiếu `data-api/CLAUDE.md`, `docs/ROADMAP.md` | Soát phạm vi đỏ hoặc tài liệu lệch | Khai rõ | fixed: thêm `data-api/CLAUDE.md` vào vùng; `docs/ROADMAP.md` ghi ngoài vùng — M5 không giữ ROADMAP, GS ghi as-built sau gộp |
