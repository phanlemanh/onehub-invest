# Hình tại điểm quyết định — luong-7-ngay-dung-so (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Đường số luồng 7 ngày lên máy chủ + trạng thái bảng (design doc §2.2–2.3, bảng trạng thái, AC-3…AC-6) | 5 bước nối tiếp, 4 nhánh trạng thái | `duong-so.html` / `.png` |
| d-1 đồng hồ «ngày đăng» cho hai cột S03 | dưới ngưỡng: 1 lựa chọn, 2 lối | — |
| d-5 / d-6 ô snapshot «Chỉ ở máy thu» · d-7 bỏ cột S02 trên máy chủ | dưới ngưỡng | — |
| Các dòng sổ còn lại (d-2, d-3, d-4, d-8 … d-11) | dưới ngưỡng | — |

## Đề bài hình `duong-so`

- Loại hình: luồng dữ liệu trái → phải, kèm một nhánh rẽ 4 trạng thái ở cuối.
- Nút: DB máy thu (`stg_zalo_posts` bài S03 thật · `sale_offers` nguồn S03) → hàm `luong7` (7 ngày giờ VN, ngày đăng) →
  khối `blocks.luong7` trong bản tin (`measured_at`, 7 khoá ngày) → `ops_heartbeat` trên máy chủ → bảng «Luồng 7 ngày
  qua» trên máy chủ. Nhánh song song: `listings` đã đồng bộ → cột «S01 — listing tươi». Ô cố định: cột «S01 — snapshot»
  = «Chỉ ở máy thu»; cột S02 = không dựng (ON6).
- Nhánh trạng thái ở bảng máy chủ: tươi (số) · cũ > 45′ (số mờ + Alert vàng) · thiếu khối (ô «—») · chưa có bản tin
  (không bảng, Alert «Phần còn lại…»).
- AC liên quan: AC-3, AC-4, AC-5, AC-6.
