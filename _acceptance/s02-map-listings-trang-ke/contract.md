---
schema_version: 1
feature: "S02 — trang kế của danh sách căn trên bản đồ gửi offset trong thân, không gắn hậu tố vào đường dẫn; vòng phân trang có trần (ZC23)"
slug: s02-map-listings-trang-ke
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-28
design_doc: _acceptance/s02-map-listings-trang-ke/design.md
---

# Acceptance Contract: s02-map-listings-trang-ke

## Context

Hàng ZC23 (dãy ZT), GS giao 27/11, chồng trên ZC22 (`fix/s02-cua-api`) và gộp SAU ZC22. Lỗi có sẵn trên main: vòng phân trang
`map_listings` gọi trang kế bằng đường dẫn `/v1/market/{m}/map_listings@{offset}`, nguồn trả 404, bộ thu đếm một lời lỗi rồi
dừng vòng → mỗi thị trường từ 15000 căn chỉ thu trang đầu. ZCode đo 26/11: Hà Nội có 30 623 căn trong ba trang, mã cũ lấy 15000
(thiếu 51%); cùng lời với `offset` trong thân trả 200 và 15000 căn khác trang đầu.

Nguồn mã: `origin/zcode/s02-map-listings-trang-ke` @99d49687f (ZCode, LL soát cổng + soat-m5), gộp nguyên — hai tệp mã khớp byte.
Mã bỏ hậu tố `@<số>` khỏi đường dẫn gửi đi; `sourceId`, `meta.apiPath` giữ tên trang; `payload.url` là đường dẫn đã gửi. Hồ sơ
của nhánh zcode là đầu vào tham khảo; hợp đồng này do ZT viết, giữ phép đo đột biến của ZCode và thêm AC-4 (bộ đọc phía sau),
AC-5 (trần vòng phân trang).

Phát hiện khi soát (ZT 27/11): trước sửa, trang 2 luôn 404 nên vòng dừng ngay; sau sửa vòng chỉ dừng khi nguồn trả dưới 15000
căn. Đo trên fixture: nguồn lặp lại trang đầu, hoặc trả trang mới mãi → vòng gửi tới 30 lời (chặn của bản giả), tức lưu lượng
thật không trần. AC-5 đòi chốt; chốt là logic thu nên do ZCode viết — có ở @2b9e94afb (trần 10 trang, chạm trần thì một dòng log và lượt lộ lỗi).

Người dùng: lượt thu S02 hằng đêm; người đọc đầu ra phía sau là `pipeline/transform-airdna.mjs` (bảng `airdna_listings`, chỉ hiệu
chuẩn — luật 5) và danh sách thu S01 lấy từ ID của S02.

## Acceptance Criteria

- AC-1: Given `call("POST", "/v1/market/47/map_listings@15000", { pagination: { page_size: 15000, offset: 15000 } }, …)` với hàm gửi
  giả, When gọi, Then gửi đúng MỘT lời tới `…/v1/market/47/map_listings` (không hậu tố), thân giữ `pagination.offset = 15000`;
  `sourceId` và `meta.apiPath` là tên trang `/v1/market/47/map_listings@15000`; `payload.url` là đường dẫn đã gửi. Bốn bản đột biến
  (gửi lại hậu tố · cắt đường dẫn kể cả khi không có hậu tố · `sourceId` ghi đường gửi · `payload.url` ghi tên trang) đều bị bắt.
- AC-2: Given `call("GET", "/v1/market/47/map_listings", null, …)` — không hậu tố, When gọi, Then gửi đúng đường dẫn đó, `sourceId`
  giữ nguyên; bản đột biến «cắt đường dẫn kể cả khi không có hậu tố» bị bắt.
- AC-3: Given nhánh so với nhánh hồ sơ ZC22 (`fix/s02-cua-api`), When so tệp đổi, Then chỉ gồm tệp bộ thu S02 (xuất
  `docExpAppToken`), `collector/src/test/s02-bo-thu-cua-api.test.ts`, hồ sơ này và hai tệp bản đồ sinh; `cli.ts`, tệp phiên S02,
  `collector/src/core/**`, `pipeline/**` không đổi; trọn bộ test collector đạt.
