---
schema_version: 1
feature: Nhà đầu tư tìm được tin rao kèm người bán và SĐT trên cổng Invest — tên, SĐT lên cloud, API Listing theo loại, trang Bán và Cho thuê với thẻ chung
slug: tin-rao-tren-invest
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, cli, ui]
status: verified
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-02-tin-rao-tren-invest-design.md
---

# Acceptance Contract: tin-rao-tren-invest

## Context

Mạnh chốt 02/11 (ROADMAP §3 mục 25): tin rao công khai; tên và SĐT người bán lên cloud và cổng Invest vì giúp nhà đầu tư tìm căn. Hiện cổng chỉ có listing thuê ngắn
hạn, API tin rao đóng, tên và SĐT ở lại máy thu. Vòng này mở trọn đường cho các cột đang có; làn thu giao thêm SĐT thì cổng tự có, không sửa lại. Đo 02/11: 40.573 tin
hiện được, chỉ 3 tin có số.

Source input: prompt của Mạnh 02/11 · `docs/research/kiem-tin-dau-ra-toan-thi-truong-0211.md` §10.3, §10.5

## Criteria

- AC-1: Given danh sách cột lên máy chủ, When đọc `selectList` và `piiColumnLeaks` trên ma trận viết trước, Then `sale_offers.seller_name`, `sale_offers.seller_phone`, `sale_offers.stories`, `sale_offers.frontage_length` được gửi và qua cổng cột; `sellers.name`, `properties.seller_name`, `sale_offers.listing_url`, `properties.photos` và cột mới chưa khai vẫn ở lại máy.
- AC-2: Given bảng local có tên hoặc số người bán chứa định danh nguồn, When sync đọc bằng câu đọc thật, Then đúng giá trị đó thành NULL, dòng vẫn gửi, có một cảnh báo chỉ đếm không in giá trị; bộ soát tên nguồn vẫn dừng lượt khi định danh nguồn nằm ở cột khác.
- AC-3: Given tệp `docs/ops/cloud-schema-catchup-2026-11-02-tin-rao.sql`, When đọc và chạy trên lược đồ tạm đứng vai cloud, Then khối ĐO TRƯỚC báo thiếu bốn cột, khối ÁP chỉ gồm `ADD COLUMN IF NOT EXISTS` trên bốn cột ấy, chạy hai lần không lỗi, không câu nào xoá hay sửa dữ liệu; đầu tệp ghi thứ tự bật tường lửa → gộp → kéo về → áp → sync, đúng thứ tự dòng, và vì sao; khi cloud chưa có bốn cột, trang `/listings/sale` ra vùng lỗi có Thử lại còn `/listings/rent?term=short` vẫn chạy, bản sync mới cảnh báo lệch schema, không gửi bốn cột đó và không dừng.
- AC-4: Given người gọi không đăng nhập, When gọi `GET /api/v1/listings?kind=sale` hoặc `kind=rent_lt` với ma trận bộ lọc viết trước, Then trả 200 đúng tập tin theo từng bộ lọc, đúng thứ tự theo bốn cách sắp `newest`, `price-asc`, `price-desc`, `perm2-asc`, không lặp hay mất tin giữa các trang, `limit` không quá 50, `offset` không quá 960; mỗi dòng đúng các trường `offerId, kind, propertyType, priceVnd, areaM2, pricePerm2, bedrooms, bathrooms, stories, frontageLength, ward, street, sellerName, sellerManyNames, hasPhone, updatedAt, firstSeenDays`, số tầng trên 30 và mặt tiền trên 100 m trả null, không có SĐT, mã nguồn, `seller_ref`, liên kết gốc, `post_ids`; tin S02, S08, tin thiếu một trong năm trường lõi, tin cũ quá 30 ngày, tin giá phi lý (bán dưới 500 triệu; thuê dưới 500 nghìn hoặc từ 500 triệu một tháng) không bao giờ ra; người gọi có phiên ops nhận y hệt khách; không truyền `kind` hoặc `kind=rent_st` trả đúng từng dòng như bản trước vòng, kể cả trần `limit` 200 và mã thị trường cũ; `kind` lạ trả 400; đối chiếu chỉ đọc trên DB máy thu: `total` bằng đếm độc lập, 0 giá trị trả về chứa định danh nguồn, trang đầu mọi cách sắp dưới 1 giây; và trên lược đồ vai cloud dựng từ `CLOUD_ALLOW` cộng tệp catch-up, nạp qua đường đọc và ghi thật của sync, API trả đúng tin và số.
- AC-5: Given một tin, When gọi `GET /api/v1/listings/<id>/contact`, Then tin đang hiện và có số trả đúng số khớp `^\+84\d{9}$` kèm `Cache-Control: no-store`; tin không có số, tin ẩn, mã thuê ngắn hạn, mã không tồn tại trả cùng một 404 cùng thân.
- AC-6: Given sổ bề mặt, When chạy `check-api-surface` và `check-mcp-tools`, Then `v1/listings` và `v1/listings/[id]/contact` khai `public` với khoá `publicOffers` và qua; route public khác đọc `sale_offers` vẫn đỏ đúng thông điệp cũ; `v1/offers`, `v1/deals` vẫn `ops`; công cụ MCP mới `oneinvest_get_listings` khai `public` và mô tả ghi chưa hứa ổn định, `oneinvest_get_offers` vẫn `ops`; smoke bề mặt có ca khách gọi `v1/listings?kind=sale` nhận 200 và ca khách gọi `v1/offers` vẫn 401.
- AC-7 (cross-layer): Given một `seller_ref` có từ 3 tên khác nhau, When đọc danh sách, Then `sellerName` là null, `sellerManyNames` đúng ở mọi tin của tài khoản đó kể cả khi các tin nằm ở nhiều trang; thẻ tin hiện «Tài khoản nhiều tên»; tài khoản 2 tên giữ nguyên tên; `seller_ref` rỗng không gộp với nhau; lọc theo phường không làm đổi kết quả đếm tên.
- AC-8 (cross-layer): Given người dùng ở cổng Invest, When thao tác, Then header có đúng năm mục Thị trường, Bán, Cho thuê, Lợi suất, So sánh; dưới `lg` Bán, Cho thuê vẫn ngoài menu và không tràn ở 320; Bán, Cho thuê giữ thị trường đang xem, trang không gắn thị trường dẫn tới Hà Nội; mục đang chọn đúng theo đường dẫn, `/listing/<id>` sáng Cho thuê. `/vn/<thị trường>/listings/sale` là tin bán, `/listings/rent` là thuê dài hạn, `/listings/rent?term=short` là thuê ngắn hạn; `/listings` kể cả `?kind=` chuyển 308 đúng đích, giữ tham số khác; mã thị trường cũ chuyển 308 giữ đoạn `sale`, `rent`. Chỉ Cho thuê có ô Dài hạn | Ngắn hạn, đứng đầu hàng lọc, còn hiện lúc tải và lúc thị trường chưa có tin; đổi thời hạn bỏ mọi bộ lọc. Ở Bán, thuê dài hạn: đổi phường, loại hình, giá, phòng ngủ, diện tích, «Chỉ tin có số», sắp xếp, trang đều đổi URL và kết quả từ máy chủ, tải lại giữ nguyên, đổi lọc về trang đầu, quá 984 tin có dòng nhắc thu hẹp; giá nhập theo tỷ ở Bán, theo triệu ở thuê dài hạn, nhập được số lẻ; dưới `lg` lọc bằng ngăn Bộ lọc, ở `lg` trở lên bằng thanh chip; phân trang là link thật. Thuê ngắn hạn giữ bản đồ, lọc tại trình duyệt và trang chi tiết như cũ; link từ Insight và trang chi tiết thuê ngắn hạn mở đúng `/listings/rent?term=short`; cả ba loại dựng thẻ qua `ListingCardFrame`, đúng thứ tự ô Ảnh, Giá, Thông số, Vị trí, hàng cuối; giá/m² cùng hàng giá, thông số là một dòng chữ theo loại hình (căn hộ: phòng ngủ, WC; nhà riêng: tầng, phòng ngủ; đất: mặt tiền; trường thiếu thì bỏ), «Thấy từ …» tính theo lần đầu hệ thống thấy tin nằm cuối hàng vị trí, không có ký hiệu ₫ trên thẻ; màn 375 và 320 không cuộn ngang trang.
- AC-9 (cross-layer): Given thẻ tin rao, When xem và bấm liên hệ, Then HTML trang không chứa SĐT trước khi bấm; tin chưa có số hiện chữ mờ «Chưa có số», không phải badge, tin có số bấm «Xem số» một lần thành link `tel:`, đang lấy thì nút khoá; tên trống hiện «Chưa có tên»; lỗi mạng thành «Thử lại», 404 thành «Chưa có số»; thẻ không ảnh hoặc ảnh hỏng không có ô ảnh và không ô trống; đủ trạng thái lọc ra 0 có «Xoá bộ lọc», thị trường chưa có tin có đường sang Insight, skeleton, lỗi vùng có Thử lại; sáng tối đều đọc được.
- AC-10 (judgment): Given các tài liệu luật và từ vựng, When đọc sau vòng này, Then ADR-0007, `AGENTS.md` luật 6, `.claude/rules/pii-spl.md`, `CONTEXT.md`, `docs/architecture/portals.md`, `.claude/skills/onehub-ui/routes.md`, `.claude/skills/onehub-ui/catalog.md`, `docs/architecture/invest-portal-ia.md`, ROADMAP nói đúng hành vi mới và không câu nào còn nói tên, SĐT người bán ở lại máy; tên nguồn thật vẫn tầng A, S02, S08 vẫn không hiển thị; khuôn «Duyệt Listing» có trong `routes.md`, `catalog.md`; `invest-portal-ia.md` ghi năm mục header; `CONTEXT.md` có nhãn Loại tin, Cho thuê, Thuê dài hạn, Thuê ngắn hạn và slug `sale`, `rent`.

