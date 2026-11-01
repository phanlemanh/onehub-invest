---
slug: main-xanh-duoi-tai-db
at: 2026-11-01T02:10:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract/evals | AC-7 (E7, E8) không bắt có tải lúc chạy. GWT chỉ nói «Given DB local dùng chung», không nói phải có phiên khác đang ghi. | Bằng chứng E7/E8 lấy lúc DB rảnh. Đêm sau job giữ khoá 044 lâu hơn tổng thời gian thử lại, AC-10 lại đỏ. | Chạy E7/E8 trong lúc một bộ ghi tải giả commit liên tục vào bảng public và giữ khoá bảng 6–10s, lặp 3 lần. | rejected: tải giả phải commit dòng vào public của DB dùng chung — trái luật chỉ ghi trong giao dịch lùi. Tranh khoá thật được chứng ở E1 (55P03) và E9 (40P01). AC-7 sửa chữ thành bộ module xanh ở trạng thái DB lúc chấm, không hứa «dưới tải». |
| P1 | contract/evals | Coverage «deadlock» ghi do AC-1 phủ, nhưng E1 chỉ tạo 55P03; mã 40P01 đo được trên main không ca nào tạo. | apLaiChiuTai lọc sai 40P01, hoặc ROLLBACK TO SAVEPOINT sau deadlock không cứu được giao dịch. E1 vẫn xanh. | Ca deadlock thật bằng hai advisory lock chéo, đối chứng áp thẳng reject 40P01. | fixed: thêm AC-8 + E9. Hai advisory lock chéo, phiên B đặt deadlock_timeout dài để phía test là nạn nhân. Đối chứng: áp thẳng reject 40P01. Áp qua apLaiChiuTai thì thử ≥ 2 lần và giao dịch dùng tiếp được. |
| P1 | evals | Không assertion cho trần thử lại: hết 5 lần thì phải ném mã gốc. | Code nuốt lỗi sau lần thứ 5, AC-10 xanh giả. | Giữ khoá suốt lượt, lock_timeout 200ms qua tham số: reject 55P03, số lần thử đúng 5. | fixed: thêm AC-9 + E10. apLaiChiuTai nhận tham số lockTimeout, lanToiDa, lui. Lỗi ném ra mang số lần đã thử. |
| P1 | evals | Fixture E5 tự dựng chuỗi dấu bên đọc. Các dấu hd9, td-, mã người lược đồ tạm, tên lược đồ tạm chưa ca nào đo. | Code lượt thật ghi public bằng dạng khác bộ dấu, kiểm thành rỗng nghĩa. | Ma trận mỗi dấu một dòng đếm đúng 1; dòng do bên ghi thật tạo. | fixed: E5 thành ma trận đủ sáu dấu, mỗi dấu một dòng đếm đúng 1. Mã người đến từ taoNguoi (helper ghi thật của lượt) trên lược đồ nháp. Chạy cả lượt qua search_path trỏ nhầm: deferred, đắt hơn phần sửa. |
| P2 | evals | AC-3 «mọi kiểm cũ còn nguyên» chỉ đo bằng exit 0. | Có người nới assert trong AC-10, E3 vẫn xanh. | Kiểm diff khối AC-10 so với main. | deferred: diff của khối AC-10 nằm trong PR (một dòng gọi đổi). Thước diff cần executor mới trong config.yaml, ngoài vùng hàng. |
