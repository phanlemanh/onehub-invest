---
schema_version: 1
feature: data-api — tài nguyên Property (danh bạ nhà): tra toà và căn theo mã OneHub hoặc theo dự án + toà + mã căn, trả khung định danh và thuộc tính căn theo tên RESO DD 2.1, không cho dò hàng loạt
slug: data-api-property-danh-ba-nha
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api, docs]
status: verified
design_doc:
approved_by: Mạnh
approved_at: 2026-11-27
---

# Acceptance Contract: data-api-property-danh-ba-nha

> Mã hàng PB6 (GS giao 27/11, «API căn»). Tên tài nguyên theo lời Mạnh 27/11: «API có thể đặt đúng tên là Listing (Tin
> rao) và Property (Danh bạ nhà)». AC-1–AC-11 viết theo khuyến nghị của ba câu Hỏi; bảng «Lối khác → AC đổi» ở cuối ghi
> đúng AC nào đổi khi Mạnh chọn khác. Viết lại sau phản biện context sạch 27/11 (3 P0, 15 P1, 9 P2 — `gap-probe.md`).

## Context

Khách đầu của API dữ liệu (CRM của đội, rồi CRM đối tác — bản đề xuất 24/11, `docs/research/de-xuat-mo-api-2411.md`, chưa
là kế hoạch chung) cần tra **một căn có thật**: nhập dự án + toà + mã căn như trên hợp đồng, nhận về định danh bền của
OneHub và thuộc tính căn. Hôm nay `data-api` chỉ có tin (`/v1/listings`). Danh bạ vật thể (ADR-0016) ở `buildings`,
`stacks`, `units`, bí danh `registry_aliases`, phát biểu thuộc tính (`v_unit_thuoc_tinh`).

**Ba sự thật đổi cách đọc hàng này** (đếm 27/11):
1. Danh bạ căn gần như là danh mục S16: 109 922/111 671 căn và 109/307 toà **chỉ có** bí danh S16; 100 % thuộc tính căn từ
   S16. ROADMAP §3 «Nguồn S16» (14/11): hiện mã căn lấy bằng đăng nhập lên API công khai **chưa có lời — mặc định chỉ nội bộ**.
2. «Mã căn» mà khách nhập chính là phần mã của bí danh nguồn (`ma_nguon` S16 dạng `<dự án>/<MÃ>`, hay S08). Trả mã căn ra là
   trả mã của nguồn; vì vậy API **chỉ nhắc lại mã căn khách đã nhập**, không phát mã căn nào khách chưa biết.
3. Khoá phụ RESO `UniversalPropertySubId` của kho = `<khoá trục>:<tầng>`: phát ra thì khách lặp tầng là dò được cả cột căn.
   API **không trả** `UniversalPropertySubId` và khoá trục; căn mang khoá mờ `unitKey` (ULID ngẫu nhiên, ADR-0016) — không
   suy được căn khác từ một căn.

**Tên «Property» khác nghĩa RESO**: resource `Property` của RESO DD 2.1 là một tin (ADR-0013 §1); căn vật lý là UPI + resource
`Building`. Ở OneHub, «Property» = danh bạ nhà — tên tài nguyên theo từ vựng kho, tên trường bên trong theo RESO.

**Chỉ chạy tại máy thu tới khi danh bạ lên cloud**: bốn bảng danh bạ không đồng bộ cloud (migration 082, ADR-0016 §9) — hàng
này xong thì CRM ngoài vẫn chưa gọi tới được; đồng bộ cloud là hàng riêng cần lời riêng của Mạnh.

Vùng: `data-api/src/routes/properties.ts` (mới), `data-api/src/contract/property.ts` (mới, danh sách khoá duy nhất),
`data-api/src/app.ts` (mount + `/openapi.json`), `data-api/src/middleware/error-handler.ts` (không để lọt chữ SQL),
`data-api/README.md`, `data-api/CLAUDE.md`, `data-api/test/properties.test.ts` (mới), `data-api/test/dong-ba-route.test.ts`
(thêm ca PB6 theo luật của `data-api/CLAUDE.md`), `pipeline/mappings.yaml` (mục Property của `api_extensions` + bảng đổi loại
căn), đúng các khoá `executors.*.dapi_prop*` thêm vào `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`, hồ sơ
này. `CONTEXT.md` (mục «Danh bạ nhà», slug `properties`, sửa «Căn nhà» trỏ danh bạ): ngoài vùng M5 — chờ GS cho, phải có
trước khi gộp.

