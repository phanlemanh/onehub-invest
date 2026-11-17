# AC-10 — mẫu nhãn người v2 (lối A)

Mẫu v1 (`mau-bai-lac-du-an.md`) bị bồi thẩm E12 chấm «chưa chắc» ở lượt chấm S4 vòng 1, và lý do xác đáng: 96/100 nhãn là
nháp của trợ lý chưa được người duyệt, và định nghĩa «trong hệ VGP» được chốt SAU khi đã thấy nháp — chính định nghĩa ấy lật
kết quả. GS phán đi lối A (tra-loi P4-196, 17/11 16:00Z): rút mẫu MỚI, mọi thứ dưới đây commit TRƯỚC khi rút, không sửa sau.
Mẫu v1 giữ làm tham khảo, KHÔNG dùng cho AC-10.

## Khai trước khi rút

| | |
|---|---|
| Hạt giống | `tg2-ac10-v2-20261117` |
| Cỡ mẫu | **n = 100** |
| Khung rút | **bài nằm trong một tin S03 đang rao** (`sale_offers.post_ids`), thuộc nhóm mà sổ nhóm ghi đúng một dự án — đúng tập bài mà hàng này đóng dấu. Bài Yêu cầu và bài chỉ ảnh không thành tin nên không có trong khung (mẫu v1 rút trên mọi bài, 41/100 bài không có chữ về dự án) |
| Lệnh rút | `node pipeline/scripts/mau-bai-lac-du-an.mjs --rut --n 100 --seed tg2-ac10-v2-20261117 --khung bai-trong-tin` |
| Ngưỡng | cận TRÊN khoảng Wilson 95% ≤ 10% (Cổng Phạm vi 17/11, Hỏi-3); với n = 100 nghĩa là nhiều nhất 4 bài lạc |

## Định nghĩa «lạc» — chốt trước khi gắn nhãn

Một bài **lạc** khi nó THẬT SỰ nói về một dự án khác dự án của nhóm. Bài không nêu dự án nào là **không lạc**.

**Hệ VGP.** Mạnh, 17/11, nguyên văn: «Trong hệ VGP» — trả lời câu «MCP và LBV tính là dự án khác Vinhomes Grand Park chứ?».
Theo danh bạ lúc khai (`asset_nodes`, 17/11):

| Nút | Dự án |
|---|---|
| 16 | Vinhomes Grand Park |
| 304 | Masteri Centre Point |
| 310 | Lumiere Boulevard |

Trong nhóm mà sổ ghi Vinhomes Grand Park, bài về một trong ba nút trên là **không lạc**. Hệ này chỉ áp cho nhóm VGP; nhóm
khác thì «dự án của nhóm» là đúng một nút trong sổ. Luật ở `laLac` + `HE_DU_AN` trong `pipeline/scripts/mau-bai-lac-du-an.mjs`.

## Ai gắn nhãn

1. Trợ lý điền NHÁP từng dòng kèm căn cứ (đoạn chữ bài, dự án của nhóm, dự án bài nêu) — nếp Mạnh chốt 06/11.
2. Mạnh duyệt trên trang duyệt: mỗi dòng «đúng nháp» hay «sửa thành …». Tệp nhãn lưu tên người duyệt và giờ.
3. **Chỉ dòng Mạnh đã bấm mới tính là nhãn người.** Số AC-10 tính trên nhãn đã duyệt; số trên mẫu v1 báo kèm để thấy lệch.

Bảng 100 dòng kèm chữ bài nằm ở `research-local/` (ngoài kho — chữ bài S03 có thể mang tên nguồn thật, tầng A); hồ sơ này chỉ
giữ phần khai trước, 100 mã bài và số tổng hợp.
