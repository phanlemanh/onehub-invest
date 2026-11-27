---
schema_version: 1
feature: data-api — tài nguyên Property (danh bạ nhà): tra toà và căn theo mã UPI hoặc theo dự án + toà + mã căn, trả khung định danh và thuộc tính căn theo tên RESO DD 2.1
slug: data-api-property-danh-ba-nha
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api, docs]
status: draft
design_doc:
approved_by:
approved_at:
---

# Acceptance Contract: data-api-property-danh-ba-nha

> Mã hàng PB6 (GS giao 27/11, «API căn»). Tên tài nguyên theo lời Mạnh 27/11: «API có thể đặt đúng tên là Listing (Tin
> rao) và Property (Danh bạ nhà)». AC viết theo khuyến nghị của ba câu Hỏi; Mạnh chọn khác thì AC ghi ở từng câu đổi trước
> khi ký.

## Context

Khách đầu của API dữ liệu (CRM của đội, rồi CRM đối tác — bản đề xuất 24/11, `docs/research/de-xuat-mo-api-2411.md`, chưa
là kế hoạch chung) cần tra **một căn có thật**: nhập dự án + toà + mã căn, nhận về định danh bền của OneHub và thuộc tính
căn. Hôm nay `data-api` chỉ có tin (`/v1/listings`), không đường nào đọc danh bạ. Danh bạ vật thể (ADR-0016) ở ba bảng
`buildings`, `stacks`, `units` + bí danh `registry_aliases` + phát biểu thuộc tính (`v_unit_thuoc_tinh`).

**Tên «Property» khác nghĩa RESO**: trong RESO DD 2.1, resource `Property` là một tin (ADR-0013 §1); căn vật lý là UPI
(`UniversalPropertyId` + `UniversalPropertySubId`) + resource `Building`. Ở OneHub, «Property» = Căn nhà (`CONTEXT.md`, code
`property`) — tên tài nguyên theo từ vựng kho, **tên trường bên trong theo RESO** (`Building.*`, `Property.UnitNumber`, …).
README ghi rõ chỗ khác này.

Vùng: `data-api/src/routes/properties.ts` (mới), `data-api/src/contract/property.ts` (mới, danh sách khoá duy nhất),
`data-api/src/app.ts` (mount + `/openapi.json`), `data-api/README.md`, `data-api/CLAUDE.md`, `data-api/test/properties.test.ts`
(mới), `pipeline/mappings.yaml` (mục `api_extensions` của Property), đúng các khoá `executors.*.dapi_prop*` thêm vào
`_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`, hồ sơ này. `CONTEXT.md` (mục «Danh bạ nhà» / slug
`properties`): ngoài vùng M5 — chờ GS cho.

## Bảng phủ ca (đếm 27/11 trên DB `oneinvest` của M5 — bản đầy đủ máy thu chép sang 26/11; chỉ đọc)

| Ô | Số đếm | Ai đọc phía sau |
|---|---|---|
| Toà (`buildings`, active) | 307 — Hà Nội 197, TP.HCM 89, khác 21; `xac_minh` 178, `mot_loi_khai` 129 | khách API (CRM) |
| Toà có tên theo nguồn | S09 129 · S16 109 · S08 69 · S03 25 (một toà có thể nhiều tên) | như trên |
| Căn (`units`, active) | 111 671 — mọi căn đều có toà (`building_key` NOT NULL) | như trên |
| Căn có mã nguồn S16 | 110 968 (S16 riêng 109 922, S16 + S08 1 409) | như trên |
| Căn chỉ có mã nguồn S08 (thông tin dự án công khai, mục 38) | 340 | như trên |
| Căn có trục + tầng | 83 410 · không trục 28 261 | như trên |
| Căn có thuộc tính (diện tích, PN, WC, hướng, loại) | 84 822 — **100 % từ S16** | như trên |
| Căn trong toà có tin đang rao (`offer_building` gắn toà, tin `active`) | 66 109 · toà không tin 45 562 | như trên |
| Mã căn người đọc (dự án + toà + mã căn của S16) | 147 266 dòng, 0 trùng trong cùng dự án + toà | khách nhập để tra |
| Căn nhà từ tin (`properties`, cụm tin S06 máy dựng) | 121 738 — 0 dòng gắn dự án hay toà | — (ngoài phạm vi, vì không phải căn danh bạ) |
| Bảng danh bạ trên cloud | `buildings`, `stacks`, `units`, `registry_aliases` **không đồng bộ cloud** (migration 082, ADR-0016 §9) | data-api trên Vercel đọc cloud |

