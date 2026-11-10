---
slug: dong-bang-stage-b-resolve
at: 2026-11-09T09:30:14Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-9 hứa test app, pipeline, agent và itest resolve xanh nhưng E9 chỉ chạy app_ui; không eval nào chạy resolve-properties-deadlock.itest hay s03-len-cong.itest | Bỏ Stage B làm đỏ itest resolve hay judge-run.test mà E9 vẫn xanh, AC-9 được ký PASS khi hai trên ba module không chạy | Thêm eval chạy itest resolve, s03-len-cong và test agent | fixed: thêm E9b (rtld_itest) và E9c (s03_len_cong_db); pipeline, agent npm test là suite chạy mỗi lượt (suite_keys) |
| P1 | contract | Tập bên đọc thẻ chờ rút từ grep entity_match/property_candidates nên sót câu đếm pending chung | Một câu đếm chờ chung vẫn cộng 7 thẻ Ghép căn mà E3–E6 xanh | Quét mọi câu FROM/JOIN review_queue toàn cây, câu đọc chờ phải có vị từ hoặc nằm trong danh sách miễn | fixed: quét lại thấy thêm data-flow-queries.ts (số Hàng duyệt) và bao-cao-ngay.mjs (H1) — vào AC-4, E4, E4b, vùng; AC-6, E6 đổi thành phép quét toàn cây có danh sách miễn và chiều đỏ câu mới |
| P1 | contract | Ba dòng bỏ design-pass, ui-observed, đặc-tả-UX chỉ đúng khi Hỏi-2 theo lối khuyên | Mạnh chọn thêm Alert mà gói không có AC, eval ui-check hay design-pass cho nó | Ba dòng bỏ có điều kiện + AC-10, E10 khai sẵn cho lối Alert | fixed: Notes của hợp đồng ghi điều kiện — chọn Alert thì thêm AC-10 + E10 ui-check ui-observed và dòng supersedes trước khi duyệt |
| P2 | evals | Mồi tự dựng lược đồ tối thiểu, thiếu FK/trigger thật; mồi thiếu thẻ hoãn | FK hay trigger thật đổi dòng cặp mà E1 không thấy; thẻ entity_match deferred hiện hay bị đếm sai mà E3 xanh | Dựng DB từ lược đồ thật; thêm G5 deferred vào ma trận | fixed: dbs_resolve chạy db-thu --chay (lược đồ thật, giao dịch ROLLBACK); E3, E4 thêm G5 deferred (hiện ở Đã quyết, không tính chờ); AC-4 ghi rõ hoãn không tính chờ |
| P2 | evals | E4b không có chiều đỏ cho do-the-duyet; E7 quét regex một dòng | Bộ nạp HD11 hỏng trả rỗng vẫn xanh; câu UPDATE viết hai dòng lọt quét | Ca đỏ do-the-duyet bản origin/main; quét trên khối thêm đã nối dòng | fixed: E4b thêm ba ca đỏ (bản tin cloud, báo cáo ngày, HD11) và đòi không lỗi SQL; E7 nối dòng thêm rồi tách câu, thêm chiều đỏ câu UPDATE hai dòng |