- AC-4: Given bản ghi trang kế mà `call()` trả, When áp biểu thức lấy mã thị trường của `pipeline/transform-airdna.mjs` (rút từ chính
  tệp đó) lên `payload.url`, Then ra đúng mã thị trường `47` — bộ nạp đọc được trang kế mà không phải đổi; bộ đọc giả đòi hậu tố «@»
  thì trượt.
- AC-5: Given một lượt `collect()` một thị trường trên profile tạm và fetch giả trả đủ 15000 căn mỗi trang, When (a) nguồn bỏ qua
  offset và trả lại trang đầu mãi, (b) nguồn trả trang mới đủ 15000 căn mãi, Then vòng phân trang dừng trong ≤ 11 lời
  `map_listings` ở cả hai ca, ghi một dòng log nói lý do dừng, và lượt lộ lỗi (ném, hoặc `coverage.failed > 0`) — không «xong» im
  lặng với dữ liệu bị cắt; vế không bắn: trang cuối dưới 15000 căn thì dừng như cũ, không dòng ấy, không lỗi. Cách dừng và con số
  trần do ZCode chọn (LL giao 27/11), trần 11 lời là mức trên của phép đo. Trần đã chọn: `TRANG_MAP_TOIDA = 10` trang mỗi thị
  trường (150 000 căn, khoảng 5 lần Hà Nội) — hai ca bất thường dừng ở đúng lời thứ 10; đổi trần phải qua cổng.
- AC-6: Given phần diff của `collector/` so với mốc (nhánh ZC22, hoặc `origin/main` khi ZC22 đã gộp), When đếm dòng thêm mới mang
  tên miền gốc của nguồn (rút từ hằng của tệp bộ thu, không gõ trong phép đo), Then 0 dòng — hàng không thêm tên nguồn thật vào kho
  công khai; cấy một dòng thì phép đo đỏ.

## Out of scope

- Chạy bộ thu với phiên thật, đọc profile thật — ngoài phạm vi, vì là giới hạn phía Claude (Notes); chạy thật là ba trang Hà Nội
  ZCode ghi 26/11.
- Đổi transform và pipeline — ngoài phạm vi, vì AC-4 chứng bộ nạp đã đọc được trang kế; số dòng `airdna_listings` của thị trường lớn
  sẽ tăng khoảng gấp đôi sau khi áp.
- Đo số trang thật của các thị trường lớn khác (vd 48) — ngoài phạm vi, vì cần lưu lượng thật; sau triển khai ZCode báo số.
- Build `collector/dist` ở checkout chính — ngoài phạm vi, vì làm cùng bước triển khai của ZC22, GIAO cho ZCode qua LL.
- Gộp trước ZC22 — ngoài phạm vi, vì nhánh này chồng trên nhánh ZC22.
- Báo người khi trang kế lỗi (404, 500) mà lượt vẫn xong — ngoài phạm vi, vì lỗi lẻ đã đếm vào `coverage.failed` của manifest (có
  sẵn); bộ báo đọc số đó là việc của thước độ tươi, cùng mục với bộ đọc AUTH FAIL / BỊ CHẶN của ZC22.

## Coverage

| Ca \ kết cục | Lời gửi đi | Danh tính bản ghi | Vòng phân trang |
|---|---|---|---|
| Trang đầu (offset 0, không hậu tố) | đường dẫn giữ nguyên | tên giữ nguyên · AC-2 | đi tiếp nếu đủ 15000 |
| Trang kế (offset trong thân, tên có hậu tố) | bỏ hậu tố, thân giữ offset · AC-1 | tên trang giữ hậu tố · AC-1 | đi tiếp nếu đủ 15000 |
| Trang cuối dưới 15000 căn | như trên | như trên | dừng như cũ · AC-5 vế không bắn |
| Nguồn lặp lại trang đầu mãi | như trên | như trên | dừng ≤ 11 lời, một dòng lý do · AC-5(a) |
| Nguồn trả trang mới đủ 15000 mãi | như trên | như trên | dừng ≤ 11 lời, một dòng lý do · AC-5(b) |
| Trang kế lỗi (404, 500, mạng) | lời lỗi lẻ, đếm vào `coverage.failed` | — | dừng (bản ghi null) · có sẵn, ngoài phạm vi |
| Trang kế bị chặn (429, thử thách, 403) | dừng cả lượt | — | — · ZC22 AC-13 |

