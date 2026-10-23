---
slug: canonical-khong-tin-gia
at: 2026-10-23T09:26:44Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Thước dư lượng không có đối chứng dương trên dữ liệu thật; E9 viết tay offer đúng khuôn bên đọc, không đi qua writer thật | measureResidue khớp post_ids hay băm SĐT khác khuôn writeOffers đang lưu → before=0, after=0, E8 và E9 vẫn xanh dù thước mù | E9 dựng offer qua runTransformZalo; E8 đối chiếu before với cách đếm độc lập | fixed: E9 dựng offer bằng runTransformZalo (post thường) rồi mới gắn dấu TEST trong stg, đo bằng measureResidue — round-trip writer thật; E8 in thêm before_sql (đếm bằng SQL độc lập theo snapshot_id/agent_id/group_name) và đòi before = before_sql |
| P1 | evals | AC-2 hứa offer từ post thật không đổi nhưng E2 không đo vế đó | Lọc sau bước gom băm → offer trộn giữ SĐT, first_seen của post thử, E2 vẫn xanh | So mọi cột offer chứa p_real giữa lượt có và không có p_test, p_test mang SĐT khác và posted_at sớm hơn | fixed: E2 thêm so toàn bộ cột (trừ cột thời điểm ghi) giữa lượt A (không p_test) và lượt B (có p_test khác SĐT, đăng sớm hơn) |
| P1 | design | Khẳng định cloud tự sạch ở lượt sync kế mà không xét chặn tụt 50% của sync-cloud [cloud-sync-atomic#F2] | sellers 1.043 → 54 (5%) → mọi lượt sync dừng «shrink», cloud đứng yên cả tin giả lẫn dữ liệu mới | Đối chiếu SHRINK_MIN của sync-cloud.mjs với tỉ lệ còn lại sau dọn; dưới ngưỡng → câu hỏi người | human-gate1: xác nhận bằng đọc pipeline/sync-cloud.mjs:115,495 (SHRINK_MIN 0.5, áp mọi bảng). Thêm Hỏi-4 (chi-nguoi, kho_dao true) + AC-10 nháp theo khuyến nghị; E8 in tỉ lệ còn lại từng bảng FILL bị đụng |
| P2 | contract | Đường xoá sellers mới chưa có bản kê phụ thuộc; E8 so số dòng chỉ ba bảng | Bảng có khoá ngoại CASCADE tới sellers bị xoá theo mà không eval nào thấy | pg_constraint confrelid = sellers; E8 so mọi bảng có khoá ngoại tới sale_offers/sellers | fixed: đo 23/10 có 0 khoá ngoại tới sellers (ghi vào Coverage Trục B); E8 so số dòng 7 bảng viết trước: sale_offers, sellers, ops_audit, review_queue, enrichment_proposals, property_offers, property_candidates |
| P2 | evals | Quét mã theo danh sách tệp chọn tay | Đường đọc stg thứ ba hay script DELETE mới ngoài 4 tệp đưa post thử vào canonical, E3/E4 vẫn xanh | Quét toàn pipeline/ + agent/ theo quan hệ, so với danh sách cho phép viết trước | fixed: E3 quét mọi tệp mã trong pipeline/ và agent/src — tập tệp vừa đọc stg_zalo_posts vừa ghi sale_offers (writeOffers hay INSERT INTO sale_offers) phải RỖNG; E4 quét mọi tệp mã không phải test trong pipeline/, agent/src, app/src, data-api/src, scripts/ — tập DELETE FROM sale_offers phải bằng danh sách cho phép (chỉ chú thích ở pipeline/lib/write-offers.mjs) |
