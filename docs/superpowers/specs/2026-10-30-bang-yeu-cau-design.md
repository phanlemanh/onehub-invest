# bang-yeu-cau — bảng Yêu cầu bên mua (cần mua · cần thuê), đối xứng listing

Hồ sơ: `_acceptance/bang-yeu-cau/` · hạng T3 (migration) · dãy P1, sau PL5 (`meta-kev-thanh-phat-bieu`). Cổng Đáng: build,
Mạnh 30/10 «nên mở luôn bảng Inquiry». Kéo mục chờ SH12 của lộ trình lên; hàng sau `do-cau-tu-yeu-cau` đọc từ bảng này.

## Vấn đề

Bài «khách tìm thuê 2pn…», «cần mua nhà…» chỉ nằm ở raw + stg và — sau PL5 — một phát biểu `listing_intent = inquiry`
theo bài. Không bảng nào giữ tiêu chí của nhu cầu (khu vực, loại hình, số PN, ngân sách) để đếm cầu hay ghép với listing.
CONTEXT «Yêu cầu»: bên mua, đối xứng listing; `kind` cùng bộ mã, `property_type` cùng sổ, giá là khoảng ngân sách, gắn
tiêu chí chứ không gắn căn.

## RESO

DD 2.1 không có bản ghi ngang hàng `Property` cho nhu cầu bên mua; gần nhất là `SavedSearch` (tiêu chí người mua), nhưng
tiêu chí của nó là một chuỗi truy vấn (`SearchQuery`), không có trường cấu trúc. Bảng dùng các trường khoá/hệ thống của
`SavedSearch` và dùng lại trường RESO phía bán cho tiêu chí (local extension, khai ở sổ `pipeline/mappings.yaml`, khối
`inquiries`):

| Cột | RESO | Ghi chú |
|---|---|---|
| `inquiry_id` | SavedSearchKey | `inq_` + băm (nguồn · người gửi · chữ chuẩn hoá) — ổn định qua lượt nạp |
| `source` | OriginatingSystemName | mã S0x (ADR-0007) |
| `originating_system_key` | OriginatingSystemKey | post_id của bài neo (bài sớm nhất của nhóm) |
| `post_ids` | — | mọi bài cùng nhu cầu (đăng lại) |
| `kind` | PropertyType (phía bán, dùng lại) | trục `kind` của sổ: `sale` = mua · `rent_lt` = thuê; trống khi chưa rõ |
| `property_type` | PropertySubType (dùng lại) | trục `property_type` của sổ; trống khi chưa rõ |
| `bedrooms` | BedroomsTotal (dùng lại) | số PN bài nêu |
| `area_m2` | LivingArea (dùng lại) | diện tích bài nêu |
| `budget_min_vnd` / `budget_max_vnd` | ListPrice (dùng lại, khoảng) | khoảng ngân sách; CHECK min ≤ max |
| `area_id` / `market_id` | — | phường khớp được (OSM) / thị trường (cha của phường, hoặc thị trường duy nhất nhóm khai) |
| `first_seen` / `last_seen` | OriginalEntryTimestamp / ModificationTimestamp | theo `posted_at` của các bài |
| `intent_evidence` | — | phát biểu ý định đã quyết: `{assertion_id, method, tier, p}` |
| `retired_at` / `retired_reason` | — | nghỉ thay vì xoá (khuôn PL14) |

Bảng `inquiry_records` + view sống `inquiries` (`retired_at IS NULL`), cùng khuôn `sale_offer_records`/`sale_offers`.
Chỉ DB local: không vào `FILL`/`CLOUD_ALLOW` của `sync-cloud.mjs`, không trang nào đọc ở vòng này. Không cột danh tính
người tìm (tên, SĐT, tài khoản): người mua đăng nhu cầu chưa có chốt tầng như người bán (ADR-0007 sửa đổi chỉ nói người
bán); `sender_id` chỉ đi vào băm khoá, không lưu.

Migration **058** (xin số liên làn) — chỉ DB local. CHECK `kind`/`property_type` đúng bộ mã sổ (`vocab --check-db` đọc),
`ref_field_lookup` gắn hai cột vào trục; `dq-enum-vocab.mjs` thêm hai mục kiểm (điều kiện thứ sáu của ADR-0011 Qđ 3).

## Ai là Yêu cầu

Bài S03 thật (đã gạt bài thử, `lib/test-posts.mjs`) mà phát biểu `listing_intent` sống **lớp cao nhất** (fact › observed ›
inferred; trong lớp theo `assertion_method_rank` của 045, rồi `observed_at` mới nhất) có giá trị `inquiry`. Hôm nay chỉ
có phát biểu `kev` (PL5); người (`hitl`, lớp fact) ghi «tin rao» thì thắng Kev. Không ngưỡng xác suất (PL21 khi đã đo).
Không cần bộ lọc gate riêng: bài Kev gate down có mọi điểm trống nên PL5 không ghi phát biểu nào cho nó — không phát biểu
thì không thành Yêu cầu. Mỗi lượt transform xét TOÀN BỘ bài thật của stg (không chỉ lô mới), nên Yêu cầu ngoài lô không
bị nghỉ nhầm.

