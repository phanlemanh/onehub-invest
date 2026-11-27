## Trong hợp đồng

- **Hình dạng 3 — PB2-AC-11 chỉ assert status 200, lời hứa là QUAN HỆ bằng nhau với thân /v1/asset-stats cũ**
  file: `data-api/test/listing-reso.test.ts:1074`
  severity: high
  AC: AC-11
  detail: E14 hứa: GET /v1/price-stats?area và ?market «trả đúng thân mà /v1/asset-stats trả trên merge-base cho cùng DB (so bằng nhau, ghim trong test)». Ca chỉ có `assert.equal(a.status, 200)` và `assert.equal(m.status, 200)`. Không có so thân nào, cũng không ghim thân nào. Dòng cấy market_asset_stats lại có `.catch(() => undefined)`, nên cấy hỏng thì vẫn xanh. Một route trả `{data:null}` hay số sai với mã 200 vẫn qua. Ô asset-stats-cu của pha.mjs cũng chỉ bắt đường 410, không bắt sai thân.
  source: measurement

- **Hình dạng 4 — PB2-AC-10c chỉ assert âm tính về paths của openapi, không có đối chứng dương**
  file: `data-api/test/listing-reso.test.ts:1093`
  severity: medium
  AC: AC-10
  detail: `for (const p of ["/v1/deals", "/v1/asset-stats"]) assert.ok(!(p in api.paths), ...)` là assert âm tính đứng một mình. E14 và E13 còn hứa «/openapi.json có /v1/price-stats». Ca không kiểm `"/v1/price-stats" in api.paths`, cũng không kiểm một đường sống nào khác. Nếu `api.paths` rỗng, sai cấu trúc hay đổi khuôn khoá thì vế này vẫn xanh. E13 còn đòi đối chứng đột biến trong cùng ca: «bản chép schema thêm một khoá → bộ so ra «AC-10 openapi lệch hợp đồng: <khoá>»». Ca không có đối chứng đó, và thông điệp thật («PB2 openapi Listing lệch tệp hợp đồng») khác thông điệp eval ghim.
  source: measurement

- **Hình dạng 4 — assert `every` trên mảng có thể rỗng ở vế kind=rent_lt của PB2-AC-5**
  file: `data-api/test/listing-reso.test.ts:1055`
  severity: medium
  AC: AC-5
  detail: `assert.ok((thue.than.data as any[]).every((x) => x.kind === "rent_lt"), "PB2-AC-5 kind=rent_lt lọc sai")` không có đối chứng dương. Lúc gọi, offer_price_rank chỉ có dòng của BAN (sale) và tin THUE không được cấy hạng, nên `data` nhiều khả năng rỗng và `every` xanh suông. Ca không assert `length > 0`. E5 còn đòi «kind lạ → 400 error.code/message» trên đường giá tốt, nhưng ca không gọi kind lạ kèm minBelowMedianPct.
  source: measurement

- **Hình dạng 4 — chiều đỏ của luoc-do-mau.mjs nhận BẤT KỲ lỗi áp nào, mà lược đồ nền đã có lỗi sẵn không liên quan**
  file: `_acceptance/data-api-hop-dong-reso-dd-2-1/probes/luoc-do-mau.mjs:391`
  severity: high
  AC: AC-9
  detail: `await voiDb("cu", cu, async (db, loi) => { if (loi) { console.log(`luoc-do: bản cũ đỏ: áp lỗi ${loi}`); return; } ...` tính đỏ ngay khi có lỗi áp đầu tiên (`loi ??=`) mà không ghim lỗi nào. Theo chính scripts/data-api-ten-nguon.test.mjs (MONG.loi trên nền: «1 LOI 012 42P01», «1 LOI see 42P01», «10 LOI see 25P02»; chú thích «có ba lỗi sẵn — 012 cập nhật area_sources chưa có»), 19 tệp data-api/db của nền luôn lỗi ở 012. Vì vậy ô «bản cũ đỏ» luôn đạt nhờ lỗi có sẵn, không nhờ điều PB2 sửa (đường căn giá tốt không 200 trên lược đồ cũ). Đối chứng này không bao giờ đo được việc thước mất răng.
  source: measurement

