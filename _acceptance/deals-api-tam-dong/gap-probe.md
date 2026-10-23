---
slug: deals-api-tam-dong
at: 2026-10-23T09:38:00Z
verdict: findings
p0: 1
p1: 1
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-2 (phiên ops cookie cũng qua) ghi máy quyết với căn cứ là docstring của route khác; câu giao AU2 và audit Q3 chỉ nói «token ops»; Context gán ý cho Mạnh. Cùng dạng [ui-clean-b1-ops#F1] | Mạnh ký Cổng 1 tưởng «phiên ops» là ý mình đã chốt, thực ra ký luôn đường vào thứ hai | Dòng sổ chi-nguoi supersedes d-2 thành Hỏi; sửa Context | human-gate1: dòng d-20261023T092422Z-9 (Hỏi-2, khuyến nghị bearer + phiên); Context viết lại, không gán ý cho Mạnh |
| P1 | evals | E5 không chứng minh token đọc lúc gọi | Hàm chụp env lúc nạp module → máy chủ thiếu env vẫn khớp «Bearer undefined» | Ca: env có T → qua; xoá env cùng tiến trình → Bearer T không qua | fixed: AC-3 + E5 + design ghim «token đọc lúc gọi» kèm ca xoá env |
| P2 | evals | E9/E10 đo thứ tự chữ; thiếu đột biến «không await», «không return 401»; bản bỏ cổng có thể còn import | Promise luôn truthy → kiểm tĩnh vẫn đạt khi cổng hỏng | Thêm hai đột biến, giữ import ở bản bỏ cổng | fixed: AC-5 + E10 + design — năm bản, kiểm quan hệ if(!(await …)) trả 401 trước pool.query, bỏ dòng import khi tìm |
| P2 | evals | E11 chấp nhận «một trong hai tệp» | Chỉ sửa docstring, ROADMAP vẫn ghi công khai mà vẫn ĐẠT | Đòi cả ROADMAP lẫn docstring | fixed: expected E11 đòi cả hai |
| P2 | contract | Đường đo chỉ trên local | Prod thiếu OPS_API_TOKEN hoặc deploy hỏng mà ngưỡng tuyên đạt | Smoke chỉ đọc trên prod sau merge | fixed: Đường đo thêm dòng prod (`--chi-doc`, S5 sau deploy; project cũ `app` không tính) |
