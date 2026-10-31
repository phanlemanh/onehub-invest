---
schema_version: 1
feature: tin S06 của vùng mới (Đà Nẵng, Hải Phòng, Bình Dương đã sáp nhập vào TP.HCM) lên canonical có phường — mã thị trường ngắn một khuôn (migration 064), bước nạp phường và bước chuyển S06 đọc thành phố từ một chỗ ánh xạ thay cho danh sách cứng
slug: s06-vung-moi-len-canonical
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
design_doc: docs/superpowers/specs/2026-10-31-s06-vung-moi-len-canonical-design.md
approved_by: Mạnh
approved_at: 2026-10-31
---

# Acceptance Contract: s06-vung-moi-len-canonical

## Context

Gói dữ liệu ra mắt 05/11 (Mạnh chốt đích «thách thức» 31/10: S06 ~45.000 tin bán sống, 5 vùng — ROADMAP §4, PR #241).
ZCode đã thu và nạp Đà Nẵng (7.126 tin trong stg) nhưng tin vào `sale_offers` không có phường: `transform-chotot.mjs`
và `reassign-areas.mjs` cứng hai thành phố, `areas` chỉ có phường Hà Nội/TP.HCM, và 32 thị trường cấp tỉnh mang mã dài
`vn-(thanh-pho|tinh)-<x>` không khớp `cityCode` `vn-<x>` mà bộ thu khai. Mạnh 31/10 «Liên làn làm ngay» giao phiên điều
phối liên làn, gộp hàng `ma-thi-truong-ngan` (P2 bỏ); Mạnh mở lại C8 `phuong-da-nang` vốn để CHỜ ở Hỏi-4 26/10. Hạng T3
vì đổi khoá chính của `areas` (bảng lên cloud) bằng migration 064.

Căn cứ: đo DB :5433 ngày 31/10 ở design doc §Hiện trạng; LUAT.md đợt dot0 dòng 31/10 11:06Z.

Source input: lời Mạnh 31/10 qua giám sát + design doc `docs/superpowers/specs/2026-10-31-s06-vung-moi-len-canonical-design.md`

## Criteria

- AC-1: Given DB có 32 thị trường mã dài, 0 tham chiếu, 0 va chạm, When áp migration 064, Then còn đúng 34 thị trường, 32 mã đổi thành `vn-<x>` (bỏ tiền tố `thanh-pho-`/`tinh-`) với tên, polygon, meta giữ nguyên, 38 dòng `area_sources` trỏ mã mới, 0 mã dài còn lại ở `areas`, `area_sources`, `area_breakdowns`, `data_level_snapshot` và cột mảng `collection_units.market_codes`, `asset_nodes.area_ids` (đơn vị thu sửa lại được qua trigger kiểm mã của 048); áp lần hai không đổi dòng nào.
- AC-2: Given một mã dài còn được tham chiếu ở bất kỳ khoá ngoại nào tới `areas` (một ca cho mỗi bảng trong 7 bảng), hoặc mã ngắn đích đã tồn tại, When áp 064, Then migration dừng với thông điệp gọi tên bảng (hay mã va chạm) và không đổi dòng nào.
- AC-3: Given `pipeline/lib/thi-truong.mjs`, When tra khoá thành phố của bộ thu (`hanoi`, `hcmc`, `danang`, `haiphong` — đúng id trong `collector/src/config/cities.ts`, cũng là tiền tố snapshot S04) và `cityCode` (mã thị trường, hay mã tỉnh cũ đã sáp nhập: `vn-binh-duong`, `vn-ba-ria-vung-tau` → `vn-hcmc`; `vn-hai-duong` → `vn-hai-phong`; `vn-quang-nam` → `vn-da-nang`), Then trả đúng mã thị trường; mã lạ trả null; `reassign-areas.mjs` và `transform-chotot.mjs` lấy tập thành phố CHỈ từ module này (thêm một khoá vào module thì hai bước nhận khoá đó mà không sửa tệp của chúng).
- AC-4: Given `stg_osm_boundaries` có snapshot phường của một thành phố mới (danang) và thị trường `vn-da-nang` đã có trong `areas`, When chạy `reassign-areas` không đối số, Then phường được upsert dưới `vn-da-nang` với id `vn-da-nang-<slug>`, tập id phường Hà Nội/TP.HCM trước = sau, và mỗi khoá có trong module mà chưa có snapshot thì in một dòng gọi tên khoá (không bỏ qua im lặng).
- AC-5: Given khoá thành phố mới mà thị trường chưa có trong `areas` (064 chưa áp), When chạy `reassign-areas`, Then in một dòng nêu khoá + mã thiếu, bỏ qua thành phố đó, KHÔNG chèn thị trường mới; thành phố khác chạy như thường.
- AC-6: Given tin S06 trong stg với `city_code` `vn-da-nang` (hay `vn-binh-duong`) và tên phường 2025 khớp một phường của thị trường đích, When chạy `transform-chotot`, Then tin bán có `area_id` là phường đó và confidence high; kết quả gán phường của tin Hà Nội/TP.HCM không đổi so với trước thay đổi.
- AC-7: Given tin S06 có `city_code` không ánh xạ được, When chạy `transform-chotot`, Then tin vẫn vào canonical với `area_id` NULL như hôm nay, lượt không lỗi, và cuối lượt in một dòng cho mỗi mã lạ kèm số tin.
- AC-8: Given bản chép DB máy thu (db-thu) đã áp 064 và có ranh giới phường Đà Nẵng thật từ S04, When chạy `reassign-areas` → `transform-chotot` → 300 + 400, Then ≥ 80% tin bán S06 sống của `vn-da-nang` có phường — mẫu số là tin bán S06 sống có `city_code` ánh xạ ra `vn-da-nang`, không suy từ `area_id` — và tỉ lệ có phường của `vn-hanoi`, `vn-hcmc` không giảm so với trước.
- AC-10: Given một DB (bản chép local, hay cloud qua đường đọc chỉ-đọc của sync), When chạy lệnh đếm mã dài, Then lệnh đọc catalog để liệt MỌI bảng có khoá ngoại tới `areas` cùng các cột chữ `area_id`/`market_id`, đếm dòng trỏ 32 mã dài; còn dòng ở khoá ngoại nào thì in một dòng gọi tên bảng và thoát 1; cột chữ và cột mảng không khoá ngoại (vd `area_sources`, `collection_units.market_codes`) chỉ in dòng báo, không chặn; không còn dòng ở khoá ngoại thì thoát 0 — đây là bước chặn trước khi áp 064 lên DB máy thu.

## Coverage

- Trục A — thị trường: có sẵn phường (HN, HCM) · mới có phường (ĐN, HP) · tỉnh cũ đã sáp nhập (BD, BR-VT, HD, QN) · mã lạ · thị trường chưa có trong `areas`. [thước CE: Nghị quyết sáp nhập 2025 — 34 tỉnh; `areas` 34 thị trường]
- Trục B — lớp: migration (AC-1, AC-2) · ánh xạ (AC-3) · nạp phường (AC-4, AC-5) · chuyển S06 (AC-6, AC-7) · dữ liệu thật (AC-8) · hồi quy (đưa ra Known limits — xem Notes).
- Trục C — trạng thái DB: 064 chưa áp (AC-5) · áp lần đầu · áp lại (AC-1) · có tham chiếu/va chạm (AC-2) · cloud còn dòng trỏ mã dài (AC-10).
- Trục D — chiều: dương (AC-1, AC-4, AC-6, AC-8) · không được bắn (AC-2, AC-5, AC-7, phần «không đổi» của AC-4, AC-6).
- Đà Nẵng ở AC-8 BẮT BUỘC có ranh giới S04 thật (claudedp-3110-17); Hải Phòng đo cùng ngưỡng khi có, chưa có thì khai giới hạn ở Cổng 2.

## Out of scope

- Áp 064 lên DB máy thu :5433 (cloud đổi theo qua sync trong ≤15′): bước triển khai sau Cổng 2, cần Mạnh duyệt riêng, kèm pg_dump `areas`/`area_sources` và lệnh đếm AC-10 chạy trên cloud (chỉ đọc, Mạnh chạy) ra 0.
- Đổi bộ thu S06 sang tham số `region` và bật Hải Phòng/Bình Dương trong `collection_units` (làn ZCode, nhánh `zcode/s06-region-tinh`).
- Thu ranh giới phường S04 Đà Nẵng/Hải Phòng (làn ZCode, claudedp-3110-17).
- Gỡ nhánh tra mã dài trong `app/src/lib/market-names.ts` (PR #242) — thừa sau 064, gỡ ở việc riêng.
- Ánh xạ thành phố cho S01, S03, S05 và Khánh Hoà (S06 0 tin).

## Notes

- Thứ tự áp: code của hàng chịu được 064 chưa áp (AC-5); dữ liệu vùng mới chỉ có phường sau khi áp 064 + có ranh giới S04.
- Known limits — thu phạm vi sau khi hết trần 3 lượt chấm (Mạnh 31/10 «Đồng ý theo lời khuyên»):
  - AC-9 cũ (bộ test chung `pipeline/` và `scripts/` xanh): ship không có bằng chứng máy của lượt chấm hồ sơ. Ba lượt đỏ vì ba lý do môi trường (test hết giờ và rớt kết nối khi DB máy thu quá tải bởi các bản chép 3,4 GB chạy song song; một tin S06 trôi phường sau lượt thu bù), không lượt nào do code của hàng. CI của PR chạy lại hai bộ này trên môi trường riêng.
