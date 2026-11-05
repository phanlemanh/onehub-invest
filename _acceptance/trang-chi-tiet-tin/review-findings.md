## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): ma trận «mọi ca không hiện» của TCT-AC-5 thiếu hai mệnh đề của VISIBLE**
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:140`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Tên ca ở dòng 166 và 468 nói «mọi ca không hiện», còn dòng 140 ghi «mỗi dòng là một lý do». KHONG_HIEN có 8 dòng nhưng không bao phủ hết các mệnh đề của VISIBLE (offers-public.ts dòng 32-38). (1) Giá thuê chỉ có biên trên: dòng «giá thuê phi lý» dùng 900 triệu, không có dòng dưới OFFER_RENT_MIN_VND = 500.000, dù hợp đồng AC-5 ghi «giá phi lý» chung. (2) Không có dòng area_id NULL, trong khi mệnh đề `o.area_id IS NOT NULL` là chốt duy nhất của getOfferPhone, vì câu đó không JOIN areas (dòng 203). Bản phá BO_VISIBLE (dòng 164, 180-182) xoá cả khối nên không bù được hai chỗ này. Bỏ riêng `o.price_vnd >= OFFER_RENT_MIN_VND` hoặc `o.area_id IS NOT NULL` thì deepEqual ở dòng 168 vẫn xanh. Khi đó tin có thể hiện ra, hoặc route liên hệ trả số của tin không hiện, mà thước không đỏ. Dòng 182 chỉ chứng minh số dòng khớp danh sách tự viết, không chứng minh danh sách đủ so với lớp điều kiện.
  rationale: AC-5 liệt kê «giá phi lý» trong ma trận tin không hiện, mà thước chưa phủ cận dưới của giá thuê nên chưa chứng minh được AC này.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): «tên nguồn thật» của TCT-AC-4 không có ô cho thẻ trong khối tin cùng tiêu chí**
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:394`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Hợp đồng AC-4 đòi phản hồi không có giá trị đánh dấu và tên nguồn thật giả, «cả thẻ trong khối tin cùng tiêu chí». Tin `che` mang TEN_NGUON được gieo với area_m2 200 ở P2. Các tin khác ở P2 có diện tích 50, 80 hoặc 100, đều ngoài dải 150-250. Vì vậy thẻ của `che` không lọt vào khối của tin nào, và trang của `che` cũng rỗng khối, điều mà dòng 437 chủ động assert «Chưa có tin cùng tiêu chí». Phép quét TEN_NGUON ở dòng 435 vì thế chỉ đo thân trang của chính tin đó. Trong khi ô chéo ở dòng 422-427 chỉ quét các cột đánh dấu, không quét tên nguồn. Dòng 442-449 đo đường getPublicOffers, không đo getOfferComps. Sửa getOfferComps thành `toPublicOffer(r, null)`, tức bỏ che tên trên thẻ cùng tiêu chí, thì mọi thước vẫn xanh dù tên nguồn thật lộ trên trang công khai.
  rationale: AC-4 nêu đích danh «cả thẻ trong khối tin cùng tiêu chí» không được chứa tên nguồn thật, mà thước không có ô nào đo đường này.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ma trận TCT-AC-2-ve vẽ từ mau() viết tay, không đi đường ghi DB → đọc → trang như AC-2 cross-layer hứa**
  file: `app/tests/trang-chi-tiet-tin.test.tsx:196`
  severity: medium
  AC: AC-2
  source: measurement
  detail: Hợp đồng AC-2 (cross-layer) ghi: «ma trận loại hình × kind × đủ hoặc thiếu trường GHI VÀO DB THỬ, When mở trang tin, Then hiện đúng». Toàn bộ 13 dòng MA_TRAN_VE lại dựng PublicOfferDetail bằng tay qua mau() (dòng 51-76) rồi đưa thẳng vào OfferBody ở dòng 196, không qua getPublicOffer. Phía DB (TCT-AC-2-doc, dòng 89-104 tệp db) chỉ round-trip một dòng đủ trường là căn hộ bán S06, và dừng ở đầu ra của reader, không vẽ. Ca HTTP cũng chỉ mở các tin căn hộ bán: dòng 421 tìm «Anh Ba», «BX»; dòng 464 tìm «Căn hộ». Các ô nhà, đất, rent_lt, thiếu trường không có ô nào đi qua reader rồi tới trang. Lệch giữa dạng reader trả với dạng fixture giả định ở các ô đó, ví dụ Block, Đường về chuỗi rỗng hay null, hay mặt tiền kiểu numeric, sẽ không làm đỏ thước nào: fixture đúng khuôn theo kiểu chứ không rút từ writer.
  rationale: AC-2 cross-layer đòi ma trận loại hình × kind × đủ/thiếu trường ghi vào DB thử rồi mở trang, mà ma trận hiện dựng tay không qua đường đọc.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Trang tin ghi nhãn «Block» trong khi từ vựng chuẩn của block_raw là «Toà»**
  Người dùng thấy gì: Trang tin gọi trường này là «Block» còn khu quản trị gọi là «Toà», nên cùng một thông tin có hai tên khác nhau giữa hai cổng.
  Căn cứ: Chỉ lệch chữ hiển thị, số liệu vẫn đúng, người dùng vẫn hiểu được; sửa sau rẻ và không mất dữ liệu.
  file: `app/src/components/listing/offer-body.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): «tin thuê không có đơn giá» xanh vì fixture đã để pricePerm2 null**
  Người dùng thấy gì: Nếu một tin thuê dài hạn có sẵn đơn giá trên mỗi m², trang có thể hiện đơn giá đó dù không nên, và kiểm thử hiện chưa bắt được trường hợp này.
  Căn cứ: Chỉ ảnh hưởng một dòng thông tin phụ trên tin thuê, không lộ dữ liệu nhạy cảm, người dùng không bị mất gì; bổ sung kiểm thử sau rẻ.
  file: `app/tests/trang-chi-tiet-tin.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E11 hứa cổng thiết kế «trên tệp mới» nhưng tct_gate chỉ quét offer-body.tsx, bỏ not-found.tsx mới thêm**
  Người dùng thấy gì: Màn «Tin này không còn hiện» khi tin bị ẩn có thể vi phạm luật thiết kế mà bước kiểm tự động không phát hiện ra.
  Căn cứ: Màn này đơn giản, nếu lệch chuẩn giao diện thì chỉ xấu hoặc lệch kiểu chứ không hỏng chức năng hay lộ dữ liệu; có thể soi bằng mắt khi xem.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