## Bảng phủ ca (đếm 27/11 trên DB `oneinvest` của M5 — bản đầy đủ máy thu chép sang 26/11; chỉ đọc)

| Ô | Số đếm | AC |
|---|---|---|
| Toà active | 307 — VN-HN 197, VN-SG 89, VN-66 21; `xac_minh` 178, `mot_loi_khai` 129 | AC-1, AC-10 |
| Toà chỉ có bí danh S16 | 109 | AC-1, lối khác Hỏi-3 |
| Toà có tên theo nguồn | S09 129 · S16 109 · S08 69 · S03 25 (một toà nhiều tên) | AC-1, AC-3 |
| Căn active | 111 671 (mọi căn có toà); `merged` 2 | AC-2, AC-9 |
| Căn chỉ có bí danh S16 | 109 922 | AC-2, lối khác Hỏi-3 |
| Căn có mã S08 | 1 749 (chỉ S08 340 · S08 + S16 1 409) | AC-2, AC-4 |
| Căn có trục + tầng · không trục | 83 410 · 28 261 | AC-2, AC-7 |
| Căn có thuộc tính | 84 822 (100 % S16); loại: apartment 67 759 · house 10 787 · commercial 4 436 · trống 1 840 | AC-2, AC-8 |
| Căn trong toà có tin đang rao | 66 109 | AC-1 |
| Mã căn người đọc S16 (dự án + toà + mã) | 147 266 dòng, 0 trùng trong cùng dự án + toà | AC-3 |
| Căn nhà từ tin (`properties`) | 121 738, 0 gắn toà | ngoài phạm vi, vì không phải căn danh bạ |
| Danh bạ trên cloud | không có | AC-10 |

## Criteria

Chung: DB thử có lược đồ thật (`db/db-thu.sh --chay`, bản chép dữ liệu thật); dòng cấy mang dự án cấy riêng (tên, mã không
trùng dữ liệu thật). Mỗi ca **khẳng định status 200 và có phần tử cấy trong thân** trước khi soát chuỗi canh. Chuỗi canh cấy
vào: bí danh `ma_nguon` (cả phần `<dự án>/` lẫn phần mã), bí danh `ten` của nguồn bị loại, `field_assertions` (căn cứ, nguồn),
cột `nguon` của `v_unit_thuoc_tinh`, tên nút dự án/phân khu nội bộ. Mọi khoá phần tử lấy từ `data-api/src/contract/property.ts`.
Mọi giá trị mẫu trong README, openapi, test là giả và không khớp bí danh nào của DB thử.

- AC-1 (toà): Given dự án cấy có hai toà — `T1` (bí danh tên S09 «Tháp A», S16 «A», S03 «toà A»; phân khu; phường; `xac_minh`;
  ba căn, một tin đang rao gắn toà) và `T2` (`mot_loi_khai`, chỉ tên S03) — When gọi `GET /v1/properties/<UniversalPropertyId
  của T1>`, Then 200, phần tử có đúng tập khoá cấp toà: `universalPropertyId`, `buildingKey`, `buildingName`, `complexName`
  (= phân khu, ADR-0013 §2), `subdivisionName` (= dự án), `projectId` (extension: id nút dự án của kho), `city` (phường),
  `stateOrProvince` (mã ISO 3166-2 của `iso_region`, giá trị local — DD chỉ có bang Mỹ, Canada), `country` = `VN`,
  `catalogTier` (extension), `unitCount` (chỉ đếm căn `active` khách được thấy), `activeListingCount` (extension: tin `active`
  gắn toà qua `offer_building`, `muc = toa`, `status = gan`); `buildingName` lấy theo thứ tự nguồn S09 → S08 → S16 → S03 (T1 ra
  «Tháp A»); hai lần gọi cùng kết quả; `T2` ra `catalogTier` = `mot_loi_khai`.
- AC-2 (căn): Given ba căn của `T1` — `C1` có trục + tầng + thuộc tính S16, `C2` không trục + thuộc tính S16, `C3` có mã S08 và
  mã S16 — When gọi `GET /v1/properties/<UPI của T1>/units/<unitKey>` cho từng căn, Then phần tử có đúng tập khoá cấp căn: khoá
  cấp toà + `unitKey` (extension, khoá mờ `unt_…`), `unitFloorLocation` (tầng; null khi không biết), `livingArea`,
  `livingAreaUnits` = `Square Meters` (StandardName của AreaUnits trong DD 2.1), `bedroomsTotal`, `bathroomsTotalInteger`,
  `propertySubType`; giá trị khớp phát biểu cấy; **không** có `unitNumber`, `universalPropertySubId`, khoá trục, `stack`.
