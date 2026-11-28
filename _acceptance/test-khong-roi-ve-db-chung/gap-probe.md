---
slug: test-khong-roi-ve-db-chung
at: 2026-11-27T01:25:00Z
verdict: findings
p0: 0
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Ca «thiếu URL» của RV-2 chỉ an toàn khi rào còn đứng — tệp mất rào chạy thiếu URL sẽ rơi về DB chung :5433 thật | Rào lùi ở nhánh sau, RV-2 ca thiếu URL làm tệp dựng bảng và ghi vào DB máy thu, lặp sự cố 21/11 | Ca thiếu URL chạy sau ca cổng chết và chỉ khi ca ấy xanh | fixed: RV-2 chạy ca cổng chết TRƯỚC cho từng tệp, assert đầu đỏ thì vòng dừng nên ca thiếu URL không bao giờ chạy trên tệp mất rào (đã thử chiều đỏ 27/11: bỏ rào check-freshness, RV-2 đỏ ở ca cổng chết, DB chung không đổi — 24 bản thu test giữ nguyên); ghi vào expected E1; RV-3 đột biến chỉ dùng cổng chết |
| P1 | evals | AC-3 hứa ca vẫn chạy ở CI, nhưng không eval nào chạy hai tệp khi CI=true và đòi 0 ca bỏ qua | Ở CI rào trả URL sai, ca bỏ qua vì DB không tới, «0 fail» cho xanh rỗng | Chạy thật với CI=true, đòi skip = 0, chiều đỏ cổng chết | fixed: thêm `kiem-ht35.mjs chay [--ci]` đòi fail 0 và skipped 0; E3c (CI=true, URL của lượt) và E5 (ngoài CI) đo 78/78, 0 bỏ qua; chiều đỏ cổng chết: skipped 60, exit 1. Ô CI thiếu URL chỉ đo được trên runner GitHub: job pipeline và scripts của PR |
| P1 | evals | E7 chỉ đọc chuỗi config, không chạy các lệnh đã bọc; số hồ sơ bị chạm ghi lệch 26/28 | Sau gộp, làn ghim lại của hồ sơ đã ký đỏ hàng loạt trên bản chép thiếu dữ liệu, E7 vẫn xanh | Chạy từng khoá đã bọc một lần, so số trước/sau | fixed: thêm E7b (check_freshness), E7c (s08l_do), E7d (trọn scripts/*.test.mjs qua db-thu, so 653 pass của soát M5); sổ ghi dòng sửa số: 28 lượt tham chiếu (23 + 3 + 1 + 1), không phải 26 |
| P2 | evals | Vế «giữ tác giả» của E6 bị hiểu là chỉ in tác giả 3cb318df3; AC-6 nói «một dòng import» lệch với 4 dòng E6 cho | Cherry-pick làm lại đổi tác giả mà E6 vẫn xanh | So tác giả commit trên nhánh với 3cb318df3 | fixed: AC-6 viết lại đúng bốn dòng; E6 đã so cặp tác giả + tiêu đề của commit trên nhánh (`git log -- <tệp>`) với 3cb318df3 — commit khác tác giả thì không khớp, FAIL |

## Ghi sau S4 vòng 2 (27/11) — phần để HT36

Bảng phủ AC-8 dựng theo luật «`DATABASE_URL ?? '<chuỗi literal>'`, lần xuất hiện đầu»: lớp tệp rơi về DB chung qua hằng, hàm hay lần
xuất hiện sau chưa được quét. Đếm chỉ đọc trên HEAD: 4 tệp qua hằng/hàm (dev-ops-account.test, dev-register-check.test, job-exit.test,
ops-nhan-ma-nguon-cloud.test), 1 tệp nhiều lần khác nhau (db-thu.test, chuỗi mẫu). Mở rộng ở HT36: giải hằng, quét mọi lần, đếm lại.

