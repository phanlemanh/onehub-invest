# Review findings: data-api-tin-hien-thi (round 1)

## Trong hợp đồng

- **Hình dạng 3 (chỉ kiểm có mặt trong khi lời hứa là quan hệ): PB7-AC-5 không so thân 404 của tin ẩn với thân của khoá không có**
  file: data-api/test/tin-hien-thi.test.ts:150
  severity: medium
  AC: AC-5
  source: measurement
  detail: Hợp đồng AC-5 (contract.md dòng 45) và E5 hứa một quan hệ: chi tiết tin nguồn ẩn trả 404 «y như khoá không có» (thân y hình khoá không có). Test gọi `khong = goi('/v1/listings/pb7-…-khong-co')` nhưng chỉ dùng `khong.status !== 404`; với tin ẩn chỉ kiểm `r.status !== 404 || r.than.error?.code !== 'NOT_FOUND'`. Không có `assert.deepEqual(r.than, khong.than)` (hay so `vanBan`), nên route trả 404 NOT_FOUND kèm message hay trường khác cho tin ẩn (ví dụ «listing hidden», tức lộ chuyện tin có tồn tại) vẫn xanh. Phần quan hệ «không phân biệt được với khoá không có» không được đo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhánh thuê ngắn hạn của /v1/listings không đi qua SOURCE_HIDDEN, mã nguồn 'S01' viết tay**
  Người dùng thấy gì: Tin thuê ngắn hạn luôn được coi là của một nguồn tự thu. Nếu sau này có nguồn ngắn hạn nào bị ẩn thì tin của nó vẫn có thể hiện ra qua API công khai.
  Căn cứ: Hiện chỉ có một nguồn ngắn hạn và đo thực tế không có tin ẩn lọt ra, nên chưa ai bị ảnh hưởng; chỉ thành vấn đề khi thêm nguồn ngắn hạn mới.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: known-limits

- **bedroomsTotal không được kiểm ở biên, giá trị sai thành lỗi 500 lộ thông điệp Postgres**
  Người dùng thấy gì: Ai gọi API với số phòng ngủ không phải số sẽ nhận lỗi máy chủ kèm thông điệp nội bộ của cơ sở dữ liệu thay vì một thông báo gọn. Để trống thì API âm thầm chỉ trả căn 0 phòng ngủ.
  Căn cứ: Không làm mất hay lộ dữ liệu người dùng, người gọi tự sửa được bằng cách gửi lại đúng giá trị; nhưng thông điệp lỗi lộ chi tiết nội bộ trên API công khai nên nên sửa sớm và rẻ.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: new-contract

- **Khoá mới trong mappings.yaml đặt tên tiếng Việt (nguon_khong_hien_thi, can_cu)**
  Người dùng thấy gì: Chỉ là chuyện đặt tên trong tệp cấu hình nội bộ, người dùng không thấy gì và không bị ảnh hưởng.
  Căn cứ: Không có hậu quả với người dùng, đổi tên đụng nhiều tệp sinh nên tốn hơn lợi ích.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: wont-fix

- **chuoiNgay đi vòng qua String(Date) nên mất phần mili giây của onMarketTimestamp và lastSeenTimestamp**
  Người dùng thấy gì: Thời điểm đăng và thấy tin lần cuối trên API bị làm tròn xuống giây, hai mốc cách nhau dưới một giây hiện ra giống nhau.
  Căn cứ: Sai lệch dưới một giây gần như không ai nhận ra và không làm mất dữ liệu gốc.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: known-limits

- **Tham số rỗng `bedroomsTotal=` hay `minBelowMedianPct=` bị âm thầm đọc thành 0**
  Người dùng thấy gì: Gửi tham số để trống thì API hiểu thành số 0 thay vì bỏ qua, nên người dùng nhận danh sách rỗng hoặc lệch mà không biết vì sao.
  Căn cứ: Người dùng tự gỡ được bằng cách bỏ tham số, không mất dữ liệu, sửa rẻ cùng lúc với việc kiểm đầu vào.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: new-contract

- **Trang chi tiết đòi khoá bí mật cả với tin bán, thuê dài hạn trong khi trang danh sách không đòi**
  Người dùng thấy gì: Khi máy chủ thiếu cấu hình khoá, danh sách trả mã tin nhưng bấm vào xem chi tiết lại báo lỗi dịch vụ.
  Căn cứ: Chỉ xảy ra khi triển khai thiếu cấu hình, tự hết khi cấu hình đủ, không mất hay lộ dữ liệu.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ trước-sau bị thay bằng so tệp với chính nó): danh sách bảng/view mong đợi giờ lấy từ chính schema.sql đang kiểm**
  Người dùng thấy gì: Nếu việc gộp tệp lược đồ làm rơi mất một bảng thì bài kiểm vẫn báo xanh, nên lỗi thiếu bảng có thể chỉ lộ khi chạy thật.
  Căn cứ: Không ảnh hưởng người dùng ngay, nhưng làm yếu lưới an toàn khi dựng cơ sở dữ liệu, nên đáng gom vào một việc kiểm riêng.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2 (bộ chuyển viết tay theo đúng khuôn bên đọc): kiểm «khoá cũ giữ» trên đầu ra của veHinhCu, nên luôn có mặt**
  Người dùng thấy gì: Bài kiểm xác nhận các khoá cũ vẫn còn thực ra chỉ kiểm bộ chuyển trong chính test, nên nếu API đổi tên khoá thì phần này vẫn xanh.
  Căn cứ: Ràng buộc thật với API vẫn còn ở dòng so khoá mới, nên rủi ro thấp và không chạm dữ liệu người dùng.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
