---
slug: luong-7-ngay-dung-so
at: 2026-10-25T00:58:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | Không phép đo nào nối bên ghi thật qua readOpsFacts tới CloudCollections; AC-5/AC-6 dựng SSR từ CloudOpsView viết tay | Bên ghi phát khoá khác tên hoặc khoá ngày ISO, E3–E6 vẫn xanh, máy chủ thật hiện 14 ô «—» mãi | AC-5 dựng bản tin bằng captureOpsFacts trên lược đồ tạm, qua readOpsFacts rồi SSR; chiều đỏ đổi tên khoá | fixed: AC-5 thêm vế vòng trọn + chiều đỏ đổi tên khoá, mốc đo ghim 00:30 giờ VN |
| P0 | design | d-5 máy tự quyết «cột thô» là S01 snapshot; câu trích không quyết cột nào; cột mang chữ «thô» là S03 bài thô | Mạnh hiểu «cột thô» là bài thô, ký Cổng 1, máy chủ vẫn hiện số ở cột đó | Dòng Hỏi chi-nguoi thay d-5 | human-gate1: Hỏi-1 (dòng sổ mới supersedes d-20261025T004855Z-5), nháp theo khuyến nghị |
| P1 | evals | AC-6 «cũ → mờ» thiếu đối chứng dương; ô «Chỉ ở máy thu» vốn mờ nên kiểm theo hàng xanh giả | Bản sao luôn mờ hoặc không bao giờ mờ ô S03 vẫn qua | Ma trận 14 ô theo cột × ngày, hai chiều | fixed: AC-5 đòi 14 ô không mờ ở ca tươi, AC-6 đòi 14 ô mờ ở ca cũ, đọc từng ô, hai chiều đỏ nêu tên ô |
| P1 | evals | E8 có thể xanh rỗng khi 7 ngày không có tin S03; lối thoát chiều đỏ quá rộng | E8 in 7 dòng 0 = 0 ≤ 0, exit 0, Cổng 2 đọc là đạt | Đòi ≥ 1 ngày có tin S03, chiều đỏ chỉ bỏ khi 0 tin nguồn khác và in số | fixed: AC-8 + E8 đòi k ≥ 1 ngày, thoát đỏ có tên khi k = 0; chiều đỏ chỉ bỏ kèm con số đếm |
| P1 | contract | d-11 bỏ ui-observed với căn cứ một-lối nhưng lối next dev trên lược đồ tạm vẫn sống [d-20261024T232004Z-14] | Người ký chỉ đọc tên ca SSR, ô canh trái hay tràn 390px không ai thấy | Ca trình duyệt chụp ba trạng thái × hai khổ, hoặc chuyển thành Hỏi | human-gate1: Hỏi-2 (supersedes d-20261025T004855Z-11); nháp theo khuyến nghị — thêm AC-9 smoke Chromium có ảnh, giữ bỏ ui-check |
