---
schema_version: 1
feature: /v1/listings đóng (503) khi sổ nguồn ẩn rỗng hay không đọc được thay vì trả cả tin của nguồn phải ẩn, và ma trận nguồn ẩn của PB7 có thêm ô «không lọc» chấm bằng máy (PB10)
slug: data-api-nguon-an-dong-khi-so-rong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: approved
design_doc: docs/superpowers/specs/2026-11-28-data-api-nguon-an-dong-khi-so-rong-design.md
approved_by: Mạnh
approved_at: 2026-11-28
---

# Acceptance Contract: data-api-nguon-an-dong-khi-so-rong

## Context

Ngoài-2 của PB7 (Mạnh «mở hợp đồng mới», Cổng Bằng chứng 28/11): sổ nguồn ẩn rỗng hay mất khoá thì điều kiện
`o.source <> ALL(ARRAY[]::text[])` đúng với mọi dòng và `/v1/listings` lặng lẽ trả tin S02, S08 (fail-open). Cùng hàng: ô «không lọc»
mà PB7 AC-3 ghi trong ma trận nhưng test không có — Cổng Bằng chứng PB7 phải đo tay (200, 0 tin ẩn lọt). Đo 28/11 trên DB M5:
`sale_offers` 0 dòng S02, 0 dòng S08 — lỗ tiềm ẩn. Hàng nền API: không ô nào trên màn Invest đổi. Phương án: `design.md` §2.

## Criteria

- AC-1: Given bộ kiểm sổ `kiemNguonAn` (`data-api/src/lib/nguon-an.ts`, nhận `unknown`), When chạy trên ma trận chín trạng thái viết
  trước trong test — `["S02","S08"]` · `[]` · `[""]` · `["S2"]` · `[" S02"]` · `["S02","S02"]` · `undefined` · `null` · chuỗi `"S02"` (không
  phải mảng) — Then chỉ trạng thái đầu trả danh sách (đúng hai mã, đúng thứ tự), tám trạng thái còn lại trả `null` và không ném lỗi;
  số ô assert = 9.
- AC-2: Given DB thử có lược đồ thật, một tin bán S02 và một tin thuê dài S08 cấy (đủ trường, có dòng bảng hạng), hai tin S06 đối
  chứng, một tin ngắn hạn cấy, When gọi route dựng bằng `taoListingsRoute(<trạng thái>)` với MỖI trạng thái không hợp lệ của AC-1 (8)
  theo ma trận đường viết trước — không kind · `kind=sale` · `kind=rent_lt` · `kind=rent_st` · `minBelowMedianPct=0` ·
  `minBelowMedianPct=0&project=<nút>` × bộ lọc không lọc · `area` · `market&bedroomsTotal` · `limit&offset`, cộng chi tiết tin S02 · tin
  S06 · tin ngắn hạn — Then mọi ô trả 503 với thân đúng `{"error":{"code":"HIDDEN_SOURCES_NOT_CONFIGURED","message":<chuỗi ghim>}}`,
  thân không chứa khoá hay mã tin nào đã cấy, bộ ghi SQL bắt 0 câu đọc `sale_offers` hay `listings` trong các ô ấy; số ô assert =
  8 × (6 × 4 + 3) = 216. Đối chứng cùng tệp: route dựng từ sổ hợp lệ trên đúng 27 đường ấy trả 200/404 như route thật, và bộ ghi SQL
  bắt ≥ 1 câu đọc `sale_offers` (đường bán/thuê dài, căn giá tốt, chi tiết S02/S06) hay `listings` (rent_st, chi tiết ngắn hạn) ở mỗi
  đường — bộ ghi chứng nó sống.
- AC-3: Given bản chép `data-api/` ở thư mục tạm (không ghi cây nguồn), When chạy cùng tệp test ở bốn ô — (goc) không đổi; (bo-chot)
  `taoListingsRoute` bỏ nhánh 503 và dựng điều kiện nguồn từ `Array.isArray(ds) ? ds : []`; (bo-kiem) `kiemNguonAn` trả nguyên đầu
  vào khi là mảng, `[]` khi không; (bo-loc) điều kiện nguồn bị bỏ khỏi tập ghép — Then ô goc xanh; bo-chot: ca PB10-AC-2 đỏ, thông
  điệp ghim «PB10 nguồn ẩn mở khi sổ <trạng thái>: <ô>» có ở đủ tám trạng thái, và với sổ rỗng có «PB10 tin nguồn ẩn lọt khi sổ rỗng:
  <ô>» ở mọi ô bán/thuê dài không lọc (6 ô: không kind, sale, rent_lt × không lọc; căn giá tốt, căn giá tốt + project × không lọc;
  chi tiết S02 — liệt tên trong test); bo-kiem: ca PB10-AC-1 đỏ, «PB10 sổ hỏng được nhận: <trạng thái>» đúng tám lần; bo-loc: các ô
  «không lọc» của AC-4 đỏ như AC-4 ghi.
