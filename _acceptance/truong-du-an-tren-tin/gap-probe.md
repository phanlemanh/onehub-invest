---
slug: truong-du-an-tren-tin
at: 2026-11-11T23:32:59Z
verdict: findings
p0: 0
p1: 2
p2: 3
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ma trận ca sai AC-2 thiếu ô đối xứng (subzone ở Building, subzone không tồn tại/không phải số, area_id không tồn tại, số đệm, project trỏ building) nên căn cứ bỏ coverage-scan sai | 096 quên một nhánh kiểm của subzone_node_id mà E2 vẫn xanh | Ma trận đối xứng ba trường × kiểu sai và × resource sai, đột biến miền subzone | fixed: AC-2/E2 thành 17 ca, thêm đột biến bỏ kiểm chữ số subzone; dòng sổ bỏ coverage-scan thay bằng bản ba trục |
| P1 | evals | E6c đòi tsc xanh mà đường nền đỏ sẵn vì thiếu .next/types | Lỗi môi trường bị miễn tay hoặc chặn ký sai | Ghim bước next typegen và đối chứng tập lỗi base | fixed: E6c và AC-6 ghim next typegen trước, đối chứng tập lỗi tsc base rỗng |
| P2 | evals | E5 kiểm sáu điều kiện bằng chữ có mặt; DQ trỏ hàng tương lai; thiếu kiểm project_node_id.dd, area_id | rationale có chữ DQ là xanh dù không DQ nào chạy | Dấu DQ trỏ tệp có thật + mã hàng; thêm assert hai trường | fixed: E5/AC-5 đòi đường pipeline/dq-enum-vocab.mjs có thật và mã DA9, ghi điều kiện 6 thoả một phần; thêm hai assert |
| P2 | evals | Nguồn id nút của E1/E2 không ghi | Fixture tự dựng khớp trigger mà nút thật không khớp | Ghi rõ nguồn id | fixed: E1 ghi nút do test chèn (chuỗi migration không seed nút), nút building mang đúng cột của ba nút Grand Park |
| P2 | design | Dòng sổ đổi nhãn area_id ghi máy quyết nhưng câu trích không quyết chữ nhãn | Nhãn UI đổi mà Cổng không biết | Đưa ra Cổng hoặc trích căn cứ thật | fixed: dòng sổ mới supersedes, thành câu hỏi Hỏi-1 cho Mạnh ở Cổng Phạm vi |
