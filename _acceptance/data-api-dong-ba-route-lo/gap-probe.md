---
slug: data-api-dong-ba-route-lo
at: 2026-11-24T11:32:00Z
verdict: findings
claims_input: ok
p0: 1
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-20261124T112808Z-3 ghi «mot-loi» nhưng lối giữ tên người bán đọc từ sale_offers đã làm sạch vẫn sống; đổi hình v1 là việc Mạnh quyết | Mạnh chọn gỡ trường mà tưởng không còn cách giữ tên người bán; hình v1 mất senderName do máy quyết | Thay d-3 bằng dòng chi-nguoi có khuyen và loi_khac | human-gate1: dòng d-20261124T113143Z-9 supersedes d-3, lên thẻ thành Hỏi-2 |
| P1 | evals | E6 chỉ cần một lớp đỏ mỗi ô cũ; lớp JSON với chuỗi canh không được chứng đỏ; ô coverage-cu, listings-cu không đòi đường khác xanh | Dòng canh cấy sai khoá nối, lớp JSON rỗng mà E6 vẫn PASS nhờ lớp SQL | Mỗi ô cũ đỏ cả hai thông điệp, hai lớp độc lập; mọi ô cũ đòi ca đường khác xanh | fixed: AC-6 và E6 viết lại — đủ hai thông điệp mỗi ô, assert độc lập, ca đường khác xanh ở cả ba ô |
| P1 | contract | Ranh giới AC-8 có vế «nếu gs cho» cho config.yaml trong khi mọi eval máy chạy bằng khoá config | gs không cho thì S4 không có lệnh; cổng duyệt ranh giới không xác định | Liệt config.yaml tường minh, giới hạn khoá dapi_drl*; ô chiều đỏ cho khoá ngoài | fixed: AC-8 liệt đúng khoá dapi_drl*, E8 thêm ô pha-config; gs đã cho (XONG m5-2411-1, sổ d-20261124T113335Z-10) |
| P2 | contract | Nhánh CG8 chỉ đo 200 và câu SQL, không đối chứng dương nội dung | Gỡ LATERAL làm nhánh v_ruler_p2 rỗng hay mất discountPct mà E2 vẫn xanh | AC-2/E2 đòi tin canh có mặt ở nhánh CG8 với trường đúng tên kiểu, thông điệp ghim | fixed: AC-2 cấy đủ 5 căn cho v_ruler_p2, E2 thêm «DRL deals CG8 đổi hình» |
| P2 | evals | E7 vế (3) hỏi tên nguồn thật mà inputs không có danh sách tên | Hội đồng PASS vế (3) không căn cứ | Bỏ vế (3), máy quét toàn văn README và CLAUDE.md có ô chiều đỏ | fixed: E7 bỏ vế (3); thêm E10 (AC-7) và ô pha-docs trong probe pham-vi quét toàn văn hai tệp |
