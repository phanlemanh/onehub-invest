---
slug: sdt-luu-goc-e164
at: 2026-10-31T03:20:32Z
verdict: findings
p0: 1
p1: 3
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design · contract | Bỏ bảng sellers là xoá dữ liệu mà d-3 ghi kho_dao false; miền dòng view và cách tính first_seen/n_ads là lựa chọn chỉ người có; E5 không so với bảng cũ | View mất dòng hay first_seen dịch muộn mà E5 vẫn xanh vì câu tính lại cũng không có lịch sử [sellers-them-dong-lai#F1] | Chụp bảng cũ trước 060, so từng dòng × cột với view; dòng sổ Hỏi-4 kho_dao true | fixed: dòng S1 mới supersedes d-3 với kho_dao true; Hỏi-4 (chi-nguoi, kho_dao true); AC-5 + E5 so với bảng cũ chụp sau một lượt refresh: 0 dòng mất, first_seen ≤ cũ |
| P1 | evals | E3 không ghim số khoá căn khác null trước = sau, không rõ luật chọn tin của căn | 060 đặt null khoá căn mà E3 vẫn xanh | Đếm trước = sau; ánh xạ khoá cũ → E.164; đỏ 'MAT KHOA CAN' | fixed: AC-3 + E3 theo ánh xạ khoá cũ → E.164 của cùng số, đếm trước = sau, đối chứng đỏ 'MAT KHOA CAN' |
| P1 | evals | E6 chỉ quét mã tĩnh, không chạy refresh-bait-gap thật sau 060 | Mã còn câu ghi động vào sellers, chạy đêm lỗi mà E6 xanh | Chạy tiến trình con trên DB thử, exit 0, cột bait gap trùng câu độc lập | fixed: E6 chạy refresh-bait-gap thật trên DB thử (view tổng hợp không ghi được nên exit 0 chứng không ghi) + cột bait gap trùng câu độc lập |
| P1 | contract · evals | «Che như sdt_bam» không định nghĩa; E8 dựng fixture tay; AC-8 thiếu cross-layer | Luật che cũ cắt 8 ký tự lộ nửa số cho viewer mà E8 xanh | Loader people.ts thật ba vai, nhãn che ghim, đối chứng dương, backend-effect | fixed: AC-8 cross-layer, nhãn che cố định 0 chữ số; E8 chạy loader thật trên DB thử, đối chứng dương số người có ô che, đỏ 'LO SO GOC TREN PEOPLE' |
| P2 | opportunity · evals | Ngưỡng «165 người có sdt» không có đường đo; E4 đòi một bí danh mỗi người | Người có hai số làm E4 đỏ oan; số người sau 060 lệch mà không ai báo | E4 in và so số người trước/sau; tập số mỗi người = ảnh tập số cũ | fixed: E4 so tập E.164 mỗi party_key với ảnh tập số cũ và số người có sdt = số người có sdt_bam trước 060 |
