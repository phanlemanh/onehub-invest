# Hình tại điểm quyết định — phat-bieu-va-phan-xu (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 · thang ba lớp + thứ tự tạm trong lớp | 4 bước nối tiếp + 3 nhánh rẽ | `phan-xu-mot-o` |
| Hỏi-2 · giá trị có sẵn không phát biểu đỡ (khó đảo) | 2 nhánh rẽ | `gia-tri-co-san` |
| Chủ thể = khoá gốc từng post (d-3) | dưới ngưỡng: 1 bước, 0 nhánh | — |
| Người = lớp sự thật qua actor `hitl:` (d-4) | dưới ngưỡng: 1 bước, 0 nhánh | — |
| Suy luận không vào cột (d-5) | dưới ngưỡng: đã nằm trong hình `phan-xu-mot-o` | — |
| 11 dòng sổ máy quyết còn lại (descope/approach) | dưới ngưỡng: 1 bước, 0 nhánh mỗi dòng | — |

## Đề bài `phan-xu-mot-o` (flowchart)

- Nút: «Phát biểu sống của mọi post trong tin» → «Có lớp sự thật?» → «Có lớp quan sát?» → «Chỉ suy luận / không có» →
  «Mặc định (unknown / trống) + gợi ý». Trong lớp thắng: «Một giá trị?» → nhận; «Nhiều giá trị» → xếp theo thứ tự tạm
  (người › trường nguồn; parser › E1 › E2 › cũ) + cờ bất đồng.
- Nhãn bằng chữ: lớp sự thật = người, trường có cấu trúc của nguồn; quan sát = parser, E1, E2, giá trị cũ.
- Đầu ra: cột + nguồn gốc (lớp, phương pháp, id phát biểu, measured: false).
- AC liên quan: AC-3, AC-4.

## Đề bài `gia-tri-co-san` (so sánh hai nhánh)

- Đầu vào: ~13,9 nghìn ô hôm nay không có phát biểu đỡ (đường 8,2k · WC 4,7k · toà 0,5k của S06 + lẻ S03/S05).
- Nhánh (a) khuyến nghị: ghi thành phát biểu «cũ» lớp quan sát → cột y nguyên → PL16/PL17 thay dần bằng phát biểu đúng.
- Nhánh (b): ghi ở lớp suy luận → cột về trống → lượt sync kế, cổng Invest mất các ô đó.
- AC liên quan: AC-8.
