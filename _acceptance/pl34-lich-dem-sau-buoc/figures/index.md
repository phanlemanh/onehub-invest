# Hình tại điểm quyết định — pl34-lich-dem-sau-buoc

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: đổi lời enrich-chay-sau-nap/AC-6 (năm → sáu bước) | dãy sáu bước nối tiếp + hai nhánh rẽ (nạp hỏng · không snapshot mới) | `job-dem-sau-buoc` |
| gap-probe (0 P0, xử lý `human-gate1`: 0) | dưới ngưỡng: 0 điểm cần người | — |

## Đề bài `job-dem-sau-buoc`

- Loại hình: luồng (flowchart) trái → phải.
- Nút: snapshot Zalo mới? → (không: thoát 0, không bước nào) · import-airbnb (nạp) → (hỏng: thoát 1, dừng) · transform-zalo → transform-media → refresh-bait-gap → [nhả khoá nạp] → **doc-gop-hang-ngay (mới, PL34)** → enrich-run.
- Nhãn: đánh dấu «bước mới» ở doc-gop-hang-ngay; ghi «năm bước cũ (AC-6 đã ký)» và «sáu bước mới (AC-1)».
- AC liên quan: AC-1 (dãy + hai nhánh), AC-2 (doc-gop hỏng thì enrich-run vẫn chạy).
