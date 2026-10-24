---
slug: deals-loai-tin-phi-ly
at: 2026-10-24T11:53:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | Không đo thứ tự giữa LIMIT 30 và bước xếp nhóm; E4 chỉ 6 dòng; lối thoát E7 xét danh sách đã trả; Đường đo hứa in 5 tin đầu mà E7 không có | dealsSql sắp giảm dần LIMIT 30 rồi mới chia nhóm → 30 thẻ vẫn toàn tin sát trần mà E4, E7 xanh | Ca nhiều dòng hơn LIMIT; lối thoát E7 đếm trên toàn DB; E7 in 5 tin đầu | fixed: thiết kế mục 4 ghim ORDER BY nhóm trong SQL trước LIMIT; AC-4 thêm vế sắp trước khi cắt; E4 thêm ca 31 tin 36–50% + 1 tin 20% với chiều đỏ; E7 lối thoát chỉ khi đếm toàn DB tin 5–35% = 0, in dòng 5 tin đầu |
| P1 | evals | Vế «không loại thì không ghi dòng» của AC-2 không đo; E2 chạy trên DB thật luôn có tin phi lý; by_reason/offer_ids chỉ assert chứa | Bản ghi audit mỗi lượt hay mỗi lý do vẫn qua E2; ca có thể skip khi không có thước | Tách hàm nhận tập offer; ca dương assert bằng; ca âm so số dòng trước/sau; không skip | fixed: hàm loaiTinPhiLy(c, rows); E2 (a) đúng 1 dòng, total 3, by_reason bằng, offer_ids bằng; (b) chiều âm số dòng trước = sau; không có phường có thước → FAIL có tên |
| P1 | evals | Bản cloud AC-5 chạy trên lược đồ local đủ bảng/cột; quét âm 3 chuỗi viết tay; không chứng bait_gap_pct lên cloud | Bản cloud còn tham chiếu bảng/cột vắng trên cloud → prod 500 mà E5 xanh | Xoá bảng + cột (rút từ cấu hình sync) trong giao dịch rồi chạy; assert CLOUD_ALLOW có bait_gap_pct | fixed: AC-5 viết lại; E5 DROP stg_zalo_posts + cột PII_EXCLUDE.sale_offers import từ pipeline/sync-cloud.mjs, đối chứng bản đầy đủ lỗi trên lược đồ đã xoá, assert CLOUD_ALLOW.sale_offers chứa bait_gap_pct |
| P1 | design | NULL vào cột dùng chung đổi registry người bán (median gap, số deal tốt) mà không dòng sổ, không AC | Người bán đăng tin mồi bị giấu khỏi median gap, số mới lên cloud | Dòng sổ + AC đo median/n_good trước-sau | fixed: luật chạy SAU bước người bán (registry giữ nguyên) — dòng sổ d-…-9 (một-lối); AC-2 thêm vế registry giữ nguyên, E2 ca refreshBaitGap so median_gap_pct và n_good_deals với giá trị tính trên cả 4 tin, có chiều đỏ |
| P2 | evals | Vế nhãn «cần xác minh» là quan hệ mà E6 đo bằng chuỗi trong page.tsx | Điều kiện đảo vẫn xanh; nhãn hiện trên tin thường | Tách component, render thẻ suspect true/false | fixed: thẻ tách thành DealCard; E6 vẽ trong jsdom thẻ suspect true/false và n_reposts 1/3; AC-6 viết lại |
