---
slug: ops-nhan-ma-nguon
at: 2026-10-24T07:07:41Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | AC-4/E4 chỉ quét giá trị của jobs và sourceRuns, phần còn lại của payload bị đẩy sang NT2 không có dòng sổ, trong khi Đường đo ghi cả ngưỡng «payload facts» | Mạnh chọn «giá trị» ở Hỏi-1 vì tin mọi giá trị đã soát; một chuỗi trạng thái ống S03 mang tên kênh thật vẫn lên cloud, E4 vẫn xanh | AC-4 quét MỌI giá trị chuỗi của payload bắt được, chỉ miễn đường có tên; chiều đỏ chèn tên ngoài jobs | fixed: AC-4 và E4 quét mọi giá trị chuỗi, miễn đúng hai đường có tên (zaloGroups[].name tầng C, zaloAccounts[] cho NT2), thêm chiều đỏ «giá trị ngoài jobs mang tên thật → nêu đường JSON»; Đường đo ghi PROXY hai đường miễn |
| P1 | design | Bộ che lấy danh sách tên lúc chạy từ source_registry, không nói gì khi không đọc được bảng nên mặc định là mở toang | DB tắt lúc launchd chạy; danh sách rỗng, lastLine có tên thật lên cloud | Ca DB không tới được: lastLine null, có đối chứng dương | fixed: bộ che đóng chặt (danh sách rỗng → null) ở AC-7 + E7; AC-5/E5 thêm ca DB không tới được → lastLine null kèm đối chứng dương; design ghi push-ops-facts dừng ở connect() trước khi dựng payload (AU13 AC-4) |
| P1 | evals | E3 quét LỚP chữ hiển thị mà không có ma trận viết trước; khoá giới hạn bảy tên, template literal qua {…} lọt; việc miễn định danh không có dòng sổ | Chuỗi ở khoá message/hint hoặc template literal ở nhánh fixture không bật lọt cả hai thước | Ma trận viết trước từ cây gốc, bộ quét phải bắt đủ; chiều đỏ template literal và khoá ngoài danh sách; dòng sổ miễn định danh | fixed: AC-3/E3b ghim ma trận scripts/fixtures/ops-tier-a-matrix.json (dựng ở S3 trên cây gốc 460e61a trước khi sửa), ba chiều đỏ (tiêu đề, template literal, khoá ngoài danh sách); bộ quét đọc cả chuỗi trong {…}; dòng sổ d-20261024T070718Z-12 miễn định danh; Đường đo ghi PROXY |
| P1 | evals | AC-6(b) dùng facts.sourceRuns tự dựng đúng khuôn bên đọc; AC-1 bơm vai trò sẵn nên trang /ops/collections không được đo | Bên ghi đẩy sourceRuns thiếu label_vi hoặc trang quên truyền vai trò; cloud hiện mã trần mãi, E1/E6 xanh | E6(b) và một ca trang cloud lấy đúng payload push-ops-facts thật đẩy | fixed: AC-2/E2 thêm ca trang /ops/collections thật ở chế độ cloud với payload do push-ops-facts thật đẩy trong cùng ca; E6(b) dùng sourceRuns từ payload đó |
| P2 | evals | Neo #nhom-s03 đổi ở hai tệp mà AC-1 chỉ đo chuỗi có mặt, không đo quan hệ href ↔ id | Ô KPI trỏ #nhom-s03 nhưng id ở view vẫn cũ; bấm không cuộn, mọi eval xanh | Mỗi href="#…" có đúng một id khớp trong HTML; chiều đỏ đổi id | fixed: AC-1/E1 thêm ca neo và chiều đỏ đổi id |
