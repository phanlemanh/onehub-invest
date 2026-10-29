---
slug: lb-ac-1-map-files-mot-nguon
at: 2026-10-29T10:30:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng một-lối chỉ loại ba lối; lối module chung (không phải tệp test) vẫn sống, và lối được chọn hạ vế «đúng trọn danh sách» của LB-AC-1 đã ký — việc chỉ người quyết. Cùng lớp [don-clone-tam-design-floor#F1], [m2-ac10-so-cap-co-dinh#F1]. | Cổng Phạm vi duyệt «chỉ một lối» không biết có lối giữ được vế đã ký; DHT-AC-5 bị gỡ thì không còn test nào giữ danh sách. | Dòng mới supersedes, hoặc thành câu hỏi, hoặc nêu ràng buộc giết lối module chung. | fixed: đổi sang lối module chung scripts/lib/map-files-mong.mjs (giám sát duyệt U1-67), dòng sổ mới supersedes dòng cũ; vế «đúng trọn danh sách viết trước» của LB-AC-1 giữ nguyên |
| P1 | contract | AC-2 nói quét toàn bộ tệp test nhưng glob bỏ sót app/eslint-plugin-onehub-ui/tests và test cạnh mã. | Một ca RuleTester ghim mảng chứa map-colors.ts lọt, lần đổi sau lại phải sửa tay. | Lấy tập quét bằng git ls-files *.test.* dưới app/ cộng scripts/*.test.mjs; ca dương ở thư mục test của plugin lint. | fixed: AC-2/E2 dùng git ls-files '*.test.*' dưới app/ + scripts/*.test.mjs, có bản sao giả dưới app/eslint-plugin-onehub-ui/tests; dòng descope coverage-scan sửa lời (supersedes) |
| P1 | evals | LBM-AC-2 đo chuỗi có mặt (một phần tử, nháy kép) trong khi lời hứa là quan hệ; ca đột biến viết đúng khuôn bộ quét; ROOT chưa ghim theo import.meta.url. | Ghim lại bằng nháy đơn, backtick lọt; ROOT trỏ checkout chính bỏ qua tệp vừa sửa. | Nhận diện theo quan hệ (≥2 phần tử của danh sách, mọi kiểu nháy); đột biến đủ ba dạng; ROOT theo import.meta.url. | fixed: AC-2/E2 nhận diện mảng chứa ≥2 phần tử của danh sách module bất kể nháy, ba bản sao nháy kép/đơn/backtick; gốc kho suy từ import.meta.url (khai ở đầu evals.yaml) |
| P1 | evals | E4 cũ tự dựng lại phép so (docMapFiles ≠ MAP_FILES_MONG) thay vì gọi phép kiểm thật của DHT-AC-5, không ghim thông điệp. | DHT-AC-5 thật so khác cách mà E4 vẫn xanh; «thêm vào cả hai nơi sẽ lọt» chưa được đo. | Gói DHT-AC-5 thành hàm dùng chung cho ca thật và ca đột biến, ghim thông điệp có map-extra.ts. | fixed: AC-3/E3 gói DHT-AC-5 thành kiemDanhSachBanDo(eslintSrc, skillSrc) dùng cho cả ca thật lẫn đột biến; thêm map-extra.ts vào eslint + SKILL.md → ném thông điệp có tên tệp |
| P2 | contract | OOS-1, OOS-2 không có dòng descope trong sổ. | Lệch chữ expected của hồ sơ đã ký không đi qua người. | Một dòng descope cho mỗi mục, nêu đường xử lý. | fixed: thêm hai dòng descope cho OOS-1 (nêu lệch con số và đường xử lý) và OOS-2 |