- AC-4: Given sổ hợp lệ và các tin cấy của PB7 mang khoá xếp đầu theo `listingKey`, When ma trận AC-3 của PB7
  (`data-api/test/tin-hien-thi.test.ts`, 4 đường: không kind · sale · rent_lt · rent_st) có thêm bộ lọc «không lọc» (không area, không
  market; `limit=200`), Then ma trận = 4 × 6 = 24 ô, số assert = 24; ở mỗi ô «không lọc»: không tin S02, S08 nào lọt, và đối chứng dương
  của ô có mặt — tin S06 bán (không kind, sale) và tin S06 thuê dài (không kind, rent_lt) trên trang đầu nhờ khoá xếp đầu; tin ngắn
  hạn cấy ở rent_st·không lọc tìm bằng phân trang hết bảng `listings` (989 dòng trên DB M5); không kind·không lọc không đòi đối chứng
  ngắn hạn (phân trang hết tập ghép ~150k dòng — ghi rõ trong test). Chiều đỏ (ô bo-loc của AC-3): ba ô «không lọc» có tin bán/thuê dài
  (không kind, sale, rent_lt) đỏ với «PB7 nguồn ẩn lọt ra API: <S0x> ở <đường>·không lọc».
- AC-5: Given cây sau hàng, When soát, Then (a) với sổ hỏng (route dựng từ `[]` và từ `undefined`), `/health`, `/v1/markets`,
  `/v1/price-stats?market=`, `/v1/coverage`, `/v1/properties?project=` trả cùng mã như với sổ hợp lệ, app dựng không ném lỗi; (b) mọi
  tệp đổi nằm trong `data-api/**`, `_acceptance/data-api-nguon-an-dong-khi-so-rong/**`, khoá `executors.*.dapi_nad*` của
  `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`, design doc; (c) bộ quét «danh sách nguồn ẩn viết tay» của PB7 và rào
  S02 của HT20 xanh; (d) `/openapi.json` và README ghi mã đóng của `/v1/listings` theo lối Mạnh chọn ở Hỏi-1; `npm run typecheck` của
  data-api thoát 0.

Lối khác của Hỏi-1 → AC đổi: chọn «200 rỗng» thì AC-2 đổi thành «mọi ô 200 với `{data: [], meta: {total: 0, …}}`, chi tiết 404 như
khoá không có», AC-5 (d) bỏ ghi mã 503; AC-1, AC-3 (thông điệp đổi theo), AC-4 không đổi.

## Coverage

- Trục A — trạng thái sổ: hợp lệ · rỗng · phần tử rỗng · sai khuôn · khoảng trắng · trùng · undefined · null · không phải mảng
  [thước CE: `kiemNguonAn`; AC-1, AC-2]
- Trục B — đường: không kind · sale · rent_lt · rent_st · căn giá tốt (bảng hạng) · căn giá tốt + project · chi tiết S02/S06/ngắn hạn
  [thước CE: các handler của `taoListingsRoute`; AC-2, AC-4]
- Trục C — bộ lọc: không lọc · area · market+bedroomsTotal · limit/offset [AC-2, AC-4]
- Trục D — không lan: /health · markets · price-stats · coverage · properties [AC-5]
- Trục E — chiều đỏ: bỏ chốt · bộ kiểm nhận bừa · bỏ điều kiện nguồn · bộ ghi SQL chết (đối chứng dương AC-2) [AC-2, AC-3, AC-4]
- Số đếm từ DB M5 (28/11): S02 0, S08 0, S06 60.548 bán / 80.702 thuê dài, S03 3.790 / 5.694, S05 25 / 5, `listings` 989,
  `offer_price_rank` 150.764 — bảng phủ ca đầy đủ ở design doc §3.
- Bỏ ngoài: nhánh thước CG8 khi sổ hỏng (chốt đóng chạy trước mọi nhánh; PB7 AC-4 đo CG8 khi sổ hợp lệ) — Out of scope.

## Out of scope

- Bộ sinh sổ (`pipeline/lib/vocab-core.mjs`) từ chối sổ rỗng lúc sinh — ngoài ranh giới data-api; chốt ở data-api là lớp cuối.
- `/health` không phản ánh sổ hỏng (vẫn 200); đưa vào health là quyết định vận hành riêng.
- Đổi danh sách nguồn ẩn, trọn luật `VISIBLE` (PB7 Hỏi-1), kiểm tham số ở biên (PB20), triển khai data-api, `sync-public`.

## Notes

- Nhánh `fix/data-api-nguon-an-dong-khi-so-rong` do GS tạo trên origin từ main e594ffeaf (28/11).
