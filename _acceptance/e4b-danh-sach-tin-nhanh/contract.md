---
schema_version: 1
feature: Danh sách tin công khai nhanh — getPublicOffers rút trang trước, đếm tài khoản nhiều tên chỉ cho người bán của trang, tổng đếm theo hàm cửa sổ; trang đầu vn-hcmc bốn kiểu sắp dưới 1000 ms trên DB máy thu, có biên, không nới trần E4b
slug: e4b-danh-sach-tin-nhanh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-08
design_doc: docs/superpowers/specs/2026-11-08-e4b-danh-sach-tin-nhanh-design.md
---

# Acceptance Contract: e4b-danh-sach-tin-nhanh

## Context

Ca `E4b đối chiếu DB máy thu` (`app/tests/tin-rao-doi-chieu.test.tsx`, hồ sơ tin-rao-tren-invest) đỏ trên `main`: trang đầu vn-hcmc
tin bán mất 1032 ms (lượt nhanh nhất trong sáu) dưới tải suite app, chặn mọi hồ sơ T2 chạy suite app (PL34 vòng 1 REJECT vì đúng
ca này). Giám sát giao hàng này đầu dãy P2 (P2-132, Mạnh 08/11 «Đồng ý với các hàng đo hiệu quả hàng ngày và giao dãy»).
EXPLAIN ANALYZE 08/11: CTE `nhieu_ten` quét và gom toàn bộ `sale_offer_records` ở mỗi lời gọi, 300–480 ms trên 540–640 ms của câu
trang, chỉ để dùng cho 24 dòng; câu đếm quét thêm một lượt song song. Số đo đầy đủ và các phương án: `design_doc`.

## Acceptance criteria

### AC-1: Trang đầu dưới 1000 ms trên DB máy thu
- **Given** DB máy thu :5433 `oneinvest` (đọc, không ghi)
- **When** ca E4b chạy riêng, đo `getPublicOffers("vn-hcmc", kind=sale)` ở bốn kiểu sắp newest, price-asc, price-desc, perm2-asc
- **Then** lượt nhanh nhất mỗi kiểu sắp dưới 1000 ms, và mọi khẳng định khác của E4b (total, withPhone, định danh nguồn, tin ẩn,
  giá phi lý, khuôn số) vẫn đạt

### AC-2: Suite app xanh trọn
- **Given** bộ test app chạy như mọi lượt chấm (`npm test`, DB của riêng lượt chép từ DB máy thu, tám tệp song song)
- **When** chạy trọn bộ, gồm E4b dưới tải, trang tin, tin cùng tiêu chí, route `/api/v1/listings`
- **Then** thoát 0, và typecheck cùng lint của app thoát 0

### AC-3: Có biên an toàn
- **Given** bản `offers-public.ts` của commit gốc nhánh e21a151e nạp thành module tạm (câu cũ)
- **When** đo xen kẽ câu cũ và `getPublicOffers` mới cho từng kiểu sắp, trang đầu vn-hcmc tin bán, ba lượt, lấy lượt nhanh nhất
  mỗi bên — ở cả hai điều kiện: chạy riêng trên DB máy thu, và trong suite app (DB của riêng lượt, tám tệp song song)
- **Then** bản mới dưới 700 ms ở cả bốn kiểu sắp, ở cả hai điều kiện; test in số mili giây của cả hai bên
  (700 ms do giám sát trả ở P2-133; Mạnh chốt con số ở Cổng Phạm vi — phương án khác: 500 ms, hoặc index 085 cho dưới 300 ms)

### AC-4: Cùng kết quả như câu cũ trên dữ liệu thật
- **Given** DB máy thu, câu cũ là module tạm từ commit e21a151e
- **When** so `getPublicOffers` mới với câu cũ ở bốn kiểu sắp × năm đường đọc (vn-hcmc bán trang đầu, vn-hcmc bán offset 480,
  vn-hanoi thuê dài hạn trang đầu, một phường vn-hcmc bán, không thị trường bán trang đầu)
- **Then** cùng dãy offerId theo thứ tự, cùng cờ nhiều tên từng dòng, cùng total và withPhone ở cả 20 tổ hợp (lệch thì đọc lại cả
  hai một lần, còn lệch mới đỏ); ít nhất một trang so có dòng mang cờ nhiều tên (không thì đỏ `KHONG DO DUOC`); bản phá đếm tên
  chỉ trong trang thì đỏ `LECH CAU CU`

