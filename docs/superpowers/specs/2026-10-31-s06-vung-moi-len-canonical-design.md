# S06 vùng mới lên canonical — thiết kế (31/10/2026)

Hàng `s06-vung-moi-len-canonical`, T3, migration 064. Mạnh 31/10: «Liên làn làm ngay». Gộp hàng `ma-thi-truong-ngan`
(P2 bỏ). Mục tiêu: tin S06 của vùng mới có phường trước ngày ra mắt 05/11 (đích S06 «thách thức»: ~45.000 tin bán sống,
5 vùng — ROADMAP §4, PR #241).

## Hiện trạng đo ngày 31/10 (DB máy thu :5433)

- `areas` có 34 thị trường cấp tỉnh (sau sáp nhập 2025). Hai mã ngắn `vn-hanoi`, `vn-hcmc`; 32 mã dài
  `vn-(thanh-pho|tinh)-<x>` do bản cũ của `import-provinces.mjs` sinh (bản hiện tại đã sinh mã ngắn `vn-<x>`).
- 32 mã dài: 0 dòng tham chiếu ở 7 khoá ngoại tới `areas` (`properties`, `areas.parent_id`, `listing_records`,
  `market_asset_stats`, `market_metrics`, `sale_offer_records`, `saved_markets`); 0 va chạm với mã ngắn; cột chữ không
  khoá ngoại: `area_sources` 38 dòng (crosswalk S02), `area_breakdowns` 0, `data_level_snapshot.market_id` 0.
- Phường (submarket `osm-phuong`) chỉ có Hà Nội 137 và TP.HCM 167. `stg_osm_boundaries` chỉ có snapshot `hanoi__` (34
  tỉnh cấp 4 + 126 phường) và `hcmc__` (167 phường).
- `pipeline/transform-chotot.mjs` cứng `docPhuongHopLe(client, ["vn-hanoi", "vn-hcmc"])` và `byCity` hai thành phố: tin
  Đà Nẵng (7.126 tin trong stg) vào `sale_offers` với `area_id` NULL.
- `pipeline/reassign-areas.mjs` cứng `MARKETS = { hanoi, hcmc }`.
- `collection_units` S06 khai `cityCode` `vn-da-nang` — không khớp mã `vn-thanh-pho-da-nang` đang có.
- Sáp nhập 2025: Bình Dương và Bà Rịa–Vũng Tàu vào TP.HCM; Hải Dương vào Hải Phòng; Quảng Nam vào Đà Nẵng. Tin S06 khai
  vùng Bình Dương phải xếp vào phường TP.HCM (phường mới đã có trong 167).

## Lựa chọn

1. **Migration 064 đổi 32 mã dài sang mã ngắn** `vn-<x>` (bỏ tiền tố `thanh-pho-`/`tinh-`), giữ nguyên tên, polygon,
   meta. Cập nhật cùng lượt các cột chữ mang mã: `area_sources.area_id`, `area_breakdowns.area_id`,
   `data_level_snapshot.market_id`. Rào đóng chặt: còn dòng nào ở 7 khoá ngoại trỏ mã dài, hoặc mã ngắn đã tồn tại →
   RAISE, không đổi gì. Chạy lại là no-op (không còn mã dài). Mã ngắn khớp đúng khuôn mà `import-provinces.mjs` hiện sinh,
   nên lượt nạp tỉnh sau không tạo lại mã dài.
2. **Một chỗ ánh xạ**: `pipeline/lib/thi-truong.mjs` — bảng khoá thành phố của bộ thu (`hanoi`, `hcmc`, `danang`,
   `haiphong`) → mã thị trường, và bảng tỉnh cũ đã sáp nhập → thị trường mới (`vn-binh-duong`, `vn-ba-ria-vung-tau` →
   `vn-hcmc`; `vn-hai-duong` → `vn-hai-phong`; `vn-quang-nam` → `vn-da-nang`). Hàm `thiTruongCua(cityCode)` trả mã thị
   trường hay null. `reassign-areas` và `transform-chotot` chỉ đọc từ đây.
3. **reassign-areas mở rộng** sang mọi khoá có trong bảng ánh xạ; thành phố chưa có snapshot ranh giới thì bỏ qua như cũ.
   Thị trường mới (ngoài Hà Nội/TP.HCM) phải ĐÃ có trong `areas` — không có thì in một dòng và bỏ qua, không tự chèn
   (tránh dựng trùng thị trường khi 064 chưa áp).
4. **transform-chotot đọc thành phố từ DB**: tập thị trường = mọi thị trường có phường hợp lệ
   (`docThiTruongCoPhuong`, cùng hàm S03 đang dùng — s03-cam-mau-so-lieu Hỏi-1). `city_code` của tin đi qua
   `thiTruongCua`; mã không ánh xạ được → `area_id` NULL như hôm nay, và cuối lượt in một dòng mỗi mã lạ kèm số tin
   (không im).
5. **Ranh giới phường Đà Nẵng, Hải Phòng**: ZCode thu S04 (lời giao claudedp-3110-17). Phần này của hàng chỉ nạp và đo;
   Khánh Hoà ngoài hàng (S06 0 tin).

## Không làm

- Áp 064 lên cloud: `areas` và `area_sources` lên cloud qua sync (bảng giữ-chỗ, xoá dòng không còn ở local). Áp local là
  trong ≤15′ cloud đổi theo, nên áp local cần Mạnh duyệt riêng, kèm pg_dump trước và đếm `saved_markets` trên cloud trỏ
  mã dài (chỉ đọc) = 0.
- Đổi bộ thu S06 sang tham số `region` (ZCode, nhánh `zcode/s06-region-tinh`).
- Gỡ nhánh tra mã dài trong `app/src/lib/market-names.ts` (PR #242): thành thừa sau 064, gỡ ở việc riêng.
- Ánh xạ thành phố cho S01/S03/S05.

## Đường triển khai sau Cổng 2

1. pg_dump `areas`, `area_sources`; đếm cloud `saved_markets` trỏ 32 mã dài (chỉ đọc).
2. Mạnh duyệt → áp 064 lên :5433 → `reassign-areas` → `transform-chotot` → 300 + 400 (bẫy kỹ thuật 5).
3. Đo tỉ lệ tin bán S06 sống có phường theo thị trường, báo giám sát.
