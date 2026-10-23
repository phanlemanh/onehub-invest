# Hình tại điểm quyết định — cloud-sync-atomic

| Điểm | Đếm | Hình |
|---|---|---|
| Đường tráo nguyên tử (d-1) — đổi lối cũ TRUNCATE sang staging + một giao dịch | 6 bước nối tiếp | luong-sync.html |
| Hỏi-1 luật sale_offers (d-9) | 2 nhánh | luong-sync.html (nhánh ở bước «chọn cột») |
| Hỏi-3 area biến mất (d-10) | 2 nhánh | luong-sync.html (nhánh ở bước «xoá dòng thừa areas») |
| Hỏi-2 lệch ngày (d-5) | dưới ngưỡng: 1 bước, 1 lựa chọn có/không | — |

## Đề bài `luong-sync`

- Loại: sequence/swimlane hai làn — «Prod đọc» (Vercel app) và «Lượt sync» (máy local → Management API → Supabase); so CŨ (TRUNCATE → nạp dần: prod thấy 0/thiếu ~7') với MỚI.
- Nút MỚI theo thứ tự: đọc catalog cloud · đọc local một snapshot (chọn cột: danh sách cho phép, băm seller_ref — nhánh Hỏi-1 a/b) · nạp staging `sync_stage.rows` theo mẻ ≤1,8MB · chặn tụt 50% · MỘT giao dịch: DELETE bảng thay-trọn → UPSERT areas → INSERT → xoá area thừa (nhánh Hỏi-3: xoá theo FK kéo saved_markets / không xoá) → COMMIT · leak gate.
- Làn prod: trước COMMIT luôn đọc dữ liệu cũ đủ; sau COMMIT đọc trọn dữ liệu mới; không có đoạn rỗng.
- Nhãn chữ tiếng Việt; AC liên quan: AC-1, AC-2, AC-4, AC-11.
