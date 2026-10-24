---
slug: gio-ops-gio-vn
at: 2026-10-24T12:10:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
claims_input: ok
---

# Phản biện context sạch — gio-ops-gio-vn

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract AC-4 / evals E4 | Luồng 7 ngày chỉ nạp tin Zalo; Then chỉ «đếm vào»; không chứng truy vấn đọc lược đồ tạm | Chỉ sửa cột Zalo, cột khác vẫn ngày UTC mà E4 xanh; hoặc search_path rơi về public nên dữ liệu thật làm ca xanh | Ma trận mọi cột, assert nguyên bản đồ 7 khoá; search_path chỉ lược đồ tạm; chiều đỏ thiếu bảng | fixed: AC-4/E4 ma trận mọi cột (listings.last_seen kiểu date riêng), deepEqual bản đồ 7 khoá kể cả ô 0, search_path chỉ lược đồ tạm, chiều đỏ thiếu bảng tạm nêu tên |
| P1 | contract AC-6 / evals E6 | Chỉ đo vnDayKey/VN_DAY_SQL tách rời + quét tĩnh; không chạy bên ghi thật của số đẩy lên cloud | Bên ghi đổi sang date_trunc/to_char (vẫn UTC) hoặc funnel today UTC cách khác — E6 vẫn xanh | Gọi hàm dựng facts thật trên lược đồ tạm, assert khoá và số đếm; đưa payload qua nhánh cloud getFlowDays; thước tĩnh thêm date_trunc/to_char | fixed: tách hàm dựng zaloFlow + funnel vào pipeline/lib/ và đo trên lược đồ tạm (khoá + số đếm), thước tĩnh thêm date_trunc/to_char + chiều đỏ; deferred: đầu-cuối qua nhánh cloud getFlowDays — ghi Out of scope có tên |
| P1 | contract AC-7 / evals E7 | Ma trận mức trễ thiếu biên ≥48 giờ, 59/60 phút, 47/48 giờ, tuổi = SLO, tối thiểu 1 | Trễ 3 ngày hiện «trễ 72 giờ»; trễ 30 giây hiện «trễ 0 phút»; tuổi = SLO nhãn quá hạn mà không có «trễ» | Thêm dòng biên; AC-8 thêm ca nhãn quá hạn ⇔ có «trễ» | fixed: AC-7 11 dòng biên viết trước; AC-8 thêm ca tuổi = SLO và luật mọi nguồn stale có «trễ», nguồn không stale thì không |
| P1 | contract AC-3 / evals E3 | Thước tĩnh chỉ quét slice/toISOString trong components/app ops; bỏ src/lib, toLocale* không múi, getHours/getDate, SQL ::date/to_char | Component ngoài danh sách dùng toLocaleString — local đúng, Vercel ra UTC; truy vấn src/lib trả captured_at::date::text — AC-2/AC-3 vẫn xanh | Mở rộng phạm vi + mẫu, danh sách miễn viết trước, chiều đỏ mỗi mẫu | fixed: AC-3 quét thêm 4 tệp src/lib của Ops, mẫu toLocale* không timeZone, getHours/getDate, SQL ::date/date_trunc/to_char thiếu AT TIME ZONE; danh sách miễn viết trước kèm lý do; ba chiều đỏ |
| P2 | contract AC-1, AC-5 / evals E1, E5 | Fixture mốc viết tay dạng Z; ma trận thiếu chuỗi không ghi múi và +07:00 | Log ghi giờ máy không offset — Vercel hiện lệch, funnel sai ngày, E1/E5 xanh | Fixture từ khuôn bên ghi thật; thêm chuỗi không offset và +07:00; AC-5 chạy hai múi | fixed: đọc mã bên ghi — hook dùng toISOString (Z), watchdog dùng date -Iseconds (+07:00); AC-1 thêm +07:00 (đọc đúng) và chuỗi không múi (→ «—», không đoán); AC-5 fixture sinh bằng toISOString như hook, chạy dưới hai múi; AC-2 dùng đúng khuôn nguồn của từng chỗ |
