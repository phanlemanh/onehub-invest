# Hình tại điểm quyết định — ops-duyet-nhip-va-chu (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 nhãn trạng thái theo đáp án (năm hàng) | dưới ngưỡng: bảng tra một bước, không nhánh | — |
| Hỏi-2 trần 30 phút, trung vị | dưới ngưỡng: một ngưỡng, một bước | — |
| Hỏi-3 hai số mỗi lượt quyết (ở thẻ · giữa hai lượt) — cũng là P0 gap-probe `human-gate1` | cần hình: bốn bước nối tiếp trên một trục thời gian | `hoi-3-hai-so.html` + `.png` |

## Đề bài hình `hoi-3-hai-so`

- Loại hình: dòng thời gian (timeline) một người duyệt, hai lượt quyết liền nhau.
- Nút theo trục thời gian: «Quyết thẻ #1 (lượt trước)» → «Chọn thẻ kế trong danh sách» → «Thẻ #2 mở (sheet dựng)» → «Đọc, gõ lý do» → «Bấm đáp án — quyết thẻ #2».
- Hai khoảng gạch dưới trục: «Giây ở thẻ (seconds)» từ «Thẻ #2 mở» tới «Bấm đáp án»; «Giữa hai lượt (since_prev_seconds)» từ «Quyết thẻ #1» tới «Bấm đáp án».
- Chú thích: OD2 (rail, tự sang thẻ kế) rút phần «Chọn thẻ kế» — chỉ số «Giữa hai lượt» thấy được phần đó; lượt quá 30 phút không vào trung vị.
- AC liên quan: AC-1, AC-4.