- **Hình dạng 1 — hop-dong.mjs lấy giá trị lookup bằng grep mã nguồn route thay vì đọc đầu ra**
  file: `_acceptance/data-api-hop-dong-reso-dd-2-1/probes/hop-dong.mjs:184`
  severity: medium
  AC: AC-7
  detail: Giá trị FeeFrequency và AreaUnits mà probe đem so với StandardName của DD 2.1 lấy bằng `route.matchAll(/leaseAmountFrequency:[^\n]*/g)` và `/(?:livingAreaUnits|pricePerAreaUnit):[^\n]*/g` trên chữ của routes/listings.ts, rồi bắt chuỗi `"[A-Z]..."` trên cùng dòng. Tập khoá phần tử cũng lấy bằng regex khối `const v: Record<string, unknown> = {`. Probe đo cách viết mã, không đo thân API trả ra. Nếu giá trị được dựng qua hằng hay hàm ở chỗ khác, hoặc biểu thức xuống dòng, tập giaTri rỗng: vòng `for (const v of giaTri[k.lookup] ?? [])` chạy 0 lần và ô goc vẫn sạch («<v> giá trị lookup — đều khớp») mà không so được giá trị nào. Probe không có assert soGiaTri > 0 theo từng lookup.
  source: measurement

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **/v1/listings đọc sale_offers không có bộ lọc hiển thị (S02/S08, hạn tươi, giá phi lý)**
  Người dùng thấy gì: Nếu sau này có tin từ hai nguồn không được phép hiển thị được nạp vào kho tin bán, API công khai sẽ trả luôn các tin đó, kể cả tin cũ hoặc giá vô lý. Hôm nay chưa có dòng nào như vậy nên người dùng chưa thấy.
  Căn cứ: Hiện chưa lộ dữ liệu nào, nhưng hậu quả nặng nếu có vì là API công khai và khó thu hồi; nên làm thành việc riêng trước khi nạp thêm nguồn.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: new-contract

- **soLich gộp bảng nights lúc request thay vì đọc listing_stats tính sẵn**
  Người dùng thấy gì: Mỗi lần xem tin thuê ngắn hạn, hệ thống tính lại số liệu lấp đầy từ bảng đêm rất lớn, nên có thể chậm khi nhiều người gọi cùng lúc. Kết quả vẫn đúng.
  Căn cứ: Chỉ ảnh hưởng tốc độ, không sai dữ liệu, và API chưa có người gọi; sửa sau không phá gì.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: known-limits

- **bedroomsTotal không kiểm ở biên, giá trị lạ thành lỗi 500**
  Người dùng thấy gì: Nếu người gọi nhập số phòng ngủ không phải số, API báo lỗi máy chủ thay vì báo rõ là nhập sai. Thử lại với giá trị đúng là dùng được bình thường.
  Căn cứ: Chỉ là thông báo lỗi kém rõ, không mất hay lộ dữ liệu, người gọi tự sửa được ngay; sửa sau rẻ.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: known-limits

- **Đường /v1/listings/:listingKey không kiểm dạng khoá trước khi vào SQL**
  Người dùng thấy gì: Khi gọi với mã tin lạ, hệ thống vẫn trả không tìm thấy nhưng tốn công tra hơn mức cần thiết.
  Căn cứ: Chỉ tốn tài nguyên chút ít khi bị gọi bậy, không ảnh hưởng dữ liệu người dùng; chi phí sửa lớn hơn hậu quả hiện tại.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: wont-fix

- **lastSeenTimestamp của tin thuê ngắn hạn lệch múi giờ, và đổi giá trị tuỳ ?kind**
  Người dùng thấy gì: Ngày tin thuê ngắn hạn được thấy lần cuối có thể hiện lùi một ngày, và cùng một tin có thể hiện hai giờ khác nhau tuỳ cách lọc. Người đọc có thể hiểu sai tin mới hay cũ.
  Căn cứ: Số sai chỉ lệch một ngày nhưng nằm trên API công khai và không nhất quán giữa các cách gọi; nên sửa sớm, người dùng không tự khắc phục được.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 — danh sách bảng/view mong đợi rút từ chính schema.sql đang kiểm, lời hứa «như trước khi dọn» thành tự so với mình**
  Người dùng thấy gì: Nếu khi gộp lược đồ có bảng cũ bị bỏ sót, bài kiểm hiện tại sẽ không báo. Có thể thiếu bảng mà không ai biết cho đến khi một đường nào đó gọi tới.
  Căn cứ: Rủi ro thấp vì các đường API đã được kiểm chạy thật trên DB rỗng và sẽ lộ nếu thiếu; sửa sau không mất dữ liệu.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — PB2-AC-4 không ghim thông điệp mà eval E4 hứa**
  Người dùng thấy gì: Khi một loại tin bị gán sai loại hình, dòng báo lỗi của bài kiểm có chữ khác với mô tả, gây khó đối chiếu cho người chấm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là câu chữ trong báo lỗi kiểm thử, không ảnh hưởng dữ liệu hay người dùng; không đáng mở việc.
  file: `data-api/test/listing-reso.test.ts`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
