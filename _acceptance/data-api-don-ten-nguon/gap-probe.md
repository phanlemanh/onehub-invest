---
slug: data-api-don-ten-nguon
at: 2026-11-25T16:54:01Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-4/E4 chỉ so bảng/view và lỗi, không so quan hệ source_ids giữa 012, 013, 014 và mặc định cột | 013 và 014 lệch vai (s03-group) — không lỗi, danh sách bảng vẫn trùng, E4 xanh | Chụp source_registry + column_default trước/sau qua ánh xạ cũ→mới, đối chứng đỏ sửa một giá trị ở 013 | fixed: dungLuocDoMau trả thêm nguon + macDinh; ca cây thật so 29 mặc định cột và source_registry = ánh xạ của bản trước; đối chứng đỏ đổi s03-groups ở 013 (AC-4 b, c) |
| P1 | contract | Ô Coverage «Khác (md, json)» không có ca phá; bộ quét lọc theo đuôi | Tên thật ghi vào README hay tệp không đuôi lọt, thước vẫn SẠCH | Ca phá README và tệp không đuôi; in số tệp đã quét | fixed: bộ quét đọc mọi tệp chữ (bỏ lọc đuôi, chỉ bỏ tệp nhị phân); thêm ca README (md) và Dockerfile; dòng đầu CLI in số tệp đã quét (AC-3, E3, E5) |
| P2 | evals | E4 xanh cả khi ca bị skip | DATABASE_URL không tới container, hai ca skip, lệnh thoát 0 | Ghim pass/skip 0 hay thoát khác 0 khi có skip | fixed: lệnh bọc thoát 3 khi «ℹ skipped» khác 0 hay không ca nào chạy; đã thử chiều đỏ bằng bản bỏ DATABASE_URL (thoát 3) |
| P2 | evals | E2 gọi hàm thư viện, không chạy CLI | CLI nuốt lỗi rút tên rồi báo SẠCH | Chạy CLI với migration rỗng → thoát ≠ 0 + thông điệp; đối chứng dương đủ migration → 0 | fixed: thêm ca PB5-AC-2 CLI trên cây tạm hai chiều |
| P2 | contract | AC-1/E5 ghim cứng 89 cụm, 27 nằm ở src/routes mà PB2/PB3/HT20 đang sửa | Hàng khác gộp trước, E5 đỏ oan 88 ≠ 89 | Bỏ con số tuyệt đối khỏi tiêu chí xanh, giữ ≤ 89 | fixed: AC-1, E5 đổi thành «mọi cụm còn lại là định danh, số định danh ≤ 89»; giữ 52 vi phạm cho chiều đỏ trên sha cố định |
