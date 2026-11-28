---
schema_version: 1
feature: data-api chỉ trả tin hiển thị được (PB7) — /v1/listings ở mọi nhánh, bộ lọc, căn giá tốt và chi tiết không trả tin của nguồn S02, S08; danh sách nguồn ẩn một nguồn chung với cổng Invest
slug: data-api-tin-hien-thi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
design_doc: _acceptance/data-api-tin-hien-thi/design.md
approved_by: Mạnh
approved_at: 2026-11-27
---

# Acceptance Contract: data-api-tin-hien-thi

## Context

Cổng Invest không bao giờ hiện tin của S02, S08 (AGENTS.md luật 5, 6; `OFFER_HIDDEN_SOURCES` trong
`app/src/lib/offers-filters.ts`). `/v1/listings` của data-api sau PB2 đọc `sale_offers` không lọc nguồn — finding HIGH ngoài
hợp đồng của PB2 vòng 2; Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng PB2 (27/11), GS cấp mã PB7 và xếp là điều kiện trước
khi mở API. Đo 27/11 trên bản chép DB M5: 0 dòng S02, 0 dòng S08 lọt — lỗ tiềm ẩn. **Phụ thuộc: PB2
(`data-api-hop-dong-reso-dd-2-1`) gộp trước** — nhánh dựng trên đầu PB2 đã ký `51e9d84d8`. Phương án: `design.md` §2.

## Criteria

- AC-1: Given `pipeline/mappings.yaml` sau hàng, When đọc sổ và chạy `node pipeline/vocab.mjs --check`, Then danh sách mã
  nguồn không hiển thị công khai (S02, S08) được viết ĐÚNG MỘT chỗ — khoá `nguon_khong_hien_thi` của `mappings.yaml`, mỗi mục
  kèm căn cứ; các tệp sinh (`app/src/lib/vocab.generated.ts`, `agent/src/vocab.generated.ts`,
  `pipeline/lib/vocab.generated.mjs`, đích mới `data-api/src/contract/vocab.generated.ts`) mang hằng `SOURCE_HIDDEN` khớp sổ;
  `vocab --check` thoát 0; và chiều đỏ cùng lượt: sửa tay hằng ở bản chép một tệp sinh → `vocab --check` đỏ gọi tên tệp đó.
- AC-2: Given cây sau hàng, When soát mã nguồn của `app/src`, `data-api/src`, `pipeline/`, `scripts/` (trừ tệp sinh và
  `mappings.yaml`), Then không chỗ nào viết tay nhóm mã nguồn ẩn (mảng hay chuỗi liệt kê S02 cùng S08 làm danh sách nguồn
  ẩn); `OFFER_HIDDEN_SOURCES` của app và điều kiện nguồn của data-api đều lấy từ `SOURCE_HIDDEN` của tệp sinh; chiều đỏ cùng
  lượt: cấy `["S02", "S08"]` vào bản chép `data-api/src/routes/listings.ts` → «PB7 danh sách nguồn ẩn viết tay: <tệp>».
- AC-3: Given DB thử có lược đồ thật, một tin bán S02 và một tin thuê dài hạn S08 cấy (đủ trường), cùng phường với hai tin
  S06 đối chứng khớp đúng bộ lọc của chúng (một tin bán, một tin thuê dài hạn), When gọi `GET /v1/listings` theo ma trận ô
  viết trước trong test (đường: không `kind` · `kind=sale` · `kind=rent_lt` · `kind=rent_st`; bộ lọc: không lọc · `area` ·
  `market` · `bedroomsTotal` · `limit`/`offset`), Then ở MỖI ô không thân nào chứa khoá hay mã của hai tin cấy, không phần tử
  nào mang `originatingSystemName` S02 hay S08, và tin S06 đối chứng của ô có mặt (ô bán: tin bán; ô thuê dài: tin thuê; ô
  không kind: cả hai); mọi phần tử `rent_st` mang S01. Số ô assert = số ô của ma trận.
- AC-4: Given hai tin cấy của AC-3 và hai tin S06 đối chứng có dòng trong bảng hạng giá, When gọi
  `GET /v1/listings?minBelowMedianPct=0` theo ma trận ô viết trước (không `kind` · `kind=sale` · `kind=rent_lt` · `project`) ở
  nhánh bảng hạng, và ở nhánh thước CG8 (bảng hạng rỗng; nhóm phường × loại có đủ năm căn S06 không ẩn cộng tin S02), Then ở
  MỖI ô không thân nào chứa hai tin cấy và tin S06 đối chứng của ô có mặt.
- AC-5: Given hai tin cấy, When gọi `GET /v1/listings/<khoá của tin>`, Then 404 `{error: {code: "NOT_FOUND", …}}` y như khoá
  không có; chi tiết tin S06 đối chứng 200.
- AC-6: Given bản chép `data-api/`, When chạy cùng tệp test ở ba ô — (goc) không đổi; (bo-loc) điều kiện nguồn bị bỏ khỏi
  `routes/listings.ts`; (theo-so) hằng `SOURCE_HIDDEN` của bản chép `data-api/src/contract/vocab.generated.ts` thêm S06 — Then
  ô goc xanh; ô bo-loc: các ca AC-3, AC-4, AC-5 đỏ và số thông điệp ghim «PB7 nguồn ẩn lọt ra API: <S0x> ở <ô>» khác nhau bằng
  đúng số ô của hai ma trận cộng hai chi tiết; ô theo-so: tin S06 đối chứng vắng ở mọi ô với thông điệp ghim «PB7 điều kiện
  nguồn không theo SOURCE_HIDDEN: <ô>» (điều kiện nguồn đổi theo sổ, không phải hai chuỗi viết riêng).
