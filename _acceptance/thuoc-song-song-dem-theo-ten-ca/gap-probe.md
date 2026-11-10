---
slug: thuoc-song-song-dem-theo-ten-ca
at: 2026-11-09T17:10:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ d-7 để lượt ghim lại chạy atss_lib trên DB chung, đột biến «giữ 33033» cầm khoá tư vấn dùng chung; lối DB thử không chết vì ràng buộc nêu được | Lượt ghim trùng job đêm cần 33033 → job chờ hoặc vấp lock_timeout trên dữ liệu thật | Đổi atss_lib sang db-thu.sh, hoặc hỏi người | fixed: atss_lib chuyển sang DB thử (config.yaml), E1–E4 dùng chung executor, bỏ ttc_lib; dòng sổ mới supersedes d-7; bỏ mục Out of scope tương ứng |
| P1 | design | Commit neo 2070958c có thể chỉ sống nhờ ref nhánh nếu kho gộp squash | Nhánh gốc bị xoá, clone mới → pham-vi.sh thoát 2, ghim lại đỏ ở E5 | is-ancestor với origin/main, đỏ NEO KHONG BEN | fixed: đo 09/11 cả a86804f7 và 2070958c là tổ tiên của origin/main (PR #267 gộp bằng merge commit fcc42f9c); E6 thêm vế is-ancestor in NEO KHONG BEN; AC-5 ghi rõ |
| P1 | contract | AC-6/E7 chỉ chạy lưới trước-gộp với --slug của hồ sơ cũ | Hồ sơ khác bị kéo vào vì PR chạm config.yaml hay probe chung → PR không gộp được mà E7 xanh | Lưới trên phạm vi diff PR, không --slug | fixed: AC-6 và E7 chạy pre-merge-check.sh . --base merge-base, đòi 0 VIOLATION, in tên hồ sơ bị kéo vào |
| P2 | evals | E1 chỉ kiểm hai chuỗi tên ca vắng; không đối chứng phần neo ^…$ | Bộ lọc thiếu neo, ca KN- chứa một tên đích chạy trên DB chung, E1/E3 vẫn xanh | Rút mọi tên ca từ tệp, so tập; đối chứng ca «<tên 1> phụ» | fixed: E1 so tập tên ca chạy với ba tên (CA NGOAI DANH SACH CHAY); E3 thêm bản chép có ca «<tên ca 1> phụ» phải không chạy (DOI CHUNG KHONG BAT (neo tên)) |
| P2 | evals | Không kiểm bản chép tạm bị xoá khi đối chứng ném lỗi | Bản .dot-* còn lại, suite pipeline lượt sau chạy nó | Kiểm không còn .dot-* sau probe; dọn ở finally | fixed: E3 thêm vế không còn .dot-* trong pipeline/scripts và pipeline/lib (CON BAN CHEP TAM); thiết kế ghi dọn ở finally |
