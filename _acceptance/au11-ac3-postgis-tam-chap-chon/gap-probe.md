---
slug: au11-ac3-postgis-tam-chap-chon
at: 2026-11-12T02:10:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | E3 không có chiều đỏ, không chứng tải làm đỏ được bản cũ; số tiến trình viết cứng | Bản cũ cũng xanh 10/10 dưới tải, bản mới xanh không chứng gì, lượt ghim lần ba vẫn đỏ | Chạy bản cũ dưới cùng tải, đòi ít nhất một lần đỏ Connection terminated, tiến trình theo availableParallelism | fixed: AC-3 và E3 chạy bản cũ (git show origin/main) trước tới 10 lần dưới tải, không đỏ lần nào thì TAI KHONG TAI HIEN LOI CU; số tiến trình theo os.availableParallelism() |
| P1 | evals | E2 dò chuỗi mã nguồn, không chạy đường hết hạn và đếm lại | Bộ đếm không về 0 hay setupErr không ném mà E2 vẫn xanh | Tách hàm chờ nhận nguồn giả, ca hết hạn và ca ok lỗi ok ok | fixed: AC-2 thành hàm choPostgisTam với ba ca thuần (không mốc hết hạn, ok lỗi ok ok sau 4 lần, ok lỗi ok hết hạn) |
| P1 | evals | E4 chỉ ghim tên ca, không đòi không SKIP, không đo thông điệp; vế ci-db-init nằm ở E2 | Docker không chạy thì ca cũ bỏ qua mà E4 vẫn xanh; thông điệp cũ bị sửa không ai bắt | Đếm ok không SKIP từ TAP; so thông điệp với merge-base; diff ci-db-init về AC-4 | fixed: E4 đòi năm dòng ok không SKIP; E5 mới (cho-tinh.mjs) so thông điệp assert cũ với merge-base và diff ci-db-init, có chiều đỏ |
| P2 | evals | Bộ log của AC-1 chép tay, không round-trip từ docker logs thật | Code chỉ đọc stdout nên không bao giờ thấy mốc, E1 vẫn xanh | Probe chạy daQuaKhoiDongLai trên docker logs 2>&1 thật và so dòng mốc | fixed: E3 lưu docker logs gộp stdout và stderr, đòi LOG THAT KHOP MOC |
