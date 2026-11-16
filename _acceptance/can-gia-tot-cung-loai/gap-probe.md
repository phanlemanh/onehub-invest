---
slug: can-gia-tot-cung-loai
at: 2026-11-12T09:05:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ «không lùi về thước cả phường» ghi máy quyết, câu trích chỉ quyết cho tin chưa rõ loại; với tin đã có loại mà phường thiếu thước, lối lùi về quận × loại vẫn sống, và tin rời API công khai | 1.497 căn hộ, 237 tin thương mại mất số giảm mà không ai chọn | dòng sổ chi-nguoi kho_dao true, Hỏi-2 kèm số tin mất | human-gate1: dòng mới d-20261112T100012Z-9 thay d-20261112T095743Z-4, thành Hỏi-2 trên thẻ |
| P1 | contract | AC-7 chỉ đo đường pipeline trên dữ liệu thật; AC-5, AC-6 không có ca tin thuê | /v1/deals lệch hay trả tin thuê trên dữ liệu thật mà eval vẫn xanh | lech_api_app, lech_data_api, thue_api trên bản chép; ô tin thuê ở E5, E6 | fixed: AC-5, AC-6, AC-7, E5, E6, E7 thêm đo hai API trên bản chép và ô tin thuê |
| P1 | evals | E8 không ghim DB của bản chạy; DB dùng chung còn bait_gap_pct theo thước cũ | ảnh chụp đúng chữ nhưng số giảm mâu thuẫn trung vị in cạnh | bản chạy trỏ DB thử sau refreshBaitGap; assert số giảm = công thức | fixed: AC-8, E8 ghim DB thử oneinvest_u1_cg8 và thêm assert số |
| P1 | design | Không đo v_ruler_p2 trên cloud dù API công khai đọc cloud | /v1/deals lỗi 500 hay sai số sau triển khai | băm pg_get_viewdef hai phía, đếm dòng theo loại | fixed: thêm AC-10, E10 chỉ SELECT qua Management API |
| P2 | evals | Ma trận chỉ có căn hộ, nhà; đất, thương mại không có ô | khoá property_type lệch ở land/commercial mà eval vẫn xanh | ma trận 10 ô viết trước | fixed: AC-1 bốn loại, AC-2 bảy ô, E1, E2 sửa theo |