## Coverage

Bản quét: `coverage-scan.md`.

- Trục **lớp** (sync · cloud DDL · API danh sách · API số · sổ bề mặt · giao diện · tài liệu): AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10.
- Trục **loại tin** (đủ trường có số · đủ trường chưa số · thiếu trường · cũ · S02/S08 · tài khoản nhiều tên): AC-4, AC-5, AC-7, AC-9.
- Trục **người gọi** (khách · ops · cào hàng loạt): AC-4, AC-5; cào hàng loạt chỉ chặn một phần, xem Notes.
- Trục **trạng thái màn** (bảng đặc tả UX): AC-8, AC-9.
- Thước CE: số đo DB máy thu 02/11 trong design doc; `[NGÀNH: Kleinanzeigen — nút hiện số do người bán chọn; Carsales — phải xác minh SMS mới thấy số]`: sàn cùng loại thường có thêm một bước trước khi lộ số, vòng này chỉ có một lần bấm.
- `[GIẢ ĐỊNH]` Khách không đăng nhập vẫn lấy được số. Ý này là câu hỏi trên thẻ.
- `[NGÀNH: Zillow web — Buy, Rent trên header, For sale, Price, Beds & baths, Home type luôn hiện trên thanh lọc]`: lý do đưa dịch vụ lên header.

