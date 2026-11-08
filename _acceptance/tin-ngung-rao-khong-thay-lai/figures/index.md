# Hình tại điểm quyết định — tin-ngung-rao-khong-thay-lai

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 Invest chỉ hiện tin đang rao — hai cách (a) đưa offer_status lên cloud rồi lọc, (b) lọc khi đẩy | 2 nhánh rẽ | cần hình: `vong-doi-tin.html` |
| Vòng đời tin + luật mới (đang rao → ngừng rao → thấy lại → đang rao; rút tách riêng) | 4 bước nối tiếp | cần hình: `vong-doi-tin.html` (chung một hình) |
| Hỏi-2 N = 21 hay 14 ngày | 2 nhánh, đã có bảng số | dưới ngưỡng: bảng trong hợp đồng thay hình |
| Hỏi-3 người bán giữ trong danh bạ | 1 bước | dưới ngưỡng: 1 |
| Hỏi-4 withdrawn hay giá trị mới | 2 nhánh, không nối tiếp | dưới ngưỡng: câu hỏi một dòng |

## Đề bài `vong-doi-tin`

- Loại: sơ đồ trạng thái (state machine) kèm một nhánh rẽ ở cuối cho Hỏi-1.
- Nút: «Đang rao» (active) · «Ngừng rao» (withdrawn, suy luận: không thấy lại quá 21 ngày khi nguồn vẫn thu) · «Rút» (retired, rác hay gộp nhầm, chỉ truy vết — tách riêng, không do luật này) · «Lịch sử căn» (history_transactional).
- Mũi tên: Đang rao → Ngừng rao «không thấy lại > N, nguồn vẫn thu» · Ngừng rao → Đang rao «thấy lại» · cả hai mũi tên ghi một dòng lịch sử. Nhóm hay nguồn ngừng thu → «giữ nguyên».
- Nhánh Hỏi-1 (bên phải, nét đứt, ghi «hàng riêng»): (a) «offer_status lên cloud → Invest lọc đang rao» (khuyên) · (b) «lọc khi đẩy → gỡ tin khỏi cloud».
- AC liên quan: AC-1, AC-2, AC-4, AC-5.
