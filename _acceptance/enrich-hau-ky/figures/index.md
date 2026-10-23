# Hình tại điểm quyết định — enrich-hau-ky

| Điểm | Đếm | Hình |
|---|---|---|
| Đối soát offer cũ khi nạp lại (AC-1…AC-4, Hỏi-1) | 3 nhánh rẽ (giữ nguyên · có offer kế · không offer kế) + 4 bước nối tiếp | cần hình: `doi-soat.html` |
| Hoàn tác một lượt áp (AC-6, Hỏi-2) | 2 nhánh rẽ (áp còn nguyên · đã đổi/không applied) + 4 bước | cần hình: `hoan-tac.html` |
| Luật E1 loại BĐS (AC-8, AC-9) | 2 bước, 1 nhánh (tin khớp / dự phòng tên nhóm) | dưới ngưỡng: 2 bước · 1 nhánh |
| Các dòng sổ máy quyết khác (13 dòng) | lựa chọn đơn, không rẽ | dưới ngưỡng |

## Đề bài

### doi-soat (flowchart)
- Nút: «Transform nạp lại S03/S05» → «Upsert offer (giữ cột đã enrich)» → «Offer không còn trong lượt?» rẽ ba:
  (a) còn → «Đề xuất · thẻ · giá trị giữ nguyên» ;
  (b) có offer kế chung post_id → «Chuyển đề xuất (trùng khoá: dòng đã quyết thắng)» → «Áp lại giá trị đã applied (fill-gap)» → «Thẻ chờ trỏ offer kế» ;
  (c) không offer kế → «Hỏi-1: xoá tường minh + ảnh chụp ops_audit (khuyến nghị)».
- Cả (b)(c) kết ở «Xoá offer cũ · ops_audit enrich:reconcile». Cạnh bên: «DELETE thẳng → lỗi khoá ngoại RESTRICT».
- AC: AC-1, AC-2, AC-3, AC-4, AC-5.

### hoan-tac (flowchart)
- Nút: «enrich-revert --ids --actor hitl:… --reason» → «actor là người & có lý do?» (không → lỗi, không ghi) →
  «Giá trị trên tin còn đúng giá trị đã áp?» rẽ: có → «Trả field về trống · đề xuất reverted · mở lại superseded thành thẻ duyệt · căn liên kết» ; không → «Bỏ qua (value-changed / not-applied)».
- Kết: «ops_audit enrich:revert» → «Lượt enrich sau: giá trị LLM lên thẻ, luật không đẩy lại».
- AC: AC-6, AC-7.
