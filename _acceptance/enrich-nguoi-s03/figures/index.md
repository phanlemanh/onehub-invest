# Hình tại điểm quyết định — enrich-nguoi-s03

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 lưu số của Người ở đâu | 4 bước nối tiếp (bài → Người → liên lạc → tin) + 2 nhánh (bảng liên lạc / bí danh + gộp) | `luong-lien-lac.html` |
| Hỏi-2 số chung | dưới ngưỡng: 1 bước, 2 giá trị (loại / nhận) | — |
| Hỏi-3 luật chọn khi nhiều số | 3 nhánh rẽ (một số trên tin / không số trên tin + một số trong bài / còn lại) | `luat-chon-so.html` |
| Hỏi-4 ngưỡng đọc mù | dưới ngưỡng: một con số | — |
| Hỏi-6 ghi vào tin hay đọc qua Người | 2 nhánh; hình `luong-lien-lac` có bước «Tin không số: seller_phone + dấu» là lối khuyên, lối khác chỉ khác một mũi tên (Invest đọc thẳng Người) — dưới ngưỡng riêng | — |
| Hỏi-7 bỏ design-pass | dưới ngưỡng: một lựa chọn có/không | — |
| Hỏi-5 lên Invest kèm nhãn | dưới ngưỡng: 2 bước (áp 079 → hiện kèm Badge), hình luồng ở Hỏi-1 đã gồm | — |

## Đề bài `luong-lien-lac`

- Loại: luồng dữ liệu (data flow), trái → phải.
- Nút: «Bài nhóm S03 của người gửi» → «Người theo tài khoản» → «Liên lạc của Người (party_contacts, rule s03-so-tren-tin / s03-so-trong-bai)» → «Luật chọn số» → «Tin không số: seller_phone + dấu s03-qua-nguoi-dang» → «View sale_offers: seller_phone_inferred» → «Invest: Xem số + Badge Chưa xác minh».
- Nhánh phụ (đứt nét, ghi «lối khác Hỏi-1»): «Bí danh sdt của Người theo SĐT» —gộp HD13 (công tắc đang TẮT)→ «Người theo tài khoản».
- Vòng cấm (mũi tên gạch chéo): «Tin mang dấu s03-qua-nguoi-dang» ↛ «Liên lạc / bí danh» (AC-6 không tự nuôi).
- Ô chờ ZCode (xám): «Liên lạc hồ sơ kênh S03 theo sender_id — làn ZCode».
- AC: AC-1, AC-2, AC-4, AC-5, AC-6, AC-7.

## Đề bài `luat-chon-so`

- Loại: cây quyết định, trên → dưới.
- Gốc: «Liên lạc sdt sống của Người (cuối chuỗi gộp)».
- Nhánh 1: «Đúng một số trên tin của chính họ» → «Dùng số ấy» (662 tin).
- Nhánh 2: «Không số nào trên tin, đúng một số trong bài» → «Dùng số ấy» (80 tin).
- Nhánh 3: «Còn lại (≥ 2 số trên tin; 0 trên tin + ≥ 2 trong bài; 0 số)» → «Không gán, đếm nhieu_so».
- Chú thích dưới: «Số xuất hiện ở bài của ≥ 2 người gửi bị loại trước khi vào cây (Hỏi-2)». «Lối khác Hỏi-3: chọn số nhiều bài nhất — 824 tin».
- AC: AC-3.
