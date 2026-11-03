## Trong hợp đồng

- **Hình dạng 3 — lý do đỏ chỉ là «chuỗi có mặt», trong khi E4 hứa đúng tập đã đo: cột mới hoặc view mới lọt qua**
  AC: AC-4
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs:26`
  severity: high
  source: measurement
  detail: E4 hứa «mỗi ca đỏ mang đúng lý do đã đo», tức quan hệ bằng với giá trị đã đo. Hai regex không neo nên chỉ kiểm phần đầu có mặt. Dòng 26: `/có stories, frontage_length/` khớp đoạn đầu của thông điệp `DT-AC-8 ... — có ${loCloud.join(", ")}` (do-dac-trung-s06.mjs:156). loCloud lọc CLOUD_ALLOW theo BAY, nên thêm `street_number` hay `latitude` vào CLOUD_ALLOW sau frontage_length (sync-cloud.mjs:101) cho «có stories, frontage_length, street_number». Regex vẫn khớp, xetBo báo đạt, dù đó là cột mới lên cloud ngoài hai cột đã mở có chủ ý (contract, Out of scope). Dòng 30: `/\+\s+'sellers'/` chỉ đòi một dòng diff của deepEqual(viewPhuThuoc, PHU_THUOC_CHO_PHEP) (nap-lai-db.itest.mjs:94). Thêm một view phụ thuộc trực tiếp vào bảng bản ghi sẽ thêm dòng `+ 'view_moi'`, ca vẫn đỏ đúng tên và vẫn được coi là đúng lý do. Số ca xanh không đổi vì đó vẫn là ca đã đỏ, nên mức sàn không bắt được. tuKiem «đỏ lý do khác» (dòng 69) chỉ thử log thiếu hẳn chuỗi, không thử log có chuỗi cộng phần lạ.

- **Hình dạng 3 — lý do không gắn với ca đỏ: regex quét cả nhật ký, và `ca` là tiền tố khớp nhiều ca**
  AC: AC-4
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs:51`
  severity: medium
  source: measurement
  detail: Dòng 51 `san.ly_do.test(`${t}\n${log}`)` kiểm lý do trên toàn bộ nhật ký của bộ, không trên phần lỗi của ca t. Vì vậy quan hệ ca ↔ lý do trong E4 không được đo. Thêm vào đó, `ca: /^ND-AC-1 /` (dòng 30) khớp ba ca và `ca: /^PD-AC-8 /` (dòng 31) khớp bốn ca, trong khi lần đo chỉ có một ca đỏ ở mỗi bộ (ND-AC-1 áp 044; PD-AC-8 cắt chuyển). Ví dụ «PD-AC-8 cổng resolve» đỏ vì lỗi mới, cùng lúc «PD-AC-8 cắt chuyển» còn đỏ với «cắt chuyển lệch»: cả hai đều qua nhánh lý do. Hiện chỉ mức sàn xanh (15/16, 12/13) chặn gián tiếp, và sàn là cận dưới nên thêm một ca xanh mới sẽ che mất. tuKiem không có ca lý do nằm ở ca khác.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lỗi hạ tầng trong khối try của probe gọi process.exit, bỏ qua finally nên DB thử không được xoá**
  Người dùng thấy gì: Nếu phép đo gặp lỗi hạ tầng giữa chừng, một bản chép thử của cơ sở dữ liệu (có cả số điện thoại người bán) có thể nằm lại trên máy dev thay vì bị xoá. Không ảnh hưởng dữ liệu thật và không ảnh hưởng người dùng cuối.
  Căn cứ: Hậu quả nhẹ: chỉ là bản chép thừa trên máy nội bộ, dữ liệu thật không đổi, lần đo sau tự dọn, và người vận hành có thể tự xoá tay bất cứ lúc nào.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hạ tầng lỗi khi áp 070/068 thì DB thử không được xoá, và kết quả lệnh xoá không được kiểm**
  Người dùng thấy gì: Khi phép đo lỗi giữa chừng hoặc lệnh xoá hỏng, bản chép thử vẫn nằm lại trên máy dev mà phép đo vẫn báo đạt. Người dùng cuối không thấy gì khác.
  Căn cứ: Hậu quả nhẹ và tự gỡ được: dữ liệu thật không bị đụng, bản chép thừa chỉ nằm trên máy nội bộ và bị ghi đè ở lần đo sau.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **E4 ghi đo trên bản chép đã áp 068, nhưng các bộ qua napPhatBieu chạy với hàm phân xử đã mất phần của 068 mà probe không báo**
  Người dùng thấy gì: Bằng chứng đo chỉ chứng minh lỗi hỏng view đã sửa, chưa chứng minh được việc ghép số điện thoại người bán chạy đúng khi áp cả hai migration. Cần ghi rõ để không đọc nhầm là đã kiểm tổ hợp đó trước khi áp lên máy thu.
  Căn cứ: Không làm mất hay lộ dữ liệu và production không bị ảnh hưởng; chỉ cần ghi rõ giới hạn của bằng chứng, hoặc kiểm tổ hợp này riêng khi áp lên máy thu.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — bí danh viết tay đúng khuôn SQL_N3: vế bí danh chưa từng đọc dòng do dungNguoi ghi**
  Người dùng thấy gì: Bài kiểm tra dùng bí danh số điện thoại viết tay thay vì do bộ dựng danh bạ tạo ra, nên nếu hai bên lệch khuôn thì cảnh báo đỏ giả ở số ghép có thể quay lại mà kiểm tra vẫn xanh.
  Căn cứ: Chỉ có thể gây cảnh báo đỏ giả trên màn kiểm nội bộ, không mất hay lộ dữ liệu, và khả năng xảy ra thấp trừ khi cách ghi bí danh bị đổi sau này.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng của bộ phán chỉ đếm số vi phạm, không ghim thông điệp như E5 khai**
  Người dùng thấy gì: Các ca tự thử của bộ phán chỉ kiểm đúng số lỗi, không kiểm đúng nội dung lỗi, nên một nhánh báo lỗi khác bắn thay vẫn qua. Bộ phán có thể kém nhạy hơn lời mô tả.
  Căn cứ: Chỉ làm công cụ kiểm nội bộ kém chặt hơn khai báo, không ảnh hưởng dữ liệu hay người dùng, và siết lại sau này rẻ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — kiểm kết nối DB bằng grep mã nguồn, không đo bộ đã thật sự chạy trên DB thử**
  Người dùng thấy gì: Phép kiểm chỉ xác nhận mã nguồn có dòng đọc địa chỉ cơ sở dữ liệu thử, chưa chứng minh từng bộ test thật sự chạy trên bản chép thử chứ không chạm cơ sở dữ liệu thật.
  Căn cứ: Đây là kiểm tra an toàn phụ, các bộ test chỉ đọc hoặc chạy trên bản chép, và nếu sai thì lộ ra ở lần đo kế tiếp mà không mất dữ liệu.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — vế «không đổi migration có từ trước» của E5 âm tính một mình, không đối chứng dương**
  Người dùng thấy gì: Phép kiểm xác nhận không có migration cũ bị sửa chưa được thử với một tệp bị sửa thật, nên nếu bộ lọc sai thì nó vẫn báo sạch.
  Căn cứ: Hậu quả nhẹ: các migration đã commit còn có hook chặn sửa riêng, nên rủi ro thật rất thấp và không mất dữ liệu.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
