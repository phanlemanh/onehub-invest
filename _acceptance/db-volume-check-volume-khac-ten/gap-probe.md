---
slug: db-volume-check-volume-khac-ten
at: 2026-10-29T14:10:00Z
verdict: findings
p0: 1
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-20261029T135556Z-4, -5) | Hai dòng ghi nguồn mot-loi nhưng ràng buộc nêu ra không giết lối kia — «cấm chạm khi chưa xin cham-tep» và «chạm ngoài vùng» đều gỡ được bằng một lượt cham-tep; lối chế độ/khoá executor riêng và lối docs/ vẫn sống. Cùng lớp [lb-ac-1-map-files-mot-nguon#F1] [bat-dieu-phoi-cap-du-an#F1]. | Mạnh duyệt việc nhồi phép phá thử vào mutation vì tin không có lối khác, trong khi đó là lựa chọn của máy giữa hai lối còn sống có giá. | Viết dòng sổ supersedes d-4/d-5: nêu ràng buộc thật hoặc đổi nguồn cho đúng bản chất kèm lối còn sống và giá. | fixed: d-4 thay bằng câu Hỏi-1 (chi-nguoi, khuyến nghị lối a) d-20261029T135907Z-10; d-5 thay bằng căn cứ muc-tieu trỏ lựa chọn cùng loại của hồ sơ db-volume-live-ban-lui (d-20261029T135907Z-11). |
| P1 | evals (E8) · contract (AC-5) | Vế «cây sau vòng» của AC-5 không được đo: E8 chỉ đo chuỗi có mặt (lý do, exit 0, verified_commit = sha), không đo quan hệ sha chứa bản cuối của db-volume-check.sh. | S3 ghim lại, rồi S4-r1 sửa tiếp db-volume-check.sh; bốn tệp inputs không đổi nên E8 vẫn PASS dù bằng chứng ghim trên cây cũ. | Eval script: git diff --quiet sha_repin HEAD -- scripts/db-volume-check.sh exit 0, đối chứng sha cũ phải đỏ. | rejected: lưới trước-merge (scripts/pre-merge-check.sh, chạy trong CI) đã đo đúng quan hệ này cho mọi hồ sơ đã ký — tệp đổi sau verified_commit là VIOLATION evidence is stale chặn gộp; nó bắt đúng ca này ở #178 (db-vao-volume). Ghi vào Notes của contract. |
| P2 | design (ô khong-doc) · contract (AC-2) | Ô khong-doc bơm tay data_directory rỗng vào o_live, không round-trip từ đường đọc thật lúc truy vấn lỗi. Cùng lớp [db-volume-live-ban-lui#F2]. | Truy vấn data_directory lỗi mà đường đọc thật sinh chuỗi khác rỗng → nhánh «không đọc được» chết ngoài đời, ô vẫn ĐẠT. | Ô dựng data_directory qua đúng hàm đọc mà live dùng, trỏ vào đích chắc chắn lỗi. | fixed: design mục 1 + AC-2 + E2 — tách doc_dd khỏi live_doc, ô khong-doc gọi doc_dd trên container one-invest-db-khong-co-$$ (d-20261029T135907Z-12). |
