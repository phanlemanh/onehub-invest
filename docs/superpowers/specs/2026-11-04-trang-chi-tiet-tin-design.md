# Trang chi tiết tin — thiết kế (2026-11-04)

Hồ sơ `_acceptance/trang-chi-tiet-tin/`. Làm sau mốc 05/11; PR gộp sau `giai-thich-nhan-chua-xac-minh` (#305), vì trang dùng lại `OfferLabelHelp`.

## Bài toán

Phiên lái thử `s03-len-cong` (04/11, vấp 1): bấm thân thẻ, giá, tên người đăng, địa chỉ đều không có gì xảy ra. Thẻ chỉ có liên kết phường, mọi nguồn
như nhau. Route tin chỉ có hai trang danh sách `listings/sale`, `listings/rent`. Vòng `tin-rao-tren-invest` đã cố ý để lại việc này.

Người xem cần một chỗ để: xem đủ thông số một tin, so giá với phường, thấy tin tương tự, gửi đường dẫn cho người khác, rồi liên hệ người đăng.

## Giới hạn có sẵn của dữ liệu

Đo DB máy thu 04/11, đối chiếu `CLOUD_ALLOW` của `pipeline/sync-cloud.mjs`:

| Thứ | Máy thu | Cloud | Trang dùng được? |
|---|---|---|---|
| `offer_id` | `offer_` + 16 ký tự, mọi nguồn cùng dạng, không lộ nguồn | có | có, làm URL |
| Giá, diện tích, loại hình, PN, WC, số tầng, mặt tiền | có | có | có |
| `street_raw` | S06 61.249/62.387 · S03 0/3.708 | có | có, thiếu thì bỏ |
| `block_raw`, `floor_raw` | S06 546, 747 · S03 1.968, 0 | có | có, qua cùng bộ che tên nguồn |
| Toạ độ, số nhà, số căn | có | **không** | không, nên không có bản đồ |
| `listing_url`, bài gốc, ảnh | có | không ở `/vn/**` | không (tầng A, chỉ `/ops/**`, hàng AC1) |

Hệ quả phải nói thẳng: **không có bài gốc và chưa có ảnh, trang chỉ nhiều hơn thẻ ở block, tầng, tin tương tự và đường dẫn chia sẻ.** Vì vậy phạm vi đề xuất giữ khối
tin cùng tiêu chí; bỏ khối này thì trang gần như chép lại thẻ.

**Vì sao chưa so giá với phường.** `market_asset_stats` có lên cloud (205 phường bán, 167 phường thuê) nhưng khoá là phường × kind, không có loại hình, và không qua `VISIBLE`
(`pipeline/sql/500_asset_stats.sql`). Tin bán 30 ngày gần nhất gồm nhà 19.799, căn hộ 7.351, đất 4.440, nên một căn hộ sẽ bị so với trung vị phần lớn là nhà. Số như vậy đọc nhầm, nên
không đưa lên. Làm đúng cần thêm loại hình vào bảng, tức migration hạng T3 và một lượt sync (Hỏi-5).

## Phương án

**Đường dẫn (Hỏi-3):** đề xuất `/listing/<offer_id>`, dùng chung route `/listing/[id]` với listing thuê ngắn hạn; id `offer_…` đi nhánh tin rao, id khác giữ nguyên nhánh cũ. Lý do:
`docs/architecture/portals.md` đã xếp `/listing/**` vào Invest công khai và quy ước số ít cho trang chi tiết, `CONTEXT.md` coi «listing» là cha của mọi tin, nên không thêm slug. Lối còn lại:
`/vn/hanoi/listings/sale/<id>` nhìn rõ khu vực hơn, nhưng thêm đoạn URL, đổi URL khi tin đổi khu vực và khó cho tin cấp thị trường. Đường dẫn gửi ra ngoài rồi thì đổi phải kèm redirect, nên đây là câu cho Mạnh.

**Hiện:**

1. Đầu trang: lối về (Việt Nam › thị trường › Bán hoặc Cho thuê › Tin), tiêu đề từ thông số («Căn hộ 75 m² · 3 PN»), tuổi tin.
2. Giá, đơn giá, nhãn tin (`OfferLabelHelp`).
3. Người đăng và liên hệ: tên hoặc «Tài khoản nhiều tên», «Chưa có tên»; `OfferContact` nguyên trạng, kèm nhãn số. Màn hẹp ngay dưới giá; màn rộng ở cột phụ.
4. Thông số: loại hình, diện tích, PN, WC, số tầng, mặt tiền, block, tầng. Trường thiếu thì bỏ, không in «chưa có».
5. Vị trí: phường (liên kết), đường. Tin cấp thị trường chỉ có tên thị trường.
6. Tin cùng tiêu chí: cùng phường, cùng loại tin và loại hình, diện tích ±25%, tối đa 6 thẻ `OfferCard`.

**Không hiện:** tên hay mã nguồn, `listing_url`, bài gốc, `post_ids`, `seller_ref`, `field_provenance`, số nhà, số căn, toạ độ, số điện thoại trong HTML.

**Mở thẻ (Hỏi-2):** toàn thân thẻ bấm được, trừ ba thứ có việc riêng: liên kết phường, nhãn, Xem số.

**Đọc dữ liệu:** thêm `getPublicOffer(id)` và `getOfferComps` vào `lib/offers-public.ts`, dùng chung `VISIBLE`, chung bộ che tên, chỉ đọc cột có trong `CLOUD_ALLOW`. Đoạn dựng `PublicOffer` đang viết
liền trong `getPublicOffers` tách thành một hàm để hai đường không lệch. Không thêm route API, nên `api-surface.ts` không đổi.

**Tin không hiện:** mọi ca cùng một 404, như route liên hệ: id lạ, S02, S08, quá 30 ngày, giá phi lý. Với id `offer_…`, trang 404 ghi chung một câu «Tin này không còn hiện» kèm nút về
danh sách, để đường dẫn cũ đã gửi đi không thành trang lỗi trơn. Không tách câu riêng cho «đã hết hạn», vì tách là cho người ngoài dò được tin ẩn.

**Trang ra khi chưa có ảnh, bản đồ (Hỏi-4):** đề xuất không đợi. Ảnh do hàng AC1 ghép vào sau; bản đồ cần đưa toạ độ lên cloud, là việc `sync-cloud` hạng T3, và lộ vị trí căn nên phải quyết riêng.

**Giao diện:** lời giao cấm code trước Cổng Phạm vi nên chưa có bản bấm được; cổng này duyệt bằng hình `figures/luong-trang-tin` và bảng trạng thái, `design-pass` chạy đầu S3 trên route thật.

**Máy tìm kiếm (Hỏi-1):** đề xuất `noindex` lúc đầu. Trang có tên người đăng; đang có trang riêng cho từng tin sẽ làm tên người đó dễ tìm hơn hẳn trang danh sách.
Mở lại chỉ cần gỡ một dòng, còn đã vào chỉ mục thì rút rất chậm.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: Bán hoặc Cho thuê → bấm thẻ → trang tin → Xem số → gọi (điểm ra: `tel:`). Đường dẫn gửi cho người khác vào thẳng trang tin.
- Biên: tin cấp thị trường không có tin cùng tiêu chí; tin không có số thì «Chưa có số».
- Lỗi & quay lại: tin không hiện nữa → 404 có lối về danh sách; khối tin cùng tiêu chí lỗi → báo trong vùng kèm Thử lại, phần còn lại vẫn đọc được.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Trang tin | Quyết có gọi người đăng tin này không | thẻ tin, đường dẫn chia sẻ / `tel:`, trang phường, tin khác |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-tin-du | Trang tin | Đủ các khối | Xem số |
| ST-tin-thieu-truong | Trang tin | Bỏ dòng thiếu, không chữ «chưa có» | Xem số |
| ST-tin-cap-thi-truong | Trang tin | Tên thị trường, không liên kết phường, không khối tin cùng tiêu chí | Về danh sách |
| ST-tin-chua-xac-minh | Trang tin | Nhãn tin có lời giải thích | Đọc giải thích |
| ST-tin-khong-hien | Trang tin | 404 chung, câu «Tin này không còn hiện», nút về danh sách | Về danh sách |
| ST-lien-he-chua-co-so | Trang tin | «Chưa có số», không nhãn | Về danh sách |
| ST-lien-he-truc-tiep | Trang tin | Nút Xem số, không nhãn | Bấm lấy số |
| ST-lien-he-truc-tiep-da-lay | Trang tin | Số thành liên kết gọi, không nhãn | Gọi |
| ST-lien-he-ghep | Trang tin | Nhãn số kèm nút Xem số | Đọc giải thích, bấm lấy số |
| ST-lien-he-ghep-da-lay | Trang tin | Nhãn số kèm số thành liên kết gọi | Gọi |
| ST-lien-he-ghep-loi | Trang tin | Nhãn số kèm «Thử lại» | Bấm lại |
| ST-cung-tieu-chi-loading | Trang tin | `Skeleton` đúng bố cục | Chờ |
| ST-cung-tieu-chi-trong | Trang tin | `Empty`, nút «Xem tin ở phường này» | Về danh sách đã lọc |
| ST-cung-tieu-chi-loi | Trang tin | `RegionError` kèm Thử lại | Bấm lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Toàn thân thẻ là đích bấm; Tab vẫn đi qua từng phần tử có việc riêng, Enter trên liên kết chính mở trang.
- Màn hẹp: một cột, khối liên hệ lên ngay dưới giá. Rộng: hai cột, liên hệ ở cột phụ.
- Về lại danh sách giữ bộ lọc bằng nút Back của trình duyệt, không thêm cơ chế riêng.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `PageHeader`, `RegionError`, `reui/frame`, `reui/badge`, `ui/skeleton`, `ui/empty` | dùng | Có sẵn, đúng vai |
| `OfferContact`, `OfferLabelHelp`, `OfferCard` | dùng | Giữ cách Xem số và nhãn, không viết lại |
| Hộp thông tin theo `@reui/product-detail-5` | ghép | Cùng block với trang listing thuê ngắn hạn, bỏ gallery |
| Trang tin rao | tạo | `offer-body.tsx`, dưới 200 dòng |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: luồng hiển nhiên; đối chiếu Zillow và Rightmove: giá và thông số trước, liên hệ luôn thấy, tin tương tự cuối trang. Khác họ ở chỗ không có ảnh, bản đồ, mô tả.
<!-- UX-SPEC-TEMPLATE>>> -->

## Quét độ phủ

- **Ngữ cảnh:** chân sản phẩm `CONTEXT.md`, `docs/product/CONTEXT-PRODUCT.md`, `lib/offers-public.ts`. Chân ngành: trang tin của Zillow, Rightmove `[NGÀNH: Zillow, Rightmove]`.
- **Trục A, lối vào:** thẻ Bán | thẻ Cho thuê | đường dẫn trực tiếp | tin cùng tiêu chí. Thước: `routes.md`.
- **Trục B, tin hiện được:** bán, thuê dài hạn × S03, S05, S06. Thước: `VISIBLE`, `KIND`.
- **Trục C, độ đủ:** đủ | thiếu trường | cấp thị trường | tên bị che hoặc nhiều tên | không hiện. Thước: bảng số đo trên, `offerSpecs`.
- **Trục D, liên hệ:** sáu trạng thái ô liên hệ. Thước: bảng trên, gốc từ `so-ghep-s06-nhan-danh-ba`.
- **Lớp áp mọi ô:** không lộ tầng A; 375 và rộng, sáng và tối.
- **Core:** xem AC trong hợp đồng.
- **Later:** so giá với phường theo loại hình (Hỏi-5) · ảnh (hàng AC1) · lưu tin, chia sẻ `[NGÀNH: Zillow]` · tin khác của người đăng · lịch sử giá `[NGÀNH: Zillow]` · máy tính vay · báo cáo tin sai · bản đồ (cần toạ độ lên cloud) · mô tả do máy viết lại từ bài gốc · gộp `/listing` với ghép căn (bảng `properties`).
- **Never:** tên nguồn, liên kết bài gốc, số trong HTML: luật 6.