## Đường đo

Không có `opportunity.md`: Mạnh giao thẳng, nên không có ngưỡng Cổng Giá trị. Sau ra mắt theo dõi bảng phủ SĐT theo kênh ở báo cáo §10.1.

## Out of scope

- Thu SĐT ở mọi kênh, đổi DATA-CONTRACT: làn ZCode và Mạnh.
- Chốt nghĩa «sống», chuyển tiêu đề/đường/dự án, gộp tin đăng lại, số S03 theo người gửi, kiểm phủ theo nguồn: vòng riêng của làn Claude.
- Trang chi tiết tin rao, mô tả, bản đồ tin rao, tìm theo chữ, «các tin khác của người này».
- Ảnh tin rao: hàng `anh-tin-cong-khai` chạy song song, kèm sửa ADR-0007 và AGENTS luật 6 cho ảnh đầu của tin. Vòng này chỉ chừa ô ảnh.
- Gộp `sale_offers`, `listings` thành một bảng: hàng `gop-bang-listing`, ngay sau ra mắt.
- `sellers.name`, `properties.seller_name` lên cloud; API `data-api/`; `/api/v1/deals`; đổi `/api/v1/offers`.
- Sửa gốc tin giá phi lý và tin dưới 15 m²: vòng này chỉ ẩn theo ngưỡng giá (câu hỏi trên thẻ), diện tích không lọc vì phòng nhỏ có thật.
- Áp tệp catch-up, chạy `supabase db push`, bật tường lửa Vercel trong vòng: việc của Mạnh sau khi ký.