- AC-7: Given bản chép DB của máy (`db/db-thu.sh`, chỉ đọc), When gọi chính route `/v1/listings` (mọi `kind`, phân trang
  hết) của bản nền — `routes/listings.ts` ở merge-base, sha in ra — và của bản sau hàng, rồi đếm khoá tin nguồn ẩn trả về, Then số trước = số sau = số dòng nguồn ẩn trong bảng hôm nay ghi rõ
  (27/11: 0 — «lỗ tiềm ẩn đã đóng»), số khoá còn lại bằng nhau trước/sau; probe không chứa chuỗi SQL tập ghép; chiều đỏ cùng
  lượt: cấy một dòng S08 vào bản chép DB → trước ≥ 1, sau 0; bản chép route bỏ điều kiện nguồn → sau ≥ 1.
- AC-8: Given cây sau hàng, When chạy suite app (`npm test` của app), test pipeline của sổ từ vựng và
  `pipeline/scripts/do-s03-len-cong.mjs --ben-doc`, Then cổng Invest giữ nguyên hành vi (`VISIBLE` không đổi chữ, chỉ đổi
  nguồn hằng), mọi test xanh; `do-s03-len-cong.mjs` nhập danh sách từ `pipeline/lib/vocab.generated.mjs` (không đọc chữ tệp
  của app), in «nguồn ẩn: S02, S08»; chiều đỏ cùng lượt: bản chép tệp sinh có `SOURCE_HIDDEN` rỗng → script thoát ≠ 0 kèm
  thông điệp ghim.
- AC-9: Given nhánh sau hàng, When soát, Then mọi tệp đổi nằm trong ranh giới (`data-api/**`, `pipeline/mappings.yaml` chỉ
  thêm khoá `nguon_khong_hien_thi`, `pipeline/lib/vocab-core.mjs`, bốn tệp sinh, `app/src/lib/offers-filters.ts` chỉ dòng
  hằng nguồn ẩn, `pipeline/scripts/do-s03-len-cong.mjs`, test của sổ từ vựng, `_acceptance/data-api-tin-hien-thi/**`,
  khoá `executors.*.dapi_an*` của `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`); toàn cây `data-api/` không có
  tên nguồn thật ngoài dạng định danh đã biết (bộ quét PB5); `npm run typecheck` của data-api và `tsc --noEmit` của app thoát 0.

## Coverage

- Trục A — đường đọc tin: danh sách · căn giá tốt (bảng hạng) · căn giá tốt (thước CG8) · chi tiết · thuê ngắn hạn
  [thước CE: tập ghép `tapGhep` + hai nhánh giá tốt của `listings.ts`; AC-3, AC-4, AC-5]
- Trục B — bộ lọc: không kind · từng kind · area · market · bedroomsTotal · limit/offset · project [AC-3, AC-4]
- Trục C — nguồn: S02 (bán) · S08 (thuê dài) · S06 đối chứng · S01 (thuê ngắn hạn, bảng không có cột nguồn) [AC-3]
- Trục D — một nguồn: sổ · bốn tệp sinh · app · data-api · script pipeline [AC-1, AC-2, AC-8]
- Trục E — chiều đỏ: bỏ điều kiện · sửa tay tệp sinh · literal viết tay · cấy dòng DB [AC-1, AC-2, AC-6, AC-7]
- Bỏ ngoài: trọn luật `VISIBLE` (Hỏi-1), route app `/api/v1/*` (đã có luật) — Out of scope.

## Đường đo

- AC-7: số dòng nguồn ẩn trước/sau trên bản chép DB — probe `do-db.mjs`, chạy được ở máy có DB thật (M5, Mac mini).

## Out of scope

- Trọn luật `VISIBLE` của app (hạn 30 ngày, đủ năm trường lõi, ngưỡng giá) cho `/v1/listings` — đổi số tin API trả (đo
  27/11: −29.250 tin bán, −23.362 tin thuê dài) và ma trận loại hình PB2-AC-4; quyết định sản phẩm riêng (Hỏi-1).
- Route app `/api/v1/*` (đã dùng `VISIBLE`), Ops, sync cloud, triển khai data-api, `sync-public`.
- Thuê ngắn hạn: bảng `listings` không có cột nguồn (chỉ S01 tự thu) — hàng không thêm cột; AC-3 chỉ khẳng định mọi phần tử
  mang S01.
- Đổi tên `occupancyRate` (câu đã chốt ở PB2: giữ tên).
- Lọc nguồn ẩn trong thước tính sẵn của pipeline (`v_ruler_p2`, `pipeline/sql/420_price_rank.sql`): trung vị sinh
  `belowMedianPct` là việc của pipeline, data-api chỉ đọc; hôm nay 0 dòng S02, S08 trong `sale_offers` (gap-probe P2).

## Notes

- Phụ thuộc PB2 gộp trước; bản vá nháp (danh sách chép + test khớp) ở `.acceptance-runs/data-api-hop-dong-reso-dd-2-1/ban-va-s02-s08.patch`
  của worktree PB2 — hàng này thay phần chép tay bằng hằng sinh.
- Tệp ngoài vùng M5 (`pipeline/lib/**`, `pipeline/mappings.yaml`, `app/src/lib/**`, `agent/src/**`, `pipeline/scripts/**`)
  chờ GS cho sửa trước S3.
