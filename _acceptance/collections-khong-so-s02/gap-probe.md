---
slug: collections-khong-so-s02
at: 2026-10-25T04:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, evals | Đếm lính canh chưa ghim dạng in (thô / vi-VN / rút gọn) và thiếu đối chứng dương | Trang in «987.654», test tìm «987654», đếm 0, E6 xanh giả | Đếm mọi dạng; đối chứng dương trên bản sao gỡ ẩn; in số đếm trước/sau | fixed: Context ghim ba dạng đếm; AC-6 đòi đối chứng dương ≥ 1 lần mỗi hàng trên bản sao gỡ ẩn, in trước/sau |
| P0 | contract (d-4) | «Rotation chỉ còn đếm job» là nghĩa sản phẩm, sổ ghi máy quyết; số thị trường lại là số lượng S02 theo Context | Mạnh hiểu «job» là lượt chạy; trang hiện «N thị trường»; AC-4 và AC-6 mâu thuẫn | Đổi d-4 thành Hỏi, ghi rõ số nào được miễn | human-gate1: Hỏi-2 (supersedes d-4), nháp theo khuyến nghị — không số thị trường, con trỏ, tên |
| P1 | evals, design | Phía máy chủ dựng SSR từ records24h viết tay, không vòng nối từ bên ghi thật | Bên ghi đổi mã S02, bộ lọc trượt, máy chủ vẫn «Nhiều nhất: S02», E5/E6 xanh | Rút bản tin từ push-ops-facts thật qua readOpsFacts rồi dựng; chiều đỏ đổi mã | fixed: AC-5 máy chủ đi vòng trọn trên lược đồ tạm (S02 nhiều nhất), chiều đỏ mã «s02» thường; không gắn cross-layer vì vòng không ghi dữ liệu nào |
| P1 | contract, evals | Ma trận lính canh «viết trước» chưa được liệt kê, E6 không ghim số assert | Lính canh chỉ đặt vào trường đã ẩn, trường còn lọt không có lính canh | Liệt kê trường × nơi × giá trị; E6 in đúng N dòng | fixed: bảng 7 hàng trong Context; E6 đòi đúng 7 dòng, thiếu dòng là fail |
| P2 | contract, evals | Vế «getFlowDays không truy vấn airdna_*» không đo được bằng SSR | getFlowDays vẫn truy vấn rồi bỏ trường, E3 xanh | Ghi lại câu SQL chạy trên pool | fixed: AC-3 ghi mọi câu SQL trên pool thật, 0 câu chạm airdna_*, chiều đỏ báo tên bảng |
