---
slug: nap-lai-khong-xoa
at: 2026-10-26T08:00:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design §3 + sổ d-5 + evals E4 | Khoá neo sớm nhất ghi máy quyết (một lối) nhưng lối «khoá dính» chưa bị loại; tiền đề repost mới đến sau sai khi thu bù lịch sử | Thu bù kéo post cũ hơn neo → offer_id đổi trong lượt thường, thẻ và link trỏ tin đã nghỉ | Dòng sổ mới thay d-5 thành câu hỏi; E4 thêm dòng post sớm hơn neo đến sau | human-gate1: PL14-Hỏi-3 (khuyến nghị khoá dính), dòng sổ chi-nguoi supersedes d-5; AC-4 + E4 thêm ca thu bù |
| P1 | contract AC-5/AC-7 + evals E5/E7 | Ma trận chỉ đếm có mặt; RESTRICT khiến đếm luôn bằng nhau dù dòng con bị bỏ lại trên tin nghỉ | Đổi khoá quên chuyển ứng viên ghép/liên kết căn; quyết định mất hiệu lực mà thước xanh | Cột «trỏ cha sống theo superseded_by» + đối chứng hàm không chuyển dòng con | fixed: AC-5/AC-7 + E5/E7 thêm cột quan hệ và đối chứng khong-chuyen |
| P1 | design §3 + AC-1/AC-2 + E1/E2 | RENAME giữ phụ thuộc theo OID; view khác trên sale_offers sẽ đọc bảng bản ghi (thấy tin nghỉ); E1 bỏ v_ruler_p2_area | Một view/matview khác hiện tin ma | Kiểm pg_depend tập phụ thuộc = danh sách cho phép + đối chứng view phụ | fixed: AC-1 + E1 thêm kiểm pg_depend, v_ruler_p2_area, đối chứng v_thu_phu |
| P1 | Coverage + AC-6/AC-7 + E6/E7/E8 | Đêm (200_transform) và nhánh transform-airbnb không có ca; ma trận AC-7 thiếu nights/listing_stats | Đổi cha sang retired_at nhưng vẫn xoá đêm — mọi eval xanh | Thêm hàng nights/listing_stats, ca transform-airbnb, ca 200_transform | fixed: AC-6 + E6 thêm hai đường và ca 200_transform; ma trận AC-7 lên 7 hàng |
| P1 | sổ d-1/d-3 + opportunity + Notes | d-3 kho_dao false dù đổi lược đồ khó đảo; mã «Hỏi-1» trùng với Hỏi-1..7 của gói OCP1 | Giám sát hiểu nhầm đã duyệt rồi ký thay Mạnh | Dòng mới thay d-3 kho_dao true; đổi mã PL14-Hỏi-n; Notes ghi Mạnh ký | fixed: dòng sổ PL14-Hỏi-1 kho_dao true supersedes d-3; Notes nêu ba câu PL14-Hỏi-1..3 và Mạnh ký cả hai cổng |
