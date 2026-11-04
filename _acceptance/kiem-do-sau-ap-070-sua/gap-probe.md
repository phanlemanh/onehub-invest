---
slug: kiem-do-sau-ap-070-sua
at: 2026-11-03T07:25:15Z
verdict: findings
p0: 4
p1: 1
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals, contract | E4 mong đợi trùng hệt kết quả trên DB chưa áp, không chứng minh đã chạm view của 070 | Một bộ rơi về oneinvest, hoặc dừng sớm, hoặc đỏ vì lỗi mới cùng mã, E4 vẫn xanh | Ma trận năm bộ, 0 bỏ qua, ghim lý do đỏ, kiểm kết nối | fixed: thêm đối chứng bản 174c302a của hai bộ báo lỗi view, ghim lý do từng ca đỏ, đếm ca bỏ qua, kiểm bộ đọc DATABASE_URL, bộ phán tự kiểm |
| P0 | design, sổ | Căn cứ một-lối của d-4, d-5 chỉ giết một biến thể, hai bản vị từ có thể lệch | Sửa sellersThieu mà quên SQL_N3 thì đỏ giả trở lại | Dòng sổ supersedes liệt các lối, hoặc chung vị từ | fixed: dùng chung hằng TIN_VAO_DANH_BA, hai dòng sổ supersedes d-4, d-5 |
| P0 | evals, contract | Không eval nào đi hết đường thật tới dòng danh-ba-sdt:n3 | docDuLieu ánh xạ sai cột, kiểm thật vẫn đỏ giả | Chạy docDuLieu và bước phán thật | fixed: ca KD-AC-1, KD-AC-2 đi qua docDuLieu, tinhSo, veDong; bỏ đọc tĩnh |
| P0 | evals, contract | Fixture viết tay, ma trận thiếu ô, thiếu ô số đã có bí danh chỉ còn tin ghép | Số đã có bí danh chỉ còn tin ghép làm sellers lớn hơn số đếm, đỏ giả chiều ngược | Ma trận 10 ô, dấu từ bộ gán thật | fixed: ma trận 10 ô viết trước, dấu từ ganSdtS06; lỗi chiều ngược có thật nên N3 thêm vế bí danh |
| P1 | contract, sổ | Các ca đỏ sẵn ra ngoài phạm vi không có dòng descope và nguyên nhân | Người ký cho áp 070 mà không biết CLOUD_ALLOW đỏ vì sao | Mỗi ca một dòng descope có nguyên nhân | fixed: bốn dòng descope; CLOUD_ALLOW là thước cũ theo 193b8a11, không có câu hỏi cho người; PD-AC-8, GT-AC-4, AC-8 ghi rõ chưa tra nguyên nhân |
