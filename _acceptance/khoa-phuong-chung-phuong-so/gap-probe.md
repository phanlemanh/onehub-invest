---
slug: khoa-phuong-chung-phuong-so
at: 2026-10-30T16:10:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ d-3 loại số 0 đầu, «P12» không chấm và slug phuong-12 mà ghi nguồn mục-tiêu; câu trích chỉ nêu «P.12» = «Phường 12», không quyết việc loại ba dạng kia, còn «khoá phường chung» đọc rộng được — [loc-enrich-thu-ops-audit#F1] | Mạnh ký Cổng 1 tưởng «khoá phường chung» đã phủ «P12», «Phường 01»; nguồn TP.HCM sau gộp vẫn Lệch và ra no | Đưa ba dạng thành câu Hỏi ở Cổng 1, dòng mới supersedes d-3 | human-gate1: dòng d-20261030T155644Z-5 (Hỏi-1) thay d-3 |
| P1 | evals | E2, E3 không ghim lượt xanh chạy soPhuong thật của judge-entity.ts; đối chứng đỏ chỉ tiêm qua tham số | Test truyền soPhuong rút từ app cho mọi cặp, bản agent vẫn giữ bước 3, E2 E3 vẫn xanh | Ghim apNguong gọi không tham số so phường; đối chứng đỏ trên bản chép judge-entity.ts có bước 3 | fixed: E2, E3 ghim đường mặc định; E2 thêm đối chứng đỏ 2 trên bản chép judge-entity.ts |
| P1 | evals | E4, E5 hứa «như trước vòng» mà chỉ đo exit 0 của tệp vòng này sửa | Lỡ đổi nhãn một ô TPL-AC-2 hay ma trận AC-1 PL25 khi thay ca cũ, tệp vẫn xanh | Đối chiếu ca và ma trận giữ lại với 3ad9d838 | fixed: E4, E5 ghim cỡ từng ma trận giữ lại theo nền 3ad9d838 và bước soát diff S4 xác nhận không ô nào đổi |
| P2 | evals | Thông điệp lỗi rút hàm của E2 còn mang «AC-4» của hồ sơ cũ | Đổi tên soPhuong ở app, người đọc Cổng 2 quy lỗi nhầm cho AC-4 | Ghim «KP-AC-2 không rút được» kèm đối chứng đỏ | fixed: E2 ghim «KP-AC-2 không rút được <tên hàm>» và đối chứng đỏ 3 |
