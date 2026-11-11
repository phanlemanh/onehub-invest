---
slug: tu-vung-du-an-muc-39
at: 2026-11-11T14:18:07Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E6 (b) không chứng bộ sinh ghi vào thư mục tạm, chiều --write không có đối chứng | vocab.mjs bỏ qua --root thì --write ghi cây thật, băm bản tạm trùng, ca xanh giả | Đối chứng dương: enum mới ở bản tạm làm --write đổi ≥1 tệp sinh của bản tạm, 0 tệp cây thật; ghim «TV39-AC-6 write ghi ngoài root» | fixed: E6 và ca TV39-AC-6 thêm đối chứng dương; vocab.mjs đọc --root (args() dòng 17-25) |
| P1 | evals | Ngưỡng SỐNG nói cả tệp không còn nối toà với asset_nodes/ComplexName, E5 chỉ đo ba ô | Một lá khác của mappings.yaml còn «asset_nodes node_type=building (≈ComplexName)», E5 vẫn xanh | Quét mọi chuỗi lá; ComplexName chỉ được ở sources.S08.fields.subdivision_name; đột biến chèn lá block_code | fixed: AC-5, E5 và ca TV39-AC-5 thêm quét lá, danh sách ngoại lệ một đường dẫn |
| P1 | contract | Căn cứ dòng bỏ coverage-scan không quyết việc bỏ quét | Cổng duyệt «phạm vi đã khai trọn» trên câu trích chỉ kể ba thuật ngữ | Đổi căn cứ hoặc thêm ma trận nguồn → mục | fixed: dòng sổ mới supersedes d-20261111T141451Z-2 trích hàng DA0a; Coverage có ma trận nguồn → mục → AC |
| P1 | contract | Câu stg_s08_inventory không sync nguyên bảng và project_id bỏ «chỉ local» không được đo | Viết lại policy làm rơi câu cấm sync bảng thô, E5 vẫn xanh | Hai ô mới, đột biến xoá câu stg và đưa lại «chỉ local» | fixed: AC-5, E5 thêm hai ô; số đột biến 8, thêm ca xoá riêng câu stg |
| P2 | evals | Phép đo cùng dòng thay quan hệ; thiếu điều kiện dự án con; regex trên bytes chưa NFC | Dòng NFD thoát quét; khối Dự án bỏ điều kiện vẫn qua E1 | NFC; E1 đòi «khác chủ đầu tư», «mở bán riêng» | fixed: NFC và hai chữ điều kiện có đối chứng; phần quan hệ: rejected — văn bản từ vựng, mỗi dòng còn «khu đô thị» liệt trong bằng chứng để người đọc ở Cổng |