## Tiêu chí (hàm thuần `pipeline/lib/yeu-cau.mjs`)

- `kind`: phát biểu `kind` sống lớp cao nhất của bài (Kev: `sale`/`rent_lt`); vắng → chữ theo **Hỏi-3** («cần mua / tìm
  mua» → `sale`, «cần thuê / tìm thuê» → `rent_lt`, kể cả thuê theo ngày vì sổ chưa có `rent_st`); vẫn vắng → trống.
- `property_type`: phát biểu `property_type` sống lớp cao nhất của bài (hôm nay bài Yêu cầu không có — enrich chỉ chạy trên
  tin rao; người gắn nhãn sau này thì thắng); vắng → bảng ánh xạ chữ theo **Hỏi-3** (chung cư · căn hộ → apartment; nhà
  riêng · nhà phố · nhà mặt phố · nhà ngõ → house; đất · lô đất · đất nền → land; phòng trọ · phòng khép kín → room; văn
  phòng · mặt bằng · shophouse → commercial; «nhà» đứng một mình → trống); không khớp → trống (không ghi `unknown`).
- `bedrooms`, `area_m2`: bộ đọc tin của transform-zalo (`parsePost`).
- Ngân sách: khoảng «a–b tỷ/triệu», «từ a đến b» → min/max; «dưới · tối đa · không quá · tầm dưới X» → max; «trên · từ ·
  tối thiểu X» → min; các dạng không kèm chữ chỉ chiều («tầm X», «khoảng X», «tài chính X», «ngân sách X», «X» trơn) →
  **Hỏi-1** (khuyến nghị: trần — max = X, min trống). Đơn vị tỷ · triệu · tr · củ; số đọc bằng luật giá VN của
  transform-zalo (`soTy`, `parseVnNumber`); giá trị ngoài khoảng giá phi lý của tin rao (`lyDoGiaPhiLy`: thuê từ 1 tỷ, bán
  trên 100 tỷ) thì bỏ.
- Khu vực: `matchPhuongThiTruong` với thị trường của nhóm (N1) → `area_id`, `market_id` = cha của phường; không khớp phường
  mà nhóm khai đúng một thị trường → `market_id` đó.

## Đăng lại (Hỏi-2)

Khuyến nghị: gom bài cùng nguồn · cùng người gửi (`sender_id`, vắng thì SĐT trong bài) · cùng chữ chuẩn hoá (`normText`:
NFC, chữ thường, mọi ký tự không phải chữ/số thành một khoảng trắng, cắt hai đầu) thành MỘT Yêu cầu, `post_ids` cộng dồn,
`first_seen`/`last_seen` theo bài — đối xứng cách transform gom tin rao đăng lại. Bài không có người gửi lẫn SĐT không gom
(khoá gồm `post_id`). `post_ids` mỗi lượt dựng lại từ mọi bài hiện đủ điều kiện của nhóm: bài mới đến thì cộng, bài đổi
ý thì rời — upsert ghi tập đầy đủ, không cộng mù.
Lối khác: mỗi bài một Yêu cầu — đơn giản hơn nhưng hàng đo cầu sau đếm một người đăng 7 ngày thành 7 nhu cầu.

## Ghi (bước của transform-zalo, sau bước Kev)

`ghiYeuCau(client, posts, ctx)`: dựng Yêu cầu từ bài đủ điều kiện, upsert theo `inquiry_id` (gỡ `retired_at`), nghỉ Yêu
cầu sống không còn bài nào đủ điều kiện (`retired_reason = 'het-phat-bieu'`). Chạy lại thêm 0, nghỉ 0. Không `DELETE`
(răng `lib/scan-delete.mjs` mở rộng sang `inquiry_records`). Luồng offer không đổi. 058 chưa áp (thiếu bảng) → một dòng
«chưa áp 058», bỏ bước.

## Đo

- Ma trận thuần `scripts/yeu-cau.test.mjs` (tiêu chí, gom đăng lại, chọn lớp cao nhất).
- Ca DB thử `scripts/yeu-cau.itest.mjs` (ROLLBACK, nạp 045 + 057 + 058): ghi, chạy lại, đăng lại, nghỉ/sống lại, người thắng
  Kev, chưa áp 058, offer không đổi.
- Thước `scripts/do-yeu-cau.mjs` trên bản chép dữ liệu thật (DB thử) với điểm Kev tổng hợp: quan hệ bài ↔ Yêu cầu (mỗi bài
  inquiry trong đúng một `post_ids` sống; mỗi Yêu cầu một bộ nguồn · người · chữ, không hai Yêu cầu chung bộ); với từng
  tiêu chí, số bài có dấu hiệu chữ và tỉ lệ đọc ra (chỉ in); giây thêm; bảng không vào sync cloud.

## Không làm

- Ghép Yêu cầu với listing (hàng sau); trang `/ops` (hàng `do-cau-tu-yeu-cau`); đưa bảng lên cloud.
- Danh tính người tìm; gom hai bài khác chữ cùng một nhu cầu; Yêu cầu từ S05/S06; `rent_st`.
- Ngưỡng xác suất Kev cho Yêu cầu (PL21).
