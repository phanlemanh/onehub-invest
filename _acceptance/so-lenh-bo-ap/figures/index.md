# Hình tại điểm quyết định — so-lenh-bo-ap (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — áp 091 sau gộp, mỗi nơi một lời | 5 bước nối tiếp (gộp → sao lưu + áp máy thu → áp Supabase → cấp token máy → nạp plist) | `duong-lenh-va-trien-khai.html` |
| Hỏi-2 — plist ops-apply viết trong PR, không nạp | gộp chung hình trên (bước cuối) | `duong-lenh-va-trien-khai.html` |
| Luật quyền (4 dòng sổ thay d-5) | dưới ngưỡng: 2 nhánh (S03 hay không S03) nhưng đã có câu trích, không chờ người | — |
| Gap-probe (4 mục fixed) | dưới ngưỡng: không còn mục chờ người | — |

## Đề bài hình `duong-lenh-va-trien-khai`

- Loại hình: sơ đồ hai làn (CLOUD | MÁY THU) phía trên + dải bước triển khai phía dưới.
- Phía trên — vòng một lệnh: Người vận hành gửi lệnh (vai ops/admin) → Admin duyệt (S03: người thứ hai) → Máy thu kéo
  bằng token máy `ops:pull` (60″) → Kiểm khuôn + khoá cấm → Áp trong một giao dịch, sổ áp chống lặp → Kiểm sau áp (hỏng:
  hoàn tác) → Kết quả lên qua push-ops-facts → ingest → «đã áp lúc HH:MM» + trước/sau. Mũi tên cloud → máy thu KHÔNG có
  (máy thu chỉ gọi ra).
- Phía dưới — sau gộp, mỗi bước một lời của Mạnh: (1) gộp PR · (2) sao lưu + áp 091 lên DB máy thu · (3) áp 091 lên
  Supabase · (4) cấp token máy `ops:pull` · (5) nạp plist `ops-apply` vào launchd. Ghi «Hỏi-1» trên bước 2–3, «Hỏi-2»
  trên bước 5.
- AC liên quan: AC-1 (091), AC-4 (kéo), AC-6/AC-7 (áp), AC-8 (kết quả), AC-10 (phanh, plist).
