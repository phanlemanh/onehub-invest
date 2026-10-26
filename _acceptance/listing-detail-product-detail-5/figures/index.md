# Hình tại điểm quyết định — listing-detail-product-detail-5

| Điểm | Đếm | Hình |
|---|---|---|
| d-1 thumbnail = Radio Base UI | 1 bước, 0 nhánh — dưới ngưỡng | — |
| d-2 không giữ bản gốc block trong blocks/ | 1 bước — dưới ngưỡng | — |
| d-3 ảnh render server + bắt lỗi trước hydrate | 4 bước nối tiếp, 2 nhánh rẽ (còn ảnh / hết ảnh) — cần hình | anh-chet.html / anh-chet.png |
| d-4 Hỏi-1 giá trong hộp Đặc điểm | bố cục tĩnh — dưới ngưỡng (ảnh design-pass co-anh--desktop-1280.png) | — |
| d-5 Hỏi-2 khung ảnh 4:3 | bố cục tĩnh — dưới ngưỡng (ảnh design-pass) | — |
| d-6 đặc điểm dời khỏi badge PageHeader | 1 bước — dưới ngưỡng | — |
| d-7 lịch không thành vùng tải riêng | 1 bước — dưới ngưỡng | — |
| d-8 bỏ đường-đo | 0 bước — dưới ngưỡng | — |
| d-9 design-pass nac-1 | 0 bước — dưới ngưỡng | — |

## Đề bài hình anh-chet

- Loại hình: flowchart (luồng trạng thái), ≤ 8 nút.
- Nút: HTML server có `<img>` (ảnh tự thu) → trình duyệt tải ảnh → [lỗi trước hydrate: ref thấy complete + naturalWidth 0] / [lỗi sau hydrate: onError] → ảnh rời gallery → còn ảnh sống? có: ảnh chính = ảnh sống đầu tiên, thumbnail N−1 · không: gallery báo onEmpty → đầu trang một cột, Đặc điểm trải ngang.
- Nhãn bằng chữ tiếng Việt; ghi chú cạnh nút đầu: «giữ ảnh trong HTML server để thước luật 5 (smoke-listing-no-airdna) đọc được».
- AC liên quan: AC-3, AC-2, AC-8.
