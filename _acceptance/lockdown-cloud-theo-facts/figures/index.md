# Hình tại điểm quyết định — lockdown-cloud-theo-facts (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 nguồn của lưới Máy móc trên máy chủ (A/B) + Hỏi-4 khối lỗi (A/B) | luồng bản tin → 3 vùng, 2 nhánh rẽ mỗi câu | cần hình: `nguon-so-khoa-an-toan` |
| Hỏi-2 hạng rủi ro T3/T2 | chọn một giá trị, không luồng | dưới ngưỡng: 0 bước nối tiếp, 0 nhánh luồng |
| Hỏi-3 màu «Chỉ kiểm ở máy thu» | chọn một giá trị, không luồng | dưới ngưỡng: 0 bước nối tiếp, 0 nhánh luồng |

## Đề bài `nguon-so-khoa-an-toan`

- Loại hình: data flow (trái → phải), một hình.
- Nút: «Máy thu: readLockdown (8 lớp, ok true/false/null)» và «Máy thu: scheduler() (khoá jobs cũ)» → «Bản tin ops_heartbeat» →
  máy chủ `getCloudOpsView` → ba vùng: «Ô Khoá an toàn», «Lưới Khoá an toàn & hạ tầng thu», «Máy móc: hàng Kev gate, collector API».
- Nhánh Hỏi-1: A (máy khuyên) — hai hàng Kev/collector đọc lớp «Cổng Kev :8009» / «Cổng nhận tin :9210» của khối lockdown
  (một lần đo); các hàng khác của Máy móc đọc khoá jobs cũ. B — cả Máy móc đọc khối jobs launchd.
- Nhánh Hỏi-4: khối lockdown lỗi → A (máy khuyên) gộp «không có số»: 8/8 «Chỉ kiểm ở máy thu», ô «—»; B nhãn riêng «Máy thu
  không đọc được».
- Nhãn bằng chữ tiếng Việt, từ vựng máy thu / máy chủ / Khoá an toàn. AC liên quan: AC-1, AC-2, AC-5.
