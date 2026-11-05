---
schema_version: 1
feature: Nhà đầu tư mở được một tin bán, tin thuê dài hạn của mọi nguồn trên cổng Invest để xem đủ thông số và liên hệ người đăng
slug: trang-chi-tiet-tin
owner: phanlemanh@gmail.com
risk_tier: T2      # route đọc trên cổng công khai; không chạm t3_paths, không đổi dữ liệu hay đường lên cloud
surfaces: [web]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-04
design_doc: docs/superpowers/specs/2026-11-04-trang-chi-tiet-tin-design.md
---

# Acceptance Contract: trang-chi-tiet-tin

## Context

Vấp 1 của phiên lái thử `s03-len-cong`, Mạnh tách làm riêng ngày 04/11/2026. Làm sau mốc 05/11, gộp sau #305. Không có bài gốc và chưa có ảnh, nên trang chỉ nhiều hơn thẻ
ở block, tầng, tin tương tự và đường dẫn chia sẻ.

## Hỏi tại Cổng Phạm vi

Tiêu chí dưới viết theo lối máy khuyên; Mạnh chọn khác thì sửa tiêu chí rồi mới vào S2.

- Hỏi-1: Trang tin có lên máy tìm kiếm? Khuyên chưa: `noindex` (AC-8).
- Hỏi-2: Bấm chỗ nào trên thẻ thì mở tin? Khuyên toàn thân thẻ trừ ba phần tử có việc riêng (AC-1).
- Hỏi-3: Đường dẫn? Khuyên `/listing/<offer_id>`.
- Hỏi-4: Có đợi ảnh, bản đồ không? Khuyên không đợi.
- Hỏi-5: So giá với phường? Khuyên dời hàng riêng, vì `market_asset_stats` chưa có loại hình. Tin cùng tiêu chí vẫn làm (AC-7).

## Acceptance criteria

- AC-1: Given thẻ trên trang Bán, Cho thuê dài hạn và trong khối tin cùng tiêu chí, When bấm thân, giá, tên người đăng, địa chỉ của thẻ, Then URL thành `/listing/<offer_id>`; bấm liên kết phường thì tới trang phường; bấm nhãn, Xem số thì URL không đổi.
- AC-2 (cross-layer): Given ma trận loại hình (căn hộ, nhà, đất) × kind × đủ hoặc thiếu trường ghi vào DB thử, When mở trang tin, Then hiện đúng giá, đơn giá, nhãn tin, thông số gồm block, tầng, vị trí, tuổi tin, người đăng; trường thiếu thì bỏ dòng; tin cấp thị trường có tên thị trường, không liên kết phường; mọi cột trang đọc đều có trong `CLOUD_ALLOW`.
- AC-3 (cross-layer): Given tin có số, When tải trang qua máy chủ Next và chưa bấm, Then phản hồi HTTP, kể cả dữ liệu nhúng `__next_f`, không chứa số; bấm Xem số gọi đúng `/api/v1/listings/<id>/contact`; mọi trạng thái `ST-lien-he-*` và nhãn số giống trên thẻ.
- AC-4 (cross-layer): Given tin của S03, S05, S06 mang giá trị đánh dấu ở mọi cột cấm (`source`, `listing_url`, `post_ids`, `seller_ref`, `field_provenance`, `street_number`, `unit_number`, toạ độ) và tên nguồn thật giả trong tên người đăng, block, tầng, đường, When tải trang chưa đăng nhập qua máy chủ Next, Then phản hồi HTTP gồm thẻ head, meta description, dữ liệu nhúng, cả thẻ trong khối tin cùng tiêu chí, không có giá trị đánh dấu nào; bản sao lộ một cột, kể cả chỉ truyền qua props mà không in, thì đỏ và gọi tên cột.
- AC-5 (cross-layer): Given ma trận tin không hiện (id lạ, S02, S08, quá hạn, kind khác, giá phi lý, không có loại hình), When mở `/listing/<id>`, Then mọi ca cùng trạng thái 404 và cùng một câu «Tin này không còn hiện», khớp `getOfferPhone`; tin hiện được thì 200.
- AC-6: Given listing thuê ngắn hạn `abnb_…`, When mở `/listing/<id>`, Then trang cũ không đổi, KPI, lịch, comps còn nguyên, và `check-listing-no-airdna` xanh.
- AC-7 (cross-layer): Given ma trận tin cùng và khác phường, loại tin, loại hình, biên diện tích ±25%, When mở tin, Then chỉ hiện tin đúng tiêu chí, không có chính nó, tối đa 6, đều qua `VISIBLE`; không có tin thì `Empty` kèm nút về danh sách đã lọc; tin cấp thị trường không có khối; lỗi truy vấn thì báo trong vùng kèm Thử lại.
- AC-8: Given trang tin, When đọc thẻ head, Then có `noindex`, tiêu đề không có tên người đăng; trang listing thuê ngắn hạn không đổi.
- AC-9 (judgment): Given bản chạy ở 375 và rộng, sáng và tối, When xem các trạng thái của bảng Đặc tả UX, Then đọc được, liên hệ thấy mà không phải cuộn xa, không tràn ngang, đúng luật ReUI.

