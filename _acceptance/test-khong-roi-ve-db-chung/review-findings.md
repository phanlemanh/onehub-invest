## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): AC-1 hứa «mọi cách viết» tên DB oneinvest, RV-2 chỉ chạy một cách viết**
  AC: AC-1
  file: `pipeline/scripts/db-thu-chot.test.mjs:274`
  severity: medium
  source: measurement
  detail: Hợp đồng test-khong-roi-ve-db-chung AC-1 ghi «DATABASE_URL trỏ DB tên `oneinvest` (mọi cách viết), kể cả khi CI=true», và mục Coverage khai trục «tên `oneinvest` bốn cách viết». Nhưng RV-2 chỉ có hai env cho mỗi tệp: `CHET("oneinvest")` (một dạng duy nhất URL postgres tới host 127.0.0.1 cổng 9, DB `oneinvest`) và cùng URL ấy kèm CI=true. Không có dòng nào dùng postgresql://, ?sslmode, host 127.0.0.1/localhost hay URL thiếu mật khẩu cho hai tệp trong phạm vi. Số lần assert mỗi tệp là 2, trong khi lớp đã khai là 4 cách viết × 2 môi trường = 8. Ở mức hàm, CHOT-1..3 có phủ các cách viết, nhưng CHOT-3 chạy tệp S08 chứ không chạy hai tệp HT35. Vì vậy E1 vẫn xanh nếu một trong hai tệp tự chuẩn hoá URL theo cách khác trước khi gọi chotDbThu.
  rationale: AC-1 và mục Coverage hứa phủ mọi cách viết tên oneinvest cho hai tệp trong phạm vi, mà phép đo chỉ chạy một cách viết.

- **Hình dạng 3 (assert «có mặt» thay cho QUAN HỆ): AC-8 chỉ kiểm ô «Ô của HT35» không rỗng**
  AC: AC-8
  file: `scripts/kiem-ht35.mjs:84`
  severity: medium
  source: measurement
  detail: AC-8 hứa mỗi tệp có đúng một trong ba loại ô: trong phạm vi · ngoài phạm vi kèm vì sao · để lại cho HT36. bang-phu.md còn suy ô từ cột Ghi/Rào sẵn (Ghi=không → «ngoài phạm vi, vì chỉ đọc»; Ghi=có, chưa rào → «để lại cho HT36»). bangPhu() chỉ có `dong.filter((l) => !l.split("|")[6]?.trim())`, tức là đòi ô khác rỗng. Mấy trường hợp sau đều cho «PASS mọi dòng có ô»: ô ghi một chữ bất kỳ, ô «ngoài phạm vi» thiếu «vì …», hay một dòng Ghi=có, Rào trống lại ghi «ngoài phạm vi, vì chỉ đọc». Phép đo không so ô với bộ ba giá trị cho phép, cũng không so ô với các cột Ghi/Rào cùng dòng.
  rationale: AC-8 đòi mỗi tệp có đúng một trong ba loại ô hợp lệ, mà phép đo chỉ kiểm ô khác rỗng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe nap-db.test.mjs tự viết rào DB thử yếu hơn, không dùng chotDbThu sẵn có**
  Người dùng thấy gì: Một tệp kiểm thử phụ có thể chạm vào cơ sở dữ liệu chung nếu địa chỉ được viết theo cách lạ. Mọi thay đổi đều được hoàn tác ngay nên dữ liệu thật hầu như không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ vì thao tác luôn được hoàn tác và chỉ xảy ra khi chạy thử tay; sửa sau vẫn rẻ và nằm trong đợt rào các tệp còn lại.
  file: `_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo văn bản mã thay vì đầu ra): AC-3 can-gia-tot chỉ grep mã nguồn script đo ba vai**
  Người dùng thấy gì: Một ca kiểm thử chỉ đọc chữ trong mã chứ không chạy thử, nên có thể báo xanh dù hành vi thật đã hỏng. Giới hạn này đã được ghi rõ ở hồ sơ của nó.
  Căn cứ: Mức nhẹ, không ảnh hưởng dữ liệu hay người dùng, và đã được khai công khai nên chấp nhận như hiện tại.
  file: `scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.test.mjs, scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
