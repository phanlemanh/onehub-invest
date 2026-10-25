# Hình tại điểm quyết định — gio-ops-gio-vn (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 khuôn hiện mốc giờ | dưới ngưỡng: 1 lựa chọn chữ, 2 lối | — (bảng trên thẻ) |
| Hỏi-2 có sửa số đẩy lên cloud không | 2 nhánh rẽ (làm luôn T3 / để lệch một cột) × 2 nơi đọc (local, cloud) | `nguon-luong-7-ngay` |
| Hỏi-3 chữ mức trễ | dưới ngưỡng: 1 lựa chọn chữ | — |
| d-…-1 formatter chung · d-…-5 opts.now · d-…-10 tách hàm pipeline | dưới ngưỡng | — |

## Đề bài `nguon-luong-7-ngay`

- Loại hình: luồng dữ liệu hai làn ngang «Máy local» và «Cloud (Vercel)» cho vùng «Luồng 7 ngày» của /ops/collections.
- Làn local: DB local (6 cột: AirDNA market, AirDNA listing, listing thấy, snapshot Airbnb, tin Zalo, tin rao) → getFlowDays gom ngày → bảng. Ghi chú: sau hàng này gom theo ngày VN (AT TIME ZONE).
- Làn cloud: 4 cột đọc DB cloud → getFlowDays (gom ngày VN như local); 2 cột Zalo (tin Zalo, tin rao) đến từ «số đẩy lên» (push-ops-facts.mjs chạy trên máy local) → ops_heartbeat → getFlowDays.
- Nhánh rẽ ở hộp push-ops-facts: «Hỏi-2 lối A (khuyến nghị, T3): đẩy theo ngày VN → mọi cột cùng ngày» và «lối B (giữ T2): vẫn ngày UTC → cột Zalo lệch 1 ngày với 0h–7h giờ VN».
- Nhãn tiếng Việt; tô nổi hộp push-ops-facts và hai lối.
- AC liên quan: AC-4, AC-6.
