# Hình tại điểm quyết định — so-tu-vung-mot-nguon (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 nhãn tiếng Việt cho listing_intent / offer_status | 1 bước, không nhánh | dưới ngưỡng: 1 bước |
| Hỏi-2 thêm CHECK properties.property_type | 1 nhánh rẽ (có / không) | dưới ngưỡng: 1 nhánh |
| Sổ = enums của mappings.yaml theo khuôn Lookup | 1 bước | dưới ngưỡng: 1 bước |
| Tệp sinh commit + --check | 2 bước (sinh → kiểm) | dưới ngưỡng: 2 bước |
| Lint bỏ db/migrations, DB kiểm bằng --check-db | 2 nhánh? — một vùng quét, một vùng kiểm DB | dưới ngưỡng: 1 nhánh rẽ |
| Năm mục descope (PriceBasis, cột mới, Supabase, design-pass, đặc tả UX) | mỗi mục 1 bước | dưới ngưỡng: 1 bước |

0 điểm vượt ngưỡng N5 — không vẽ hình. Luồng sổ → bốn đích + DB nằm ở bảng §2 của design doc.
