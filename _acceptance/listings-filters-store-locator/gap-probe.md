---
slug: listings-filters-store-locator
at: 2026-10-26T02:40:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions + contract AC-2 | Bộ trường lọc (Phường, Loại phòng, Phòng ngủ, Giá/đêm) là nghĩa sản phẩm người dùng thấy mà sổ không có dòng chỉ-người; câu giao không nêu trường [ty-le-listing-khu-vuc-gop#F1] | Mạnh ký tưởng chỉ đổi component; nhà đầu tư không lọc được theo công suất/doanh thu, E2/E3 vẫn xanh | Dòng Hỏi-5 chi-nguoi; AC-2 và Trục A ghi theo Hỏi-5 | human-gate1: thêm Hỏi-5 (khuyên bốn trường, lối khác thêm Công suất/Doanh thu kèm giá); AC-2 «bốn trường đã chọn ở Hỏi-5», Trục A gắn [GIẢ ĐỊNH] |
| P0 | decisions d-1 + contract AC-4 | d-1 ghi mot-loi nhưng hành vi «áp từ ngăn thay mất điều kiện chip ngăn không biểu diễn được» còn lối khác sống; không AC nào đo dòng báo [audit-all-doc-log-o-checkout#F1] | Chip «không phải Phòng riêng» + «bằng 2» ở 1280 px, thu khổ, áp từ ngăn → hai điều kiện mất im lặng; E5/E6 vẫn xanh | Quyết cách xử lý; vế AC-4; ca E5 có dòng báo + cây sau áp | fixed: code giữ nguyên điều kiện ngoài ngăn (`facetsFromQuery` trả `rest`, `queryFromFacets(f, rest)`), dòng báo «Còn N điều kiện…», «Xoá hết» bỏ cả; dòng sổ mới thay d-1; AC-4 thêm vế; E5 thêm ca 'LB-AC-4 điều kiện ngoài ngăn' (đối chứng 0 dòng báo); E2 khứ hồi có rest |
| P1 | evals E1 | AC-1 hứa maplibre-gl không đổi nhưng E1 chỉ đọc package.json (^6.14.0 vẫn nhận 6.16), không đọc package-lock | Lock giữ 6.16 → npm ci trên Vercel cài 6.16, worker lệch thêm, E1 vẫn xanh | So version trong package-lock với bản main, chiều đỏ bản sao 6.16.0 | fixed: E1 so package.json + package-lock.json với merge-base main (không ghi cứng), chiều đỏ ghim thông điệp; AC-1 thêm vế lockfile |
| P1 | evals E13 | AC-9 hứa chữ Alert + Thử lại nhưng E13 chỉ đọc cấu trúc cây, không dựng lỗi | RegionError không bắt được lỗi bản đồ / Alert thiếu Thử lại mà E13 vẫn xanh | Ca dựng lỗi thật cho vùng bản đồ và vùng listing, đối chứng 0 alert | fixed: E13 thêm ca 'LB-AC-9 lỗi dựng thật' (thành phần ném lỗi trong RegionError bản đồ cạnh 6 thẻ, và vùng listing cạnh PageHeader; chữ ghim nguyên văn, có Thử lại; đối chứng lành → 0 alert). Lỗi WebGL bất đồng bộ của mapcn đi qua `setMapInstance(() => { throw })` → ném lúc render, cùng đường với ca này |
| P2 | evals E8 | E8 chỉ đo Ctrl/⌘+lăn lọc vùng, không đo lăn thường không zoom | Mất cooperativeGestures → lăn cuộn trang thành zoom bản đồ, bật lọc vùng ngoài ý muốn | Ô ma trận lăn thường: zoom giữ, 0 badge, scrollY tăng | fixed: E8 + AC-6 thêm ô «lăn thường → zoom không đổi, không badge, trang cuộn», cùng vị trí chuột với ô ⌘+lăn |
