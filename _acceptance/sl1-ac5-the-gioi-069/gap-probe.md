---
slug: sl1-ac5-the-gioi-069
at: 2026-11-11T14:40:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-20261111T142507Z-4 (không gỡ skip của `dbs_s03_len_cong`) ghi nguồn mục-tiêu bằng câu trích của vòng `do-san-sl1-kdm` («trong vòng này»), không quyết được cho vòng này [do-san-sl1-kdm#F1]. | Cổng Phạm vi duyệt d-4 như mục tiêu đã chốt; hai ca xanh nhưng lệnh của hồ sơ đã ký vẫn bỏ qua chúng mà không ai được hỏi. | Dòng S1 mới `supersedes` d-4, nguồn một-lối nêu vì sao lối gỡ skip chết, hoặc thành câu hỏi. | fixed: dòng d-…-6 thay d-4, nguồn một-lối — gỡ skip là sửa executor mà hồ sơ đã ký `dong-bang-stage-b-resolve` trỏ, máy không đổi thước của hồ sơ đã ký; thẻ Cổng Bằng chứng nêu việc hồ sơ kia còn bỏ hai ca. |
| P1 | contract | AC-1 không nói tin có lớp trên (observed/fact) ra sao; «mỗi loại» không rõ số loại; giá trị kỳ vọng không ghim nguồn độc lập. | Tin vừa observed vừa inferred làm ca đỏ oan hoặc bị loại ra; lỗi 069 cho inferred đè observed lọt; kỳ vọng tính bằng chính hàm 069 thì tự khớp. | Thêm nhánh lớp trên không đổi; nêu bốn loại, mỗi loại ≥ 1 tin; kỳ vọng từ SQL độc lập trên `field_assertions`. | fixed: AC-1 và E1 nay có bốn loại (a)–(d), nhánh (d) lớp trên không đổi, kỳ vọng từ câu SQL độc lập không gọi `resolve_offer_fields`. |
| P1 | evals | Phép so khoá `field_provenance` của E1 không có chiều đỏ. | Bản cài chỉ so tập cột: 069 ghi đè `field_provenance.bathrooms` của tin có phát biểu suy mà E1 vẫn xanh. | Chiều đỏ thứ ba: sửa một khoá fp khác `property_type` của tin loại (b), ghim «SL1-AC-5». | fixed: AC-1 và E1 thêm chiều đỏ thứ ba (jsonb_set một khoá fp khác của tin loại (b)). |
| P1 | evals | E1, E2, E3 không ghim nguồn DB; thiếu phát biểu suy thì ca đỏ hoặc bị skip. | DB riêng dựng từ migration không có tin có phát biểu suy: ca đỏ, hoặc thêm skip trái «skipped 0»; hai bên xanh trên hai thế giới. | Ghim tên DB, cách chép, số phát biểu suy sống tối thiểu; thiếu thì đỏ nêu rõ, không skip. | fixed: AC-1 ghim DB của riêng lượt chép từ bản mẫu của DB máy thu (`db-thu.sh --chay`), ≥ 1.000 phát biểu suy sống, thiếu dữ liệu hay thiếu một loại thì ca đỏ nêu số, không bỏ qua. |
| P2 | evals | AC-3 hứa từ chối `oneinvest` và không đổi DB mà E3 không đo. | Một ca gọi DB ngoài `withTx`, hay `DROP VIEW` ngoài giao dịch, để lại thay đổi mà E3 vẫn xanh; chốt URL bị nới không ai thấy. | Lượt chạy với URL `oneinvest` thoát ≠ 0 ghim thông điệp; so định nghĩa view và số dòng trước, sau. | fixed: thêm E4 (probe `tu-choi-oneinvest.sh`, cổng 1 không chạm DB, chiều đỏ trên bản sao gỡ chốt — đã chạy: xanh và đỏ đúng); AC-2/E2 so `pg_get_viewdef('sale_offers')` ở kết nối mới trước và sau ma trận. |
