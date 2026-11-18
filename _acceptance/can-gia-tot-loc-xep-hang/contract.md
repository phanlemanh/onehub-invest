---
schema_version: 1
feature: Người vận hành chọn một vị trí trên cây (tỉnh → phường → dự án), lọc loại hình, bán hay thuê và thấy danh sách Căn giá tốt xếp theo hạng giá trên toàn tập, mỗi dòng kèm nhãn hạng, nhóm so sánh, số căn trong nhóm, lý do lùi cấp và độ tin
slug: can-gia-tot-loc-xep-hang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: draft
design_doc: docs/superpowers/specs/2026-11-18-can-gia-tot-loc-xep-hang-design.md
---

# Acceptance Contract: can-gia-tot-loc-xep-hang

## Context

Hàng CG3 (`docs/plan/lo-trinh.json`, mốc MS2). Cổng Đáng: Mạnh chốt `build` 09/11 (#395). Vòng này gánh phần còn nợ của UI10 và OH2:
báo danh sách bị cắt, số đếm đúng tổng, tab trống có hành động. Phép đo màn hiện tại nằm ở `opportunity.md`. Hôm nay màn không lọc hiện
0/832 căn «Giá tốt» cấp dự án và 0/254 căn S03 cấp dự án. Truy vấn chỉ chọn tin nào hiện, không tính lại điểm (luật 10). Thiết kế: `design_doc`.

## Criteria

- AC-1 (cross-layer): Given tập căn viết trước có đủ bốn nhóm (cấp dự án và cấp phường, mỗi cấp có căn thường và căn cần xác minh), When mở
  `/ops/deals` không tham số, Then thứ tự là căn thường cấp dự án, căn thường cấp phường, rồi căn cần xác minh; trong mỗi nhóm hạng phần trăm tăng
  dần, cùng hạng thì mức dưới trung vị giảm dần, cùng mức thì mã tin tăng dần.
- AC-2: Given một dòng mỗi loại (Giá tốt cấp dự án, Rẻ trong phường, lùi cấp có lý do, nhóm thuê theo giá tháng, cần xác minh), When dựng dòng của
  bảng, Then dòng ghi nhãn hạng đúng `NHAN_HANG`, tên nhóm so sánh (tên dự án hoặc tên phường), số căn trong nhóm, lý do lùi cấp khi có, và độ tin
  của tin; dòng thuê ghi trung vị «tr/tháng», không ghi «tr/m²».
- AC-3 (cross-layer): Given tập căn lớn hơn một trang, When mở màn, Then số trên bốn tab đếm trên toàn tập đã lọc, «Tất cả» bằng tổng ba tab còn lại,
  không có căn nào được đếm ở hai tab, số «Đủ để gọi» và «Còn thiếu» theo luật đầy đủ của `thieuGi`, như nhau ở mọi vai, và chân bảng ghi khoảng đang hiện trên tổng
  số căn (dạng «1–15 / 7.385»).
- AC-4 (cross-layer): Given 37 căn, cỡ trang 15, có căn mang từ hai tin trở lên nằm ở biên trang, When đi hết các trang của từng tab, với vai Người xem và vai
  Vận hành, trên lược đồ máy thu và cloud, Then hợp các trang của mỗi tab đúng bằng số trên tab đó, không trùng, không sót, mỗi trang đủ 15 căn phân biệt trừ trang cuối, cùng thứ tự với
  AC-1; đổi cỡ trang hay đổi điều kiện về trang 1; `page` vượt cuối trả trang cuối; `page`, `size` sai khuôn dùng mặc định; `?can=` của căn ngoài trang
  hiện tại vẫn mở được căn đó.
- AC-5 (cross-layer): Given căn ở hai tỉnh, nhiều phường, có căn gắn thẳng tỉnh, căn thuộc dự án và một dự án trải hai phường, When chọn một tỉnh, một phường hay một dự án
  trên bộ chọn vị trí (tỉnh có hai nhánh Phường và Dự án), Then danh sách và số đếm chỉ gồm căn của nút đó: căn gắn thẳng tỉnh thuộc tỉnh, không thuộc phường nào; chọn dự án lấy cả dự án
  ở mọi phường. URL mang đúng `location` hoặc `project`, mở lại URL cho cùng kết quả, mỗi mục của cây ghi số căn bằng số căn khi chọn mục đó theo `kind`, `type` đang chọn, tổng các tỉnh bằng
  tổng tập, và đường dẫn cũ `?project=<id>` vẫn chạy.
- AC-6 (cross-layer): Given căn bán và căn thuê của nhiều loại hình, When chọn Bán hoặc Cho thuê và một loại hình, kết hợp với một vị trí, Then chỉ còn căn
  thoả mọi điều kiện; mặc định là Bán; tin thuê thiếu diện tích vẫn xếp theo thước giá tháng theo số phòng ngủ; giá trị lạ của `kind`, `type` bị bỏ qua.
- AC-7: Given từng trạng thái của `ST-deals-*`, When dựng vùng dữ liệu, Then tab trống có nút «Xem tất cả», lọc rỗng có nút «Xoá bộ lọc», tập rỗng có nút
  sang chất lượng dữ liệu, lúc tải có `DealsSkeleton`, truy vấn lỗi có «Thử lại», và trong cả ba ca trống, lỗi bộ lọc vẫn đứng.
- AC-8 (cross-layer): Given vai Người xem, When đọc bất kỳ trang nào, với bất kỳ điều kiện lọc nào, Then dữ liệu gửi xuống trình duyệt không có tên, số điện
  thoại, ảnh, chữ bài, địa chỉ dưới phường, và không có cột «Gọi ai»; vai Vận hành nhận đủ. Given lược đồ cloud không có bảng của máy thu, When mở màn, Then
  danh sách, số đếm, phân trang vẫn chạy và màn báo ảnh, chữ bài chỉ có ở máy thu.
- AC-9: Given bảng danh sách và đầu trang, When dựng màn, Then mô tả trang nói đúng tập đang hiện (không còn «Tin nội bộ S03, S05 rẻ hơn thước S06 cùng phường»), phần
  trăm trên bảng dùng dấu phẩy thập phân («−33,7%»), bảng và đầu trang không còn chữ «thước phường», và nguồn chỉ hiện bằng mã `S0x`.
- AC-10: Given DB máy thu, When mở màn không lọc, Then 15/15 dòng đầu là căn «Giá tốt» cấp dự án (hôm nay 0/15), số trên tab khớp `probes/dem-tap-can.mjs` (hôm nay tab ghi 30, lệnh
  đo ra 7.385), đi hết các trang được đúng `tong` mã phân biệt, và màn tải xong trong 3 giây. When chọn Vinhomes Ocean Park 1 trên bộ chọn, Then số trên tab bằng lệnh đo với mã `1`
  (hôm nay 189) và thứ tự đúng AC-1. Màn đọc được ở sáng, tối, khổ 390 px không cuộn ngang trang, và vai Người xem không thấy cột «Gọi ai».

## Coverage

Quét theo khuôn ma trận kiểm thử. Số trong ô đếm từ DB máy thu 18/11 trên tập có nhãn hạng, mỗi căn một dòng, thấy trong 45 ngày, dưới trung vị 5–50%. Mọi căn cấp dự án trong tập đều mang nhãn «Giá tốt», mọi căn cấp phường mang nhãn «Rẻ trong phường».
Đối chiếu ngành: bộ lọc vị trí, loại hình, bán hay thuê kèm tổng kết quả và phân trang là mẫu chung của [NGÀNH: Zillow, Redfin].

| Trục | Giá trị và số căn | Ai đọc đầu ra | AC |
|---|---|---|---|
| Bán, thuê × cấp | bán dự án 832 · bán phường 6.553 · thuê dự án 1.591 · thuê phường 7.632 | Người vận hành | AC-1, AC-6 |
| Cần xác minh | bán 2.390 · thuê 3.020 | Tab «Cần xác minh» | AC-1, AC-3 |
| Thước | bán giá/m² 7.385 · thuê giá/m² 8.527 · thuê giá tháng 696 | Dòng trong bảng | AC-2, AC-6 |
| Vị trí | bán: 4 tỉnh · 221 phường · 140 dự án (4 dự án trải nhiều phường) · 260 căn gắn thẳng tỉnh | Bộ chọn vị trí | AC-5 |
| Căn nhiều tin | bán: 493 căn có từ hai tin trở lên trên 7.385 căn, 8.065 tin | Phân trang, số đếm | AC-3, AC-4 |
| Loại hình | bán: nhà riêng 4.686 · căn hộ 1.878 · đất 814 · thương mại 7 · thuê thêm phòng 1.879 | Bộ lọc loại hình | AC-6 |
| Vai | Người xem · Vận hành · Quản trị | Dữ liệu gửi xuống trình duyệt | AC-8 |
| Nơi chạy | máy thu · cloud | Danh sách, số đếm | AC-8 |
| Trạng thái vùng | tải · có dữ liệu · tab trống · lọc rỗng · tập rỗng · lỗi | Người vận hành | AC-7 |

Ô bỏ, ngoài phạm vi: xem mục dưới. `[GIẢ ĐỊNH]` không có dòng nào.

## Đường đo

- Căn «Giá tốt» cấp dự án ở đầu màn mặc định: đếm trên màn, đối chiếu `probes/dem-tap-can.mjs` (AC-10).
- Số trên tab bằng số của lệnh đo, không lọc và khi lọc một dự án (AC-3, AC-5, AC-10).

## Out of scope

- Chọn phân khu và toà trên cây: bảng hạng chưa có hai cấp này, tin chưa gắn toà tới khi PL20 xong. Mục «cắt/hoãn» chờ Mạnh quyết ở Cổng Phạm vi.
- Lọc số phòng ngủ, diện tích, tầng, đường: tách hàng sau; tầng mới phủ 1% tin.
- Đổi luật «thiếu gì» của tab «Còn thiếu» (tin S06 không có chữ bài luôn thuộc tab này).
- Cỡ Badge của `PageHeader` dùng chung cho mọi trang.
- Đổi API công khai `/v1/deals`, migration, bảng tính sẵn mới.
- Chữ «thước phường» và số thập phân dấu chấm trong câu của sheet, trang một căn: các hồ sơ đã ký đang ghim nguyên văn, cần một hàng dọn từ vựng riêng.

## Notes

- Mạnh đã chọn 18/11: căn Giá tốt cấp dự án lên đầu; đưa tin thuê vào, mặc định Bán; hoãn phân khu, toà, số phòng ngủ, diện tích, tầng, đường; đóng UI10; mọi vai đếm tab theo luật đầy đủ; nâng Next.js ở hàng riêng.
