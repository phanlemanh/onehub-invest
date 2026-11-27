---
slug: can-gia-tot-ba-vai-ten-nguon-trong
at: 2026-11-22T08:06:30Z
verdict: findings
p0: 1
p1: 2
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-2) | «Một lối» bỏ dòng không tên chưa loại phương án báo số dòng bỏ và chặn khi danh sách rỗng; không AC ghim hành vi khi mọi dòng bị bỏ | DB thử chỉ có dòng không tên: danh sách rỗng, mọi trang «không lộ tên nguồn» giả, thước E10 CG1 ghim bằng chứng sai — nới bộ soát tầng A không ai thấy | AC-4: dừng mã khác 0 với thông điệp ghim, in số dòng bỏ; đối chứng một tên chạy tiếp | fixed: thêm batBuocCoTen + AC-4/E4 (script dừng «chưa đo được» thoát 2, in số dòng bỏ); dòng sổ mới supersedes d-2 nêu lối báo/chặn |
| P1 | evals E3, E1 | E3 chỉ dò chuỗi mã nguồn; fixture E1 viết tay, không round-trip câu SQL thật | Câu SQL đổi bí danh hay lower sẵn: hàm đọc undefined, bỏ hết, mọi trang xanh, E1–E3 vẫn xanh | Chạy đúng câu SQL của script trên DB của lượt có cấy dòng rỗng | fixed: câu đọc dời vào CAU_TEN_NGUON + napTenNguon; AC-5/E5 chạy trên DB thử (db-thu) cấy '' và '   ', so với đếm độc lập, đột biến không lọc đỏ; NULL không cấy được ở public (NOT NULL, migration 012) |
| P1 | evals E3 | AC-3 đòi cả hàm soát nhưng E3 chỉ kiểm hàm dựng danh sách | Script giữ phép so includes trên chữ chưa hạ thường: tên viết hoa lọt, E2, E3 vẫn xanh | Assert script gọi coTenNguonTrong + đột biến thay bằng includes | fixed: E3 thêm assert coTenNguonTrong(tenNguon, s) và đột biến «soát trang bằng includes trực tiếp» đỏ với thông điệp ghim; giới hạn đọc mã nguồn ghi trong expected E3 |
