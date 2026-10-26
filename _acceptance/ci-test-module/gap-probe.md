---
slug: ci-test-module
at: 2026-10-25T07:03:03Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-4) | Dòng sổ đổi «lỗi kiểu» ở pipeline/scripts thành «lỗi cú pháp .mjs» với nguồn mot-loi, trong khi còn lối sống: cấy lỗi kiểu thật vào tệp có test phủ, hoặc tsc --checkJs | Người ký tưởng ngưỡng đạt ở cả năm module trong khi ở hai module JS chỉ đo vỡ cú pháp; lỗi kiểu thật như row.prce.toFixed() qua node --check | Thay d-4 bằng Hỏi-4 chỉ-người; ma trận AC-7 ghi loại lỗi, tệp cấy, bước đỏ | fixed: dòng sổ mới thay d-4 thành Hỏi-4 (nguồn chỉ-người, khuyến nghị cấy lỗi kiểu thật vào tệp có test phủ); AC-7 ghim tệp cấy và bước đỏ theo Hỏi-4 |
| P1 | evals | Chạy lại cục bộ chỉ rút dòng run:, bỏ node-version, kiến trúc, shell pipefail, continue-on-error, if:, CI=true, mạng, services, env | Workflow có continue-on-error hay pipe không pipefail: cục bộ đỏ đúng job mà CI thật vẫn success; gói native arm64 xanh cục bộ, amd64 đỏ CI | Rút đủ cấu hình từ workflow, bash -eo pipefail, CI=true, mạng chung; luật tĩnh cấm continue-on-error / or-true / if: trên bước typecheck-test | fixed: AC-6/E6 rút node-version, env, services, working-directory, chạy bash -eo pipefail với CI=true, node chung mạng PostGIS, in bảng cấu hình; AC-1/E1 cấm continue-on-error / or-true / if: kèm chiều đỏ; lệch arm64/amd64 ghi rõ là giới hạn, đo ở AC-8 (CI thật) |
| P1 | contract | AC-4/E4 không có danh sách ca bỏ qua viết trước, không trần; ca đỏ sẵn trên main không là tiền điều kiện của AC-6/AC-8 | Helper nuốt GT-AC-1, job-exit hay vài chục ca app, E6 xanh mà CI chạy test chỉ còn là vỏ | Danh sách bỏ qua viết trước, E6 so khớp đúng; AC-6/AC-8 ghi điều kiện sau bản sửa liên làn | fixed: AC-4 ghim scripts/ci-bo-qua.json (tệp · tên ca · lý do), cấm GT-AC-1/job-exit trong danh sách, chiều đỏ lời gọi ngoài danh sách; AC-6/AC-8 đứng trên main đã có fix/test-scripts-do-sau-87-90; E6 so tập bỏ qua thực tế với danh sách |
| P1 | evals | E3 không chỉ ra DB trống lấy từ đâu; ci-db-init có thể áp vào DB local thật :5433; danh sách migration lỗi đã khai không bị kiểm còn đúng | Người chấm chạy E3, script áp migration vào DB dùng chung đang có dữ liệu | E3 dùng PostGIS docker dùng một lần; script từ chối DB có bảng; báo danh sách cũ | fixed: AC-3 chạy trên PostGIS docker dùng một lần (không bao giờ :5433 của máy), từ chối DB đã có bảng ở public, mỗi migration trong danh sách đã khai phải còn lỗi thật (áp xanh → danh sách cũ), kèm ba chiều đỏ |
| P2 | contract | AC-1 ghim trigger cố định trong khi Hỏi-3 (a) cần push ci-probe/**; E1 bỏ kiểm khối services; lối (b) không ghi hạ ngưỡng | E1 đỏ oan hoặc bị nới mất răng; workflow thiếu service vẫn qua E1 | Trigger theo từng nhánh Hỏi-3, chiều đỏ push '**'; E1 kiểm services; E8 expected cho cả (a) và (b) | fixed: AC-1 trigger đúng tập theo Hỏi-3, chiều đỏ push '**'; E1 kiểm khối services kartoza 17-3.5 5433:5432 + healthcheck; E8 expected cho cả (a) và (b), AC-8 ghi opportunity phải nói rõ khi chọn (b) |