- AC-3 (tra theo mã): Given cùng dữ liệu, When gọi `GET /v1/properties/lookup?project=<id nút hoặc tên dự án>&building=<buildingKey
  hoặc tên toà>&unitNumber=<mã căn>`, Then mã căn khớp đúng một căn → 200 `{data: [<phần tử AC-2 + unitNumber = đúng chuỗi khách
  nhập>], meta: {total: 1}}`; tên dự án, tên toà khớp sau khi gập chữ (bỏ dấu, hoa thường, khoảng trắng) với mọi bí danh `ten` của
  nguồn được phép; tên toà khớp hai toà trong cùng dự án → 400 `{error: {code: "AMBIGUOUS_BUILDING", message}}`; thiếu một trong
  ba tham số → 400 `BAD_REQUEST`; không khớp → 200 `{data: [], meta: {total: 0}}`; hai mã căn của cùng một căn (`C3`) ra cùng
  `unitKey`; không chấp nhận mã dự án, mã toà của nguồn (đầu vào khớp bí danh `ma_nguon` → 400 `SOURCE_CODE_NOT_ACCEPTED`).
- AC-4 (liệt kê có trần): Given cùng dữ liệu, When gọi `GET /v1/properties?project=<id hoặc tên>` với `limit`/`offset`, Then trả
  danh sách **toà** (hình AC-1) của dự án, `meta.total` = tổng toà khớp, `limit` trần 100, hai trang liền không trùng không sót;
  không đường nào trả danh sách căn; GET toà không có mảng căn.
- AC-5 (không dò được): Given `C1`, When một khách có `unitKey` của `C1` thử suy căn khác (đổi ký tự cuối `unitKey`, gọi với tầng
  ±1, gọi lookup với mã căn liền kề) , Then không lời gọi nào trả căn không trùng mã khách đã nhập; ca đếm «số căn lộ thêm khi dò
  từ một căn» = 0.
- AC-6 (không lộ): Given mọi lời gọi của AC-1–AC-5 kể cả thân 400/404/503 và `/openapi.json`, Then không chuỗi canh nào xuất hiện;
  bộ lấy tên `scripts/lib/tier-a-source-names.mjs` ra 0 cụm; không khoá `nguon`, `evidence`, `originatingSystemName`,
  `originatingSystemKey`, `aliases` ở mọi cấp; ngoài `unitNumber` nhắc lại ở AC-3, không giá trị bí danh `ma_nguon` nào (cả hai
  phần) ra thân.
- AC-7 (gộp, nghỉ): Given một toà và một căn cấy `status = merged` trỏ `merged_into`, When GET bằng khoá cũ, Then 404
  `{error: {code: "MERGED", message, mergedInto: <khoá mới cùng dạng>}}`; `unitCount` không đếm căn đã gộp.
- AC-8 (loại căn): Given mọi giá trị khác nhau của `v_unit_thuoc_tinh.property_sub_type` trong DB thử, When đổi qua bảng
  `mappings.yaml` (apartment → `Condominium`, house → null — Townhouse/Single Family Residence chưa phân biệt, commercial → null,
  unknown/trống → null), Then 0 giá trị không có dòng đổi; giá trị local không bao giờ ra API.
- AC-9 (đối chứng): Given test của AC-1–AC-8, When chạy trên bản chép tạm của `data-api/` với ba đột biến — không mount
  `properties`; route ghép bí danh `ma_nguon` vào thân; route trả `universalPropertySubId` — Then đột biến một đỏ ở mọi ca,
  đột biến hai đỏ ở AC-6, đột biến ba đỏ ở AC-2 và AC-5, mỗi ca thông điệp ghim riêng «PB6 <ca> …»; bản không đột biến xanh.
- AC-10 (cloud, lỗi): Given DB không có bảng `buildings` (môi trường cloud hôm nay), When gọi mọi đường Property, Then 503
  `{error: {code: "DIRECTORY_UNAVAILABLE", message: "danh bạ chưa lên cloud"}}`; và với mọi lỗi của route Property, thân không
  chứa chữ SQL, tên bảng hay tên cột (bộ xử lý lỗi trả thông điệp chung, ghi chi tiết vào log máy chủ).
