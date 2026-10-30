---
slug: danh-ba-nguoi-tren-ops
at: 2026-10-30T14:38:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-5 ghi mục-tiêu (luật data-grid) nhưng câu trích không quyết việc cắt 500 người và bỏ phân trang máy chủ — data-grid nhận được trang từ máy chủ; đây là lựa chọn chỉ người có | Mạnh ký Cổng 1 tưởng duyệt được cả danh bạ; lọc S06 9.411 người mà trang chỉ có 500 người nhiều tin nhất, phần đông người ít tin bị khuất | Dòng sổ mới supersedes d-5, nguồn chi-nguoi (Hỏi-2) kèm khuyến nghị và lối khác có giá | human-gate1: Hỏi-2 (d-20261030T143037Z-9 supersedes d-20261030T142713Z-5); nháp theo khuyến nghị phân trang máy chủ 100 người/trang, AC-3 và E3 sửa theo, lối khác ghi ở Notes |
| P1 | evals | Không eval nào đo trang nói ra tổng số khớp và ba số đầu trang so với số kỳ vọng | Hàm trả đúng tổng nhưng trang không hiện; số đầu trang đếm cả người đã gộp và vai rút mà E2/E3 vẫn xanh | Assert trên HTML page thật với lô nhiều trang và ma trận bảy người, đối chứng dương lọc một trang | fixed: AC-3 thêm «Trang k/n · m người khớp» và ba số đầu trang; E3 đo trên HTML page thật (lô 230 người, ba số theo ma trận) kèm đối chứng một trang |
| P1 | evals | AC-6 cross-layer chỉ có E6 với getSessionUser giả; không quan sát phiên viewer thật | Phiên thật lấy vai đường khác; viewer thật thấy bí danh trong khi E6 xanh | Bước ui-check đăng nhập tài khoản thử viewer, đối chứng admin | fixed: AC-10 và E12 thêm bước đăng nhập viewer thật (dev-ops-account --vai viewer), so với giá trị bí danh đã thấy ở bước admin |
| P1 | evals | Ma trận E2–E5 chèn tay vào bốn bảng 055, không round-trip qua bên ghi thật | Bộ dựng thật ghi mã khác khuôn fixture; trang máy thu sai mà E2–E5 xanh | Đối chiếu trên DB máy thu với số đếm độc lập | fixed: E15 (AC-10) đối chiếu chỉ-đọc trên DB máy thu do bộ dựng thật ghi — tổng người, tổng tin, người gộp có hàng = 0, loại bí danh không nhãn = 0 |
| P1 | evals | Không phép đo nào quét giá trị bí danh thật tìm tên nguồn thật | Bí danh chứa tên nguồn thật hiện trên /ops/people; E7 xanh vì fixture tự đặt | Quét HTML trên DB máy thu với danh sách tên lấy trong ca test, đối chứng dương | fixed: DB máy thu có 1 tên hiển thị S06 chứa tên nguồn thật (đã đo) — giá trị bí danh đi qua maskSourceNames (sổ d-20261030T143037Z-10); AC-7/E7 thêm bí danh fixture chứa tên nguồn + đối chứng đóng chặt + chiều đỏ; E15 quét HTML thật |
