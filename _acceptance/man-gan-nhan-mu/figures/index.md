# Hình tại điểm quyết định — man-gan-nhan-mu

| Điểm | Đếm | Hình |
|---|---|---|
| Đường dữ liệu nhãn (lấy mẫu → gắn → đo) — chạm Hỏi-1, Hỏi-3, quyết định «chỉ ở máy thu» | 5 bước nối tiếp | `duong-nhan.html` |
| Luật phân tin cho người gắn (AC-5) — chạm Hỏi-2 | 2 nhánh rẽ (tin đơn / tin trùng) | `hang-cho.html` |
| Hỏi-1 cách đo đồng thuận | dưới ngưỡng: 1 lựa chọn, 0 bước | — |
| Hỏi-2 quyền ghi | dưới ngưỡng: 1 lựa chọn, 0 bước | — |
| Hỏi-3 chín trường | dưới ngưỡng: 1 danh sách | — |
| Hỏi-4 bỏ design-pass | dưới ngưỡng: 1 lựa chọn | — |

## Đề bài `duong-nhan`

- Loại hình: luồng dữ liệu (data flow), trái → phải, có ranh giới «máy thu» / «cloud».
- Nút: `stg_zalo_posts` (S03, nhóm khớp ocp|ocean|masteri) → lệnh `label-sample` (gạt post thử, khử trùng, 20% gắn trùng,
  dev/test) → bảng `eval_label_items` → màn `/ops/labels` (người gắn, không thấy giá trị máy) → bảng `eval_labels` → view
  `eval_label_agreement` → hai nơi đọc: bảng đồng thuận trên màn và lệnh `label-agreement` (đồng thuận từng trường, phút công).
- Ngoài ranh giới máy thu: cloud — mũi tên gạch «không lên» từ hai bảng nhãn; màn trên cloud chỉ hiện «Chỉ ở máy thu».
- Một nút mờ «giá trị máy đoán (sale_offers, phát biểu, đề xuất)» đứng cạnh màn, mũi tên bị chặn «màn không đọc».
- AC liên quan: AC-1, AC-2, AC-3, AC-4, AC-6.

## Đề bài `hang-cho`

- Loại hình: sơ đồ trạng thái của một tin trong hàng chờ.
- Tin đơn: «chưa ai gắn» → (một người lưu) → «xong». Người khác ghi vào tin xong → 409.
- Tin gắn trùng (20%): «chưa ai» → (người A lưu) → «đã một người — chờ người khác A, được ưu tiên» → (người B ≠ A lưu) →
  «đủ cặp — tính đồng thuận» ; người thứ ba ghi → 409; A không bao giờ nhận lại tin.
- AC liên quan: AC-5, AC-6.