- Trục người đọc đầu ra: bộ nạp `transform-airdna.mjs` (mã thị trường từ `payload.url`, khoá upsert `property_id`) · mọi bên đọc
  khác (sync-cloud, dq, backfill ảnh, audit, danh sách thu S01) đọc bảng `airdna_listings`, không đọc snapshot theo `sourceId`
  [thước CE: `git grep -l -E 'airdna_listings|airdna-v2-map' -- pipeline collector/src scripts db`, 27/11: 6 tệp ngoài transform,
  không tệp nào lọc theo đuôi đường dẫn] — AC-4.
- Trục tên nguồn trên kho công khai: dòng mới trong mã · trong test — AC-6.
- Trục vùng thay đổi: tệp bộ thu · tệp test · hồ sơ · bản đồ — AC-3.
- Ô bỏ: chạy thật với nguồn sống — ngoài phạm vi, vì cần phiên của Mạnh và lưu lượng thật.

## Đường đo

Sau triển khai (cùng lượt build với ZC22), lượt S02 19:05 đầu tiên: thị trường 47 có ba lời `map_listings` (15000 + 15000 + 623),
0 lời 404; số căn duy nhất của thị trường 47 trong `airdna_listings` từ 15 000 lên khoảng 30 600 (đo bằng
`SELECT count(*) FROM airdna_listings WHERE airdna_market_id = '47'` sau transform). ZCode báo số lời qua LL; ZT đo số căn sau
transform trên DB máy thu (chỉ đọc).

## Notes

- Giới hạn phía Claude (ZT): không đọc profile hay phiên thật, không chạy bộ thu với phiên thật — chấm chỉ trên fixture; không giá
  trị phiên hay định danh tài khoản thu trong log, fixture, hồ sơ; dữ liệu S02 theo luật 5.
- Mục ghi cho Cổng: (1) ba dòng test mang tên miền nguồn thật: ZCode đã viết lại bằng hằng `API` xuất từ tệp bộ thu (@2b9e94afb),
  AC-6 giữ nguyên; (2) chốt AC-5 là logic thu → ZCode viết (`lapTrangMapListings`, `TRANG_MAP_TOIDA`), ZT không sửa; (3) sau gộp
  GIAO build collector cho ZV cùng lượt với ZC22 (hoặc build lại một lần nếu ZC22 đã triển khai).
- Nguồn mã mới: `origin/zcode/zt-s02-trang-ke` @2b9e94afb (con của 99d49687f, LL soát cổng ĐẠT 27/11), gộp nguyên — hai tệp mã khớp byte.
- Phép đo chạy lại 27/11 trên nhánh tích hợp: `chay-test-dot-bien.mjs trang-ke` XANH (40 ca, bốn đột biến bị bắt);
  `phia-sau-va-tran-trang.mjs` XANH — AC-4 đạt; AC-5 hai ca bất thường dừng ở 10 lời, một dòng lý do, lượt lộ lỗi; vế không bắn
  2 lời, 0 dòng, không lỗi; đối chứng âm trên mã 99d49687f: hai ca chạy tới 30 lời → ĐỎ. `khong-ten-mien-moi.sh` XANH (0 dòng).
  Sửa phép đo AC-5: lời ngoài `map_listings` của bản giả trả 200 rỗng thay vì 500 (bản trước làm vế không bắn đỏ giả).
- `vung.sh` và `khong-ten-mien-moi.sh` tự chọn mốc: ZC22 chưa vào main → nhánh ZC22; đã vào → `origin/main`; in «mốc so: …».
- Known limits — chọn ở Cổng Bằng chứng 2026-11-28:
  - Ngoài-1: chạm trần 10 trang thì dòng nhật ký ghi «FAILED» nhưng lượt vẫn ghi là xong (chỉ kèm số lỗi lớn hơn 0), người đọc nhật ký dễ hiểu nhầm.
  - Ngoài-2: thư mục tạm của phép cấy lỗi nằm trong collector/ mà không có trong .gitignore, lượt chấm bị ngắt có thể để rác bị commit nhầm.
  - Ngoài-3: test đơn vị kiểm trần bằng chính hằng số của mã, không kiểm cận trên 11 lời; chỉ phép chấm riêng bắt khi trần bị nâng quá cao.
  - Ngoài-4: test đơn vị dùng chung một bản giả cho hai ca nguồn bất thường; phép chấm riêng vẫn kiểm tách từng ca.
