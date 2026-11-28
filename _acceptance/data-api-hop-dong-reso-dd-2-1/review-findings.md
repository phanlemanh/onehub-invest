# Review findings: data-api-hop-dong-reso-dd-2-1 (round 2)

## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính đứng một mình, không có đối chứng): lọc market và area của /v1/listings không có tin nào bị loại**
  AC: AC-3
  file: `data-api/test/listing-reso.test.ts:169`
  severity: medium
  source: measurement
  detail: PB2-AC-3 chỉ kiểm `assert.equal(tt.than.data.length, tat.than.data.length, "PB2-AC-3 market lọc sai")`, trong đó tt gọi ?market=TT và tat gọi ?area=PH. Mọi dòng cấy đều nằm ở đúng một phường PH thuộc TT, và ngoài thị trường TT không có tin cấy nào. Nếu route bỏ qua tham số market (trả mọi tin) trên DB thử chỉ có dòng PB2, hai độ dài vẫn bằng nhau và ca vẫn xanh. Lọc area cũng không có ca nào chứng minh nó loại được tin. E3 đòi rõ «market, area, bedroomsTotal mỗi lọc chỉ giữ tin thoả (có tin không thoả bị loại — đối chứng)». Chỉ bedroomsTotal có đối chứng ngầm, vì tin bán cấy có 2 phòng ngủ.
  lý do thuộc hợp đồng: AC-3 đòi mỗi bộ lọc market, area chỉ giữ tin thoả, mà ca test không có tin nào bị loại nên không chứng minh được điều đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **/v1/listings đọc sale_offers không loại S02, S08: tin của hai nguồn chỉ dùng hiệu chuẩn hoặc nội bộ lọt ra API công khai**
  Người dùng thấy gì: API công khai có thể trả tin rao và giá của hai nguồn chỉ được dùng nội bộ, kèm mã nguồn. Người ngoài có thể thấy dữ liệu mà luật nguồn cấm đưa ra.
  Căn cứ: Nặng vì dữ liệu của nguồn bị cấm có thể lộ ra ngoài và không thu hồi được sau khi đã có người lấy; nhưng API chưa triển khai nên chưa ai thấy, và sửa nên làm sớm, trước khi mở.
  file: `data-api/src/routes/listings.ts`
  severity: high
  Đề xuất: new-contract

- **bedroomsTotal không được kiểm ở biên: giá trị không phải số làm Postgres lỗi và trả 500**
  Người dùng thấy gì: Gõ số phòng ngủ không phải số thì API báo lỗi máy chủ thay vì báo tham số sai. Người gọi chỉ thấy lỗi chung chung.
  Căn cứ: Nhẹ vì không mất hay lộ dữ liệu, người gọi sửa tham số rồi gọi lại là xong, và API chưa có người dùng.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: known-limits

- **lastSeenTimestamp của tin ngắn hạn lệch ngày khi máy chủ không chạy giờ UTC (cột `date` bị đổi qua Date giờ địa phương)**
  Người dùng thấy gì: Ngày thấy tin lần cuối của tin thuê ngắn hạn có thể hiện lùi một ngày khi máy chủ chạy giờ Việt Nam. Người dùng có thể tưởng tin cũ hơn thực tế.
  Căn cứ: Nhẹ vì chỉ lệch một ngày ở trường phụ, không mất dữ liệu, và sửa sau không tốn nhiều.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: known-limits

- **bedroomsTotal rỗng thành bộ lọc bedrooms = 0, giá trị không phải số làm route lỗi 500**
  Người dùng thấy gì: Để trống số phòng ngủ thì API lặng lẽ chỉ trả tin 0 phòng ngủ, còn gõ sai thì báo lỗi máy chủ. Kết quả có thể trông như không có tin nào.
  Căn cứ: Nhẹ vì người gọi tự thấy kết quả lạ và gọi lại được, không mất hay lộ dữ liệu, và API chưa có người gọi.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi/tập có mặt trong khi lời hứa là quan hệ trước→sau): ca «cây thật» của PB5 rút danh sách bảng mong đợi từ chính schema.sql đang kiểm**
  Người dùng thấy gì: Bài kiểm lược đồ mẫu có thể không báo nếu lúc gộp tệp bị rơi mất một bảng cũ. Lỗi này sẽ chỉ lộ khi có người dựng DB từ lược đồ mẫu.
  Căn cứ: Nhẹ vì không ảnh hưởng người dùng cuối, chỉ làm bài kiểm yếu đi, và có thể bổ sung mốc độc lập sau.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): bản gốc hàng của listings và giaTot dựng bằng .replace nhưng không kiểm phép thay có xảy ra**
  Người dùng thấy gì: Một bài kiểm của app có thể báo xanh dù không so được với bản gốc. Việc chuyển hướng mã thị trường có thể hỏng mà không ai biết.
  Căn cứ: Nhẹ vì chỉ làm bài kiểm yếu đi, người dùng không bị ảnh hưởng ngay, và thuộc hàng khác nên xử lý ở hàng đó.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chỉ kiểm tập khoá có mặt trong khi lời hứa là giá trị khớp dòng cấy): priceRank ở nhánh hạng chỉ được so tập khoá**
  Người dùng thấy gì: Thông tin hạng giá của tin có thể sai giá trị mà bài kiểm vẫn không báo. Người dùng có thể thấy mức hạng giá không đúng.
  Căn cứ: Nhẹ đến vừa vì sai giá trị chỉ là trường phụ, không lộ dữ liệu, và bổ sung kiểm giá trị sau rất rẻ.
  file: `data-api/test/listing-reso.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/8 lỗi rơi vào file không bộ đo nào phủ (scripts/data-api-ten-nguon.test.mjs, app/tests/chuyen-huong-ma-thi-truong.itest.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