## Notes

- Ra khỏi kho (Mạnh), đúng thứ tự: bật giới hạn tần suất Vercel Firewall cho `/api/v1/listings/*/contact` và thử vượt ngưỡng nhận 429, trước khi gộp; rồi gộp, kéo về; rồi chạy catch-up lên Supabase ngay, cửa sổ Bán và Thuê dài hạn báo lỗi chỉ còn vài phút; rồi kích sync. Tài liệu Vercel ghi rate limiting có ở mọi gói, Hobby một luật mỗi dự án; một báo cáo cộng đồng nói Hobby đòi nâng gói khi chọn 429, và gói của tài khoản chưa xác định. Không nhận được 429 thì dừng ở bước đầu, chưa gộp, chọn lại cách chặn cào.
- Vai công khai của Supabase không đọc được bốn cột mới: `gateAnon` của sync dừng lượt nếu anon đọc được cloud, chạy trước khi gửi dòng nào.
- Không đo được trước khi áp: tốc độ trên cloud. Sau khi áp mở trang đầu của Hà Nội và TP.HCM; catch-up không thêm index, chậm thì mở lượt riêng.
- `retired_at`, `superseded_by` chưa lên cloud và 0 tin đang hiện mang hai cột này. Vòng gộp tin đăng lại phải thêm điều kiện ẩn.
- Giới hạn đã biết: sau khi hàng SV1 vào, giá che số của S03 lưu thành số sàn, sai số tới khoảng 5%, và dữ liệu chưa có dấu phân biệt với giá chính xác (N1 đo: luật này cho giá 2.435/51.442 bài). Cổng hiện các giá đó như giá thường; chưa có dấu thì chưa ghi được «khoảng». Kiểm trên máy chủ sau lượt nạp S03 đầu tiên của SV1.
- Tin S03 hiện đang «Tài khoản nhiều tên» do `seller_ref` còn là hằng tới lượt nạp lại sau PR #265; tự hết khi nạp lại.
- Đường nền chạy trên cây đã có bản bấm được, nên hai chân đỏ của nó (`app_ui`, `portal_static`) là do route mới chưa khai sổ, không phải đỏ có sẵn: ba ca `TA-AC-3`, `QV-AC-9`, `VT-AC-8` đều gọi tên đúng các route đó. Bản bấm nay còn một route mới là `v1/listings/[id]/contact`, và `v1/listings` đọc thêm `sale_offers`. S3 khai sổ và bảng kiểm kê thì xanh.
- Một chỗ khác giữa ba loại còn lại sau ra mắt: bản đồ, lọc trên URL và trang chi tiết. Ghi ở thiết kế mục 9 để vòng sau không tưởng là đã đồng nhất.
- Ảnh bằng chứng commit lên kho công khai phải che cột tên và số.
- Đổi `/listings` thành chuyển hướng làm phải sửa ba ca test của hồ sơ đã ký: `chuyen-huong-ma-thi-truong` (`PG.listings` trỏ `sale/page.tsx`), `LB-AC` thứ tự trường lọc, `LD-AC-8` link. S4 phải ghim lại hai hồ sơ đó.
- Từ giờ link cũ `/vn/<tt>/listings` mở Bán thay vì thuê ngắn hạn như trên production; ai cần thuê ngắn hạn phải đổi link.