## Coverage

- Trục lối vào (thẻ Bán, thẻ Cho thuê, đường dẫn trực tiếp, tin cùng tiêu chí): AC-1, AC-5.
- Trục tin hiện được (bán, thuê dài hạn × S03, S05, S06): AC-2, AC-4, AC-5.
- Trục độ đủ (đủ, thiếu, cấp thị trường, tên bị che, không hiện): AC-2, AC-4, AC-5, AC-7. Thước: số đo trong design doc.
- Trục liên hệ (sáu trạng thái `ST-lien-he-*`): AC-3. Thước: bảng Đặc tả UX, gốc từ `so-ghep-s06-nhan-danh-ba`.
- Lớp không lộ tầng A: AC-3, AC-4. Thước: ma trận cột cấm viết trước.
- Lớp khổ và chủ đề: AC-9.
- `[NGÀNH: Zillow, Rightmove]` đưa vào Later, không vào Core: lưu tin, chia sẻ, lịch sử giá. Mạnh gạch tại Cổng Phạm vi nếu muốn đổi.
- `[GIẢ ĐỊNH]` Chưa đo được người xem có thấy trang đủ giá trị khi thiếu bài gốc và ảnh; phiên lái thử sau khi ra sẽ trả lời.

## Out of scope

- OOS-1: Ảnh tin: hàng `anh-tin-cong-khai` (AC1). Không vẽ ô ảnh trống.
- OOS-2: Bản đồ, số nhà, số căn: chưa lên cloud; thêm là việc `sync-cloud` hạng T3.
- OOS-3: Bài gốc, liên kết nguồn, tên hay mã nguồn: luật 6. Vấp 2 của phiên lái thử không làm ở đây.
- OOS-4: Mô tả do máy viết lại từ bài gốc: cần quyết định riêng về luật 6.
- OOS-5: Lưu tin, chia sẻ, tin khác của người đăng, lịch sử giá, báo cáo tin sai.
- OOS-7: So giá với phường: `market_asset_stats` chưa có loại hình, thêm là migration hạng T3 (Hỏi-5).
- OOS-6: Gộp bảng `sale_offers` với `listings`, gộp tin theo căn nhà.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-05:
  - Ngoài-1: Trang tin gọi trường này là «Block» còn khu quản trị gọi là «Toà», nên cùng một thông tin có hai tên giữa hai cổng.
  - Ngoài-2: Tin thuê dài hạn có sẵn đơn giá trên mỗi m² có thể hiện đơn giá đó, và kiểm thử hiện chưa bắt được ca này.
  - Ngoài-3: Màn «Tin này không còn hiện» chưa được bước kiểm thiết kế tự động quét.