- AC-11 (tên chuẩn, ranh giới): Given tệp hợp đồng, bản DD 2.1 máy đọc (`research-local/reso/dd-2.1.json`, chỉ ở máy thu — eval
  chạy tại máy, CI bỏ qua có tên) và `pipeline/mappings.yaml`, Then mỗi khoá không phải extension là camelCase của field có thật
  ở `Building` hoặc `Property`; lookup trả ra là StandardName có thật, trừ `stateOrProvince` (giá trị local ISO 3166-2, khai lý
  do); mỗi extension (`projectId`, `catalogTier`, `unitCount`, `activeListingCount`, `unitKey`) có mục đủ sáu điều kiện ADR-0011
  Qđ 3; chiều đỏ cùng lượt (khoá không khai, tên DD không có, lookup sai chữ, extension thiếu mục); và mọi tệp đổi nằm trong Vùng;
  `/openapi.json` có schema toà, căn sinh từ tệp hợp đồng; README có mục «Property — danh bạ nhà» ghi khác RESO `Property`, ghi
  «chỉ tại máy thu tới khi danh bạ lên cloud»; `dong-ba-route.test.ts` có ca PB6 và xanh; lưới tên nguồn PB5 sạch; `npm run
  typecheck` thoát 0.

## Coverage

- Trục A — cấp: toà xác minh · toà một lời khai · toà chỉ S16 · căn có trục · căn không trục · căn hai nguồn · căn gộp [AC-1, AC-2, AC-7]
- Trục B — cách gọi: UPI toà · UPI + unitKey · dự án + toà + mã căn · liệt kê toà · không khớp · mơ hồ · mã nguồn làm đầu vào [AC-1–AC-4]
- Trục C — dò: khoá liền kề · tầng ±1 · mã liền kề [AC-5]
- Trục D — đường lộ: mã nguồn (hai phần) · tên nguồn bị loại · căn cứ, nguồn của phát biểu · thân lỗi · openapi [AC-6, AC-10]
- Trục E — tên chuẩn và giá trị: field DD 2.1 · lookup · extension · giá trị loại căn thật [AC-8, AC-11]

## Đường đo

Miễn — hàng nền của «API cho bên ngoài», chỉ chạy tại máy thu tới khi có hàng đồng bộ danh bạ lên cloud; không có số trên màn
khách nào thấy. Số theo dõi nội bộ: số căn tra được / 20 mã căn rút ngẫu nhiên từ chữ tin S03 có mã căn (mã khách thật viết),
in ở lượt chấm, không có ngưỡng.

## Out of scope

- Đồng bộ danh bạ lên cloud — DDL và ghi cloud là lời riêng của Mạnh; hàng riêng (GS cắt).
- Hướng căn (`direction_faces`: trục local, mảng, nghĩa riêng GN1) — cần bảng đổi sang DirectionFaces; thêm sau, không phá.
- Căn nhà từ tin (`properties`, 0 gắn toà); giá chủ đầu tư, quỹ căn S08; nối căn sang tin của căn; thửa, nhà phố; tài khoản
  khách, đếm lượt, hoá đơn; trần lượt gọi theo khoá (đi cùng tài khoản khách).

## Lối khác → AC đổi

| Câu (sổ quyết định) | Nếu Mạnh chọn lối khác | AC đổi |
|---|---|---|
| Hỏi-1 trả gì | Chỉ khung định danh | AC-2 bỏ năm khoá thuộc tính; AC-8 bỏ; AC-11 bỏ bảng loại căn |
| Hỏi-2 tra hay liệt kê | Cho liệt kê căn trong một toà | AC-4 thêm `GET …/units` có trang; AC-5 đổi thành «dò chỉ ra căn của toà đã liệt kê» |
| Hỏi-3 S16 | Giữ S16 chỉ nội bộ | AC-1: toà chỉ có bí danh S16 (109) → 404; tên S16 không dùng cho `buildingName`, không khớp ở `building=`; `unitCount` không đếm căn chỉ S16. AC-2: căn chỉ S16 → 404; căn S08 + S16 (`C3`) ra với thuộc tính null. AC-3: chỉ khớp mã căn S08; mã S16 → 200 rỗng. AC-6: thêm canh — không giá trị nào suy từ S16. Còn lại: 198 toà, 1 749 căn, 0 thuộc tính |

## Notes

- Đã tra tri thức (dòng sổ đầu): `wiki/chu-de/danh-ba-nha.md`, `wiki/dot/thuoc-tinh-can-s16-1811.md`; ROADMAP §3 «Nguồn S16».
- `livingAreaUnits`: DD 2.1 StandardName là `Square Meters` (đã tra, có dấu cách); ADR-0013 §8 viết `SquareMeters` — lệch chữ
  ở ADR, ghi cho hàng sửa ADR.