### AC-5: Cờ nhiều tên vẫn đếm trên mọi tin của tài khoản
- **Given** lược đồ tạm có tài khoản ba tên trải hai trang và hai phường, tài khoản hai tên, `seller_ref` rỗng
- **When** đọc từng trang một dòng, đọc cả danh sách, lọc một phường
- **Then** ba tên về nhãn ở mọi trang và khi lọc phường; hai tên giữ tên; rỗng không gộp; bản phá đếm tên chỉ trong trang đỏ
  `NHIEU TEN`, bản phá đếm tên chỉ trong phường lọc đỏ `DEM SAU LOC`

### AC-6: Tổng đếm đúng cả khi trang rỗng
- **Given** lược đồ tạm có N tin hiện được (vài tin có số)
- **When** đọc trang đầu, trang cuối một dòng (limit 2 offset 4), trang vượt cuối (limit 2 offset 6, và offset 960), bộ lọc
  không khớp tin nào
- **Then** total và withPhone bằng đếm độc lập ở cả năm ca (N và số tin có số ở bốn ca đầu, 0 và 0 ở ca lọc rỗng); trang cuối có
  đúng một dòng; hai trang vượt cuối và bộ lọc rỗng trả không dòng; bản phá bỏ câu đếm dự phòng cho trang rỗng đỏ
  `TOTAL TRANG RONG`

### AC-7: Không nới trần của E4b
- **Given** `app/tests/tin-rao-doi-chieu.test.tsx` ở HEAD và ở commit gốc nhánh e21a151e
- **When** cắt khối đo thời gian của ca E4b ở cả hai bản (từ `for (const sort of OFFER_SORTS) {` tới dòng đếm giá phi lý)
- **Then** hai khối bằng nhau từng ký tự; bản phá đổi `ms < 1000` thành `ms < 1500` trong khối HEAD đã cắt đỏ `TRAN BI NOI`

## Coverage

Quét hình thái (preset test-matrix) ở `design_doc` mục «Không gian tiêu chí».
- Lời hứa thời gian × DB máy thu × trang đầu × bốn sort → AC-1, AC-3; dưới tải suite → AC-2, AC-3. [CE: ngành PostgreSQL — Using EXPLAIN]
- Lời hứa kết quả × DB máy thu × năm đường đọc (gồm không thị trường) × bốn sort → AC-4; × lược đồ tạm → AC-5 (cờ nhiều tên),
  AC-6 (đếm, trang cuối, trang vượt cuối).
- Biên an toàn: độ rộng là câu hỏi cho người (Hỏi, sổ d-20261108T021459Z-11). [CE chưa kiểm chứng]
- Ràng buộc người giao «không nới trần» → AC-7.
- Trang tin và tin cùng tiêu chí (cùng hằng `NHIEU_TEN`) không đổi → AC-2 (bộ trang-chi-tiet-tin-db trong suite).

## Out of scope

- Index 085 `sale_offer_records (seller_ref, seller_name)` — T3, chỉ có tác dụng sau khi Mạnh áp lên DB máy thu; đề xuất riêng
  cho giám sát kèm số đo ở design doc.
- `getPublicOffer` và `getOfferComps` (trang tin) vẫn quét toàn bảng cho `nhieu_ten`; cùng cách sửa, hồ sơ riêng.
- VACUUM FULL bảng phình trên DB máy thu (286 MB so với 120 MB của bản chép) — việc vận hành.
- Đổi `total` sang ước lượng — đổi lời hứa «total bằng đếm độc lập» của E4b.

## Notes

- Hằng `NHIEU_TEN` và thân đếm tên sinh từ một hàm, nên danh sách và trang tin dùng chung một luật đếm tên.
- Câu cũ của AC-3, AC-4 là chính tệp `offers-public.ts` ở commit e21a151e, đọc bằng `git show` và nạp thành module tạm cạnh tệp
  thật; ca cần lịch sử git nên bỏ qua trên CI như mọi ca DB máy thu của tệp.
- AC-3, AC-4 là phép so một lần: test chỉ chạy chúng khi `offers-public.ts` và các tệp nó import còn đúng băm của hồ sơ;
  hàng sau cố ý đổi các tệp ấy thì hai ca bỏ qua, gọi tên tệp. AC-7 so băm khối đo đã ghim, đổi có chủ ý thì cập nhật băm kèm lý do.
