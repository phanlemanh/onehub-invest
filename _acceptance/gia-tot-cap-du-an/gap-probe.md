---
slug: gia-tot-cap-du-an
at: 2026-11-15T07:38:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

# Gap probe — gia-tot-cap-du-an

Phản biện context sạch trên design doc, contract, evals, decisions.jsonl, opportunity.md và bài học xuyên tính năng (claim-scan).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Hạng cấp dự án tới cloud qua bảng offer_price_rank đã sync từ CG9 là lựa chọn chỉ Mạnh quyết, chưa có câu hỏi khó đảo; design §2.5 và §4 mâu thuẫn [bang-hang-gia-m2#F2] | Áp 106 rồi chấm trên máy thu, sync đêm chép dòng cap du_an và nhãn Giá tốt lên cloud và /v1/deals trước khi Mạnh có lời; E8 vẫn xanh vì chỉ soi diff | Câu chỉ-người kho_dao true + AC đo sync chép dòng du_an đúng số | fixed: thêm Hỏi-5 (sổ, kho_dao true, khuyến nghị đi cùng), sửa design §2.5, §3, §4 và Out of scope; AC-8, E8 đo sync-cloud chép dòng cap du_an đúng số đếm độc lập (đổi thành đếm 0 nếu Mạnh chọn đi sau) |
| P1 | contract, evals | Không ca nào cho môi trường có view 105 mà chưa áp 106 [s06-tran-trang#F1] | DV7 và CG10 gộp, 106 chờ lời áp; job đêm chạy mã main, chèn dải lỗi, cả giao dịch lùi, hạng không được chấm lại | AC-4 môi trường thứ tư + đột biến chèn dải không dò bảng | fixed: AC-4, E4 thêm môi trường «view mà chưa 106» — thoát 0, có dòng du_an, đúng một dòng «chưa áp 106 — bỏ dải diện tích»; design §2.2 ghi luật này |
| P1 | contract, evals | Ngưỡng OP1 ≥ 100 đếm bằng SQL riêng, không qua getDeals; danh sách cắt 30 và gom căn | E9 báo 141 tin trong khi màn lọc OP1 chỉ hiện 30 dòng-căn | E9 đếm qua chính câu SQL của getDeals({project:1}); AC-7 ghim giới hạn khi lọc dự án | fixed: lọc dự án giới hạn 300 dòng-căn (AC-7, E7 fixture 35 ra đủ 35); AC-9, E9 đếm op1_danh_sach_can qua câu SQL của getDeals (đo lại 15/11: 141 tin = 140 căn) |
| P2 | contract, evals | Trạng thái «dự án chưa đủ căn» và đếm tab theo dự án chưa có đường đo backend | Dự án có thật mà chưa đủ căn hiện «Không tìm thấy dự án»; tab đếm toàn quốc khi đang lọc OP1 | AC-7 thêm ba ca + E10 thêm khung | fixed: AC-7, E7 phân biệt id có thật 0 dòng (mang tên dự án) với id lạ, đếm tab theo dự án có đối chứng dự án thứ hai; E10 thêm bước 6 |
