# Đặc trưng nhà của tin S06 lên canonical (HD5) — thiết kế

Hàng HD5 của lộ trình (đợt `hang-duyet-3010`, dãy P1, T3). Căn cứ: `docs/research/audit-hang-duyet-3010.md` §7 (Q12); trang
tri thức «hàng duyệt ghép căn» (đặc trưng nhà phân biệt mạnh, luật loại trừ là việc của bộ đánh giá). Migration **061** (liên
làn cấp 30/10).

Đo 31/10 trên DB máy thu, chỉ đọc, mỗi `list_id` lấy bản thu mới nhất (31.680 tin, 29.762 có giá + diện tích): `street_number`
7.138 · `streetnumber_display` 11.375 · `width` 7.886 · `length` 7.302 · `floors` 7.055 · `toilets` 16.630 · toạ độ 31.674 ·
`unitnumber_display` 4.881 · `rooms` 22.828. Hôm nay transform S06 chỉ phát biểu loại hình và phòng ngủ.

## 1. Trường (RESO-first, ADR-0011; tin = `Property`, ADR-0013)

| Mã trường (`assertion_field`) | Cột `sale_offer_records` | RESO DD 2.1 | Kiểu | Đọc từ stg S06 |
|---|---|---|---|---|
| `street_number` | `street_number` | `StreetNumber` | text | `payload.street_number`, vắng thì `payload.streetnumber_display` |
| `unit_number` | `unit_number` | `UnitNumber` | text | `payload.unitnumber_display`, vắng thì `payload.unitnumber` |
| `frontage_length` | `frontage_length` | `FrontageLength` | numeric (m) | `payload.width` |
| `lot_size_dimensions` | `lot_size_dimensions` | `LotSizeDimensions` | text `«ngang x dài»` (m) | `payload.width` và `payload.length`, chỉ khi có cả hai |
| `stories` | `stories` | `Stories` | integer | `payload.floors` |
| `latitude` · `longitude` | `latitude` · `longitude` | `Latitude` · `Longitude` | numeric | cột `latitude` · `longitude` của stg |
| `bathrooms` (đã có) | `bathrooms` | `BathroomsTotalInteger` | integer | cột `toilets` của stg |

`rooms` → `bedrooms` đã có từ PL15. Không cần trường mở rộng nào: mọi đặc trưng có tên RESO. Chiều dài chỉ nằm trong
`LotSizeDimensions` vì RESO không có trường riêng cho chiều sâu lô.

## 2. Ghi qua phát biểu (PL15)

- Mỗi giá trị hợp lệ thành một `field_assertions`: lớp `fact`, phương pháp `source_field`, `rule_id` = tên khoá nguồn đã đọc
  (căn cứ), `observed_at` = `list_time` (vắng thì `captured_at`), chủ thể `S06:<list_id>`. Ghi cùng lượt với hai phát biểu
  hiện có, `replaceOwn: true`: giá trị đổi ở stg thì phát biểu cũ của bộ đọc bị rút.
- Bộ đọc thuần `docDacTrungS06(ad) → [{field, value, rule_id}]`. Giá trị rác không thành phát biểu: số ≤ 0, chữ rỗng, chuỗi
  không phải số ở trường số, `width`/`length` > 200 m, `floors` > 100, toạ độ ngoài khung Việt Nam (vĩ 8–24, kinh 102–110).
- Năm cột cũ và các cột mới chỉ do `resolve_offer_fields` dựng. Transform không ghi thẳng cột nào (răng
  `lib/scan-canonical-write.mjs` có sẵn).

## 3. Migration 061 (chỉ DB local; áp cloud khi Mạnh duyệt)

1. `sale_offer_records`: thêm 7 cột kèm CHECK (`frontage_length > 0`, `stories > 0`, vĩ độ/kinh độ trong miền). View
   `sale_offers` dựng lại.
2. `field_assertions_field_chk`: tập 059 cộng 7 mã mới (CHECK literal, `vocab --check-db` đọc).
3. Trigger mới `field_assertions_gia_tri_061` (BEFORE INSERT, mọi phương pháp kể cả `hitl`) kiểm kiểu VÀ miền của bốn
   trường số mới (cùng miền CHECK cột: `frontage_length` > 0, `stories` > 0, vĩ độ [-90, 90], kinh độ [-180, 180]), để
   phân xử không bao giờ ghi giá trị vi phạm CHECK; không chép lại thân `field_assertions_guard` của 059.
4. `resolve_offer_fields` bản 061: nguyên thân 059, cộng 7 cột vào `kq` và `upd`.
5. Hạt giống sổ `ref_field_lookup` cho trục `assertion_field` (bảy mã mới), sinh bằng `vocab.mjs --emit-seed`.
6. Áp hai lần không lỗi, không ghi dòng nào ngoài hạt giống sổ. Không cột mới nào lên cloud: `CLOUD_ALLOW` của
   `sync-cloud.mjs` là danh sách cho phép, giữ nguyên.

**Chồng với PL5**: migration 057 (nhánh PL5, chưa gộp) cũng định nghĩa lại `field_assertions_field_chk` và chưa có
`offer_status`. Khi PL5 gộp main, 057 phải dùng tập đầy đủ (059 + 061 + mã của PL5). Đã báo giám sát; HD5 không sửa nhánh PL5.

## 4. Đo

- Ca thuần: ma trận bộ đọc (mỗi trường × hợp lệ / vắng / rác).
- Ca DB trên DB thử `oneinvest_p1_n3`, giao dịch ROLLBACK: migration hai lần; phát biểu và phân xử; nạp lại hai lượt; đổi
  giá trị ở stg.
- Thước dữ liệu thật `do-dac-trung-s06.mjs`, DB thử chép từ `oneinvest`, áp 061 trước: chạy code transform của merge-base
  (cột có mà rỗng) rồi bản mới. Mỗi đặc trưng in ba số bằng SQL độc lập với bộ đọc (có khoá khác rỗng · bị loại là rác kèm
  ba giá trị rác phổ biến · có ô), tỉ lệ ≥ 95% trên mẫu số Hỏi-1; mỗi ô mới khác rỗng có phát biểu sống cùng giá trị; năm
  cột cũ, `offer_status` và `bathrooms` của S03/S05 không đổi; cùng thước trên lượt merge-base ra đỏ «<trường>: X/Y < 95%».

## 5. Hỏi người

- **Hỏi-1 — mẫu số của ngưỡng 95%**: khuyến nghị «tin sống có giá trị **hợp lệ** ở stg» (giá trị rác không thể lên canonical
  đúng; thước vẫn in mẫu số «có khoá» và số rác để người thấy). Lối khác: «tin sống có khoá khác rỗng» — ngưỡng chặt hơn,
  giá trị rác kéo tỉ lệ xuống và buộc bộ đọc nhận nhiều dạng hơn.

## 6. Ngoài phạm vi

Đọc đặc trưng từ chữ S03/S05; luật loại trừ trong bộ đánh giá (HD hàng khác); đưa cột mới lên cloud và hiện trên thẻ duyệt;
áp 061 lên DB máy thu (bước triển khai sau gộp).
