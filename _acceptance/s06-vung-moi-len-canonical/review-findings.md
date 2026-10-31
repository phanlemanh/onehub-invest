# Review findings: s06-vung-moi-len-canonical (vòng 2)

Review đầy đủ: không có finder nào chết, không có cảnh báo review incomplete.

## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra) kèm hình dạng 3: nửa transform-chotot của ca quan hệ AC-3 chỉ grep mã nguồn**
  file:line: `pipeline/lib/thi-truong.test.mjs:75`
  severity: medium
  AC: AC-3
  source: measurement
  detail: E3 hứa một ca quan hệ: «thêm khoá giả vào bản chép module → tập thành phố mà HAI bước tính ra có khoá đó». Ca này chỉ được đo bằng hành vi cho reassign-areas (test ở dòng 60-73: chép module, thêm thugia, import MARKETS). Với transform-chotot, dòng 75-79 chỉ có `assert.match(t, /docThiTruongCoPhuong\(client\)/)` và `assert.match(t, /thiTruongCua\(ad\.city_code/)` chạy trên văn bản tệp. Hai assert này xác nhận có hai chuỗi lời gọi, không chạy transform với module có khoá giả, và không kiểm rằng một tin mang city_code của khoá giả được ánh xạ ra mã thị trường giả. Ví dụ: kết quả thiTruongCua bị bỏ qua hay bị ghi đè sau đó, mà wardMap vẫn tra theo ad.city_code, thì test vẫn xanh. Phần «transform nhận khoá đó mà không sửa tệp» của AC-3 vì thế chưa được đo bằng đầu ra.
  rationale: AC-3 đòi thêm một khoá vào module thì cả reassign-areas và transform-chotot nhận khoá đó; nửa transform-chotot chưa được chứng minh bằng đầu ra, chỉ bằng văn bản mã.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **064 đổi khoá areas nhưng bỏ sót collection_units.market_codes: 38 đơn vị S02 sẽ trỏ mã thị trường không còn tồn tại**
  Người dùng thấy gì: Sau khi áp đợt đổi mã thị trường, 38 đơn vị thu S02 vẫn giữ mã cũ nên bảng nguồn ở /ops/sources mất tên thị trường, và admin không lưu được khi sửa các đơn vị đó.
  Căn cứ: Lỗi nặng vì chặn thao tác của admin và làm sai hiển thị đúng ở màn vận hành, không tự lành; nhưng chưa mất dữ liệu và sửa trước khi áp lên máy thu thì rẻ.
  file: `db/migrations/064_ma_thi_truong_ngan.sql`
  severity: high
  Đề xuất: new-contract

- **dem-ma-dai (cổng chặn trước khi áp 064) không quét cột mảng nên vẫn báo «sạch» khi collection_units còn mã dài**
  Người dùng thấy gì: Lệnh kiểm tra trước khi áp đợt đổi mã có thể báo «sạch» trong khi vẫn còn 38 đơn vị thu trỏ mã cũ, nên người vận hành tưởng an toàn mà thực ra chưa.
  Căn cứ: Rào chặn báo an toàn giả làm người ký yên tâm sai, nhưng chỉ có hậu quả khi áp lên máy thu và đi cùng lỗi bỏ sót của bước đổi mã, nên sửa chung một việc.
  file: `scripts/s06-vung-moi/dem-ma-dai.mjs`
  severity: medium
  Đề xuất: new-contract

- **dem-ma-dai --cloud đọc ~/.oneinvest/cloud.env vô điều kiện nên nhánh lấy SUPABASE_MGMT_TOKEN từ biến môi trường không bao giờ chạy**
  Người dùng thấy gì: Chạy lệnh đếm trên cloud từ một máy không có tệp cấu hình riêng sẽ báo lỗi dù đã đặt sẵn khoá truy cập; phải chạy trên máy có tệp đó.
  Căn cứ: Chỉ gây vướng khi chạy lệnh, không sai dữ liệu, người chạy đổi sang máy có tệp cấu hình là xong.
  file: `scripts/s06-vung-moi/dem-ma-dai.mjs`
  severity: low
  Đề xuất: known-limits

- **Migration 064 bỏ sót collection_units.market_codes: 38 đơn vị S02 còn trỏ mã dài sau khi đổi khoá, và mọi lần sửa đơn vị đó sẽ lỗi**
  Người dùng thấy gì: Sau đợt đổi mã thị trường, admin sẽ gặp lỗi khi lưu bất kỳ chỉnh sửa nào trên 38 đơn vị thu S02, và cột thị trường hiện mã thô thay vì tên.
  Căn cứ: Chặn thao tác thật của admin và không tự khỏi, nhưng không mất dữ liệu; sửa trước khi áp lên máy thu thì rẻ, sau khi áp thì phải vá riêng.
  file: `db/migrations/064_ma_thi_truong_ngan.sql`
  severity: high
  Đề xuất: new-contract

- **dem-ma-dai báo «sạch» trong khi collection_units.market_codes còn 38 dòng mã dài, vì chỉ quét cột text tên area_id/market_id**
  Người dùng thấy gì: Bước kiểm tra chặn trước khi áp đợt đổi mã vẫn báo an toàn dù 38 đơn vị thu còn trỏ mã cũ, nên có thể áp nhầm lúc chưa sẵn sàng.
  Căn cứ: Báo an toàn giả có thể dẫn tới áp sớm, nhưng hậu quả giống lỗi của bước đổi mã và sửa chung một việc với nó.
  file: `scripts/s06-vung-moi/dem-ma-dai.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc, không đi vòng qua bên ghi): snapshot S04 giả của AC-4/AC-5/AC-6**
  Người dùng thấy gì: Các ca thử phường dùng dữ liệu giả có khuôn hơi khác bản ghi thật hiện hành, nên nếu bộ thu đổi khuôn thì ca thử vẫn xanh dù nạp phường có thể hỏng.
  Căn cứ: Rủi ro chỉ ở khâu kiểm thử và đã có phép đo bằng ranh giới thật ở bước dữ liệu thật; nếu hỏng sẽ lộ khi chạy thật và chạy lại được.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
