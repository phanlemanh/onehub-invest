# Review findings: man-gan-nhan-mu (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chưa tách xong dữ liệu thử theo tag: post thử của mu.mjs vẫn nằm trong nhóm mà mau.mjs và seed.mjs lấy mẫu**
  Người dùng thấy gì: Màn gắn nhãn và việc lấy mẫu vẫn chạy đúng cho người dùng. Chỉ có bộ kiểm nghiệm thu đôi khi báo lỗi giả nếu hai phép đo chạy cùng lúc, nên người kiểm có thể phải chạy lại.
  Căn cứ: Không ảnh hưởng người dùng thật và không mất hay lộ dữ liệu; chỉ có thể làm bộ kiểm báo đỏ giả, chạy lại tuần tự là qua, nên ghi rõ giới hạn là đủ.
  file: `_acceptance/man-gan-nhan-mu/probes/mu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tách dữ liệu thử theo tag chưa đủ: post của mu.mjs vẫn lọt vào mẫu của mau.mjs khi hai phép đo chạy song song**
  Người dùng thấy gì: Người dùng gắn nhãn không bị ảnh hưởng. Chỉ có bộ kiểm nghiệm thu có thể báo thiếu mẫu hoặc lệch số liệu giả khi hai phép đo chạy cùng lúc.
  Căn cứ: Hậu quả chỉ là kết quả kiểm giả trong lúc nghiệm thu, không đụng dữ liệu thật; chạy lần lượt từng phép đo là tự khắc phục được, nên ghi lại giới hạn và giữ nguyên.
  file: `_acceptance/man-gan-nhan-mu/probes/mu.mjs`
  severity: medium
  Đề xuất: known-limits

- **POST /api/v1/ops/labels không kiểm `unit` của giá: đơn vị lạ bị coi là «triệu», ghi sai giá mà không báo lỗi (r1)**
  Người dùng thấy gì: Nếu có công cụ ngoài màn hình gửi đơn vị giá viết lạ (ví dụ «tỷ» có dấu), giá sẽ bị lưu thấp hơn 1000 lần mà không có cảnh báo. Biểu mẫu trên màn chỉ gửi hai đơn vị chuẩn nên người gắn nhãn bình thường không gặp.
  Căn cứ: Chỉ xảy ra khi gọi thẳng vào cổng ghi bằng đơn vị ngoài danh sách, người dùng trên màn không chạm tới; nhưng nhãn sai sẽ lẫn vào tập đối chiếu mà không ai biết, nên cần ghi rõ là hạn chế đã biết.
  file: `app/src/lib/labels-normalize.ts`
  severity: medium
  Đề xuất: known-limits

- **Body POST có `value` không phải chuỗi làm route ném TypeError và trả 500, không phải 400 nêu trường (r1)**
  Người dùng thấy gì: Nếu một lượt gửi nhãn có ô mang kiểu dữ liệu sai (số thay vì chữ), hệ thống báo lỗi chung chứ không chỉ ra ô nào sai, và không lưu gì. Màn gắn nhãn bình thường luôn gửi đúng kiểu nên người dùng không gặp.
  Căn cứ: Không mất và không lưu sai dữ liệu, chỉ thông báo lỗi kém rõ khi gọi trực tiếp; người dùng trên màn không gặp nên nhẹ.
  file: `app/src/lib/labels-normalize.ts`
  severity: low
  Đề xuất: known-limits

- **LabelForm.luu has no catch: a network or fetch error is swallowed with no toast (r1)**
  Người dùng thấy gì: Khi mất mạng hoặc máy chủ khởi động lại đúng lúc bấm lưu, người gắn nhãn không thấy thông báo nào và có thể tưởng nhãn đã được lưu. Chữ đã gõ vẫn còn trên màn nên bấm lưu lại được.
  Căn cứ: Không mất dữ liệu đã gõ và người dùng tự thử lại được, nhưng có thể bỏ sót một tin chưa lưu nếu không để ý; sửa rất rẻ nên nên làm sớm.
  file: `app/src/components/ops/labels/label-form.tsx`
  severity: medium
  Đề xuất: known-limits

- **label-sample re-run after a short sample can push the slice past n and mix double_label/split assignments from two different picks (r1)**
  Người dùng thấy gì: Nếu lần lấy mẫu đầu thiếu tin rồi sau đó có thêm tin mới và chạy lại, lát có thể vượt số tin đã định, và tỉ lệ gắn trùng 20% cùng cách chia hai nửa có thể lệch. Số đo đồng thuận vẫn tính được nhưng không còn đúng cơ cấu đã hứa.
  Căn cứ: Chỉ gặp khi lát lấy thiếu rồi chạy bổ sung; nhãn không mất và có thể tránh bằng cách tạo lát mới, nhưng cơ cấu mẫu lệch có thể làm sai lệch kết luận đồng thuận.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **Prices with '.' are always read as a decimal point: '4.350 triệu' is saved as 4.35 triệu (1000x too small) with no error (r1)**
  Người dùng thấy gì: Nếu người gắn nhãn gõ giá kiểu Việt có dấu chấm ngăn nghìn (ví dụ «4.350 triệu»), hệ thống hiểu thành 4,35 triệu và lưu thấp hơn 1000 lần mà không báo lỗi. Nhãn sai này có thể thành đáp án chuẩn nếu chỉ một người gắn tin đó.
  Căn cứ: Dễ gặp vì người Việt quen gõ dấu chấm ngăn nghìn và sai lặng lẽ vào tập đối chiếu; người dùng không tự phát hiện được, nhưng có thể tránh bằng hướng dẫn gõ dấu phẩy tạm thời.
  file: `app/src/lib/labels-normalize.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên «ma trận viết trước 2 người × các loại tin» nhưng test chỉ có vài điểm-case (r1)**
  Người dùng thấy gì: Bài kiểm tra việc chia tin cho hai người gắn chưa thử hết các tổ hợp đã hứa, nên một lỗi chia tin ở tổ hợp chưa thử có thể lọt qua mà không bị phát hiện. Chưa có bằng chứng người dùng đang nhận trùng tin.
  Căn cứ: Không làm hỏng chức năng hiện tại, chỉ làm giảm độ chắc chắn khi sửa mã sau này; có thể bổ sung ca kiểm sau mà không ảnh hưởng người dùng.
  file: `app/tests/labels.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — trạng thái lỗi của E10 được đo bằng cách grep mã nguồn page.tsx, không render đầu ra (r1)**
  Người dùng thấy gì: Việc trang hiện thông báo lỗi kèm nút «Thử lại» mới được kiểm bằng cách đọc mã chứ chưa dựng thử khi truy vấn hỏng. Nếu mã đổi, lỗi có thể không còn hiện đúng mà bài kiểm vẫn xanh.
  Căn cứ: Hiện chưa thấy lỗi thật với người dùng, chỉ là phép kiểm yếu; hậu quả nhẹ và người dùng tải lại trang là xử lý được.
  file: `app/tests/labels.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — «không lên cloud» chỉ là một assertion âm tính bằng regex trên mã nguồn, không có đối chứng dương (r1)**
  Người dùng thấy gì: Việc kiểm nhãn không bị đồng bộ lên cloud dựa vào tìm chữ trong mã, nên nếu cách chọn bảng đồng bộ đổi thì bài kiểm có thể không bắt được. Hiện nhãn vẫn chỉ nằm ở máy thu.
  Căn cứ: Hiện chưa lộ dữ liệu nào, rủi ro chỉ xuất hiện nếu mã đồng bộ đổi lớn sau này, và sẽ bị các lớp rà soát khác bắt; chi phí sửa lớn hơn hậu quả.
  file: `_acceptance/man-gan-nhan-mu/probes/migration.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