## Criteria

Chung: DB thử có lược đồ thật (`db/db-thu.sh --chay`, bản chép dữ liệu thật); dòng cấy của test mang dự án cấy riêng (tên và mã
không trùng dữ liệu thật; `iso_region` chỉ nhận VN-HN, VN-SG nên không tách được theo vùng) để không lẫn dữ liệu thật, mỗi ca
khẳng định dòng cấy có mặt trước khi soát. Mọi khoá phần tử lấy từ tệp hợp đồng `data-api/src/contract/property.ts`.

- AC-1: Given một toà cấy (UPI, tên toà theo S09, phân khu, dự án, phường, tỉnh) có hai căn (một căn có trục + tầng + thuộc
  tính S16, một căn chỉ mã S08), When gọi `GET /v1/properties/<UniversalPropertyId của toà>`, Then 200, phần tử toà có đúng
  tập khoá của tệp hợp đồng cho cấp toà: `universalPropertyId`, `buildingKey`, `buildingName`, `complexName`,
  `subdivisionName`, `city` (phường), `stateOrProvince` (ISO 3166-2, từ `iso_region`), `country` = `VN`, `catalogTier`
  (extension), `unitCount`, `activeListingCount` (extension: số tin đang rao gắn toà) — giá trị khớp dòng cấy.
- AC-2: Given cùng dữ liệu, When gọi `GET /v1/properties/<UniversalPropertyId>/<UniversalPropertySubId>` cho từng căn, Then
  phần tử căn có đúng tập khoá cấp căn: các khoá cấp toà ở trên cộng `universalPropertySubId`, `unitNumber` (mã căn người
  đọc), `unitFloorLocation` (tầng), `stack` (extension, ADR-0013 §9), `livingArea` + `livingAreaUnits` = `Square Meters`,
  `bedroomsTotal`, `bathroomsTotalInteger`, `directionFaces` (`StandardName` của lookup DirectionFaces), `propertySubType`
  (`StandardName`) — căn S16 có thuộc tính khớp phát biểu cấy (Hỏi-1 a, Hỏi-3 a), căn chỉ S08 có thuộc tính null.
- AC-3: Given cùng dữ liệu, When gọi `GET /v1/properties?project=<mã dự án>&building=<tên hay mã toà>&unitNumber=<mã căn>`,
  Then trả đúng một căn khớp (cùng hình AC-2); thiếu một trong ba tham số → 400 `{error: {code, message}}`; không khớp → 200
  `{data: [], meta: {total: 0}}`; mã căn khớp ở hai toà khác nhau trong cùng dự án mà thiếu `building` → 400 (không đoán).
- AC-4: Given cùng dữ liệu, When gọi `GET /v1/properties?project=<mã dự án>` (liệt kê), Then trả danh sách **toà** của dự án
  (hình AC-1, có trang `limit`/`offset`), KHÔNG trả danh sách căn; `GET /v1/properties/<UPI toà>` không kèm mảng căn (Hỏi-2 a).
- AC-5: Given cùng dữ liệu, When gọi mọi đường ở AC-1–AC-4, Then thân không chứa giá trị mã nguồn nào trong
  `registry_aliases` (`kind = ma_nguon` của S16, S08, S09), không chứa `source_ids`, tên nguồn thật, đường dẫn hay định danh
  tài khoản thu (bộ lấy tên `scripts/lib/tier-a-source-names.mjs` + chuỗi canh cấy vào bí danh); `originatingSystemName`
  không có ở cấp căn (căn là của OneHub, nguồn chỉ là bằng chứng).
- AC-6: Given test của AC-1–AC-5, When thay `properties.ts` bằng bản rỗng (đường không mount) trong bản chép tạm của
  `data-api/`, Then mỗi ca đỏ với thông điệp ghim riêng («PB6 <đường> …»); bản không thay xanh.
- AC-7: Given tệp hợp đồng `data-api/src/contract/property.ts`, bản DD 2.1 máy đọc (`research-local/reso/dd-2.1.json`) và
  `pipeline/mappings.yaml`, When chạy probe đối chiếu, Then mỗi khoá không phải extension là camelCase của một field có
  thật ở resource ghi kèm (`Building` hoặc `Property`), mỗi giá trị lookup trả ra là `StandardName` có thật; mỗi extension
  (`catalogTier`, `unitCount`, `activeListingCount`, `stack`) có mục `dd: null` + `rationale` trong `mappings.yaml`; chiều đỏ
  cùng lượt (cấy khoá không khai, tên DD không có, lookup sai chữ, extension thiếu mục).
- AC-8: Given nhánh sau hàng, When soát, Then mọi tệp đổi nằm trong vùng ở Context; `/openapi.json` có schema toà và căn
  sinh từ tệp hợp đồng; `data-api/README.md` có mục «Property — danh bạ nhà» ghi rõ khác resource `Property` của RESO, bảng
  khoá, ba cách gọi; lưới tên nguồn PB5 sạch; `npm run typecheck` thoát 0; test cũ của data-api xanh.

## Coverage

- Trục A — cấp: toà · căn có trục + tầng · căn không trục · căn chỉ S08 [thước CE: bảng phủ ca; AC-1, AC-2]
- Trục B — cách gọi: UPI toà · UPI + SubId căn · dự án + toà + mã căn · liệt kê toà theo dự án · mã không có · mã mơ hồ
  [AC-1–AC-4]
- Trục C — nguồn của thuộc tính: S16 · S08 · không có [AC-2; Hỏi-3]
- Trục D — đường lộ: mã nguồn trong bí danh · tên nguồn thật · tài khoản thu [AC-5]
- Trục E — tên chuẩn: field `Building`/`Property` DD 2.1 · lookup · extension [AC-7]

## Đường đo

Hàng nền của «API cho bên ngoài», chưa có ngưỡng UAT. Số trên màn: trên DB máy thu, `GET /v1/properties?project=…&building=…
&unitNumber=…` trả đúng một căn cho mẫu 20 mã căn rút ngẫu nhiên từ danh bạ (đếm khớp/20, lệnh trong evals).

## Out of scope

- Đồng bộ `buildings`, `stacks`, `units`, `registry_aliases`, phát biểu thuộc tính lên cloud — **DDL và ghi cloud là lời riêng
  của Mạnh**; hàng riêng (GS cắt). Tới khi có, `/v1/properties` chỉ chạy trên DB máy thu, trên Vercel trả 503 có thông điệp
  ghim «danh bạ chưa lên cloud».
- Căn nhà từ tin (`properties` — cụm tin S06, 0 dòng gắn toà): không phải căn danh bạ; đường tin vẫn là `/v1/listings`.
- Giá chủ đầu tư, quỹ căn S08 (công khai theo mục 38) — thêm sau, đổi không phá.
- Nối từ căn sang tin rao của căn (chưa có tin gắn tới mức căn: «Gắn căn» B3 còn ít) — chỉ đếm tin theo toà.
- Thửa, nhà phố (cấp `parcel`) — danh bạ chưa có.
- Tài khoản khách, đếm lượt, hoá đơn (bản đề xuất 24/11).

## Notes

- Hỏi-1, Hỏi-2, Hỏi-3: ở sổ quyết định (thẻ in câu, khuyến nghị và lối khác).
- Đã tra tri thức (dòng sổ đầu): trang `wiki/chu-de/danh-ba-nha.md`, `wiki/dot/thuoc-tinh-can-s16-1811.md`; ROADMAP §3
  «Nguồn S16» 14/11: «hiện mã căn lấy bằng đăng nhập lên cổng Invest hay API công khai … mặc định chỉ nội bộ tới khi Mạnh
  nói khác» — Hỏi-3 là câu này.
