# Review findings: db-thu-tach-khoi-cum-that (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC ở vòng này)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Real runs count test containers toward the cap of 2, despite the comment saying the prefixes are kept separate**
  Người dùng thấy gì: Khi bộ test của chính công cụ này đang chạy cùng lúc, lượt chấm thật có thể phải chờ chỗ, tối đa 15 phút rồi báo lỗi.
  Căn cứ: Chỉ xảy ra khi hai việc chồng giờ, lượt chấm chạy lại được, không mất dữ liệu.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **The text still says 30 cases while ci-bo-qua.json now lists 34 pipeline cases**
  Người dùng thấy gì: Vài chỗ ghi chú còn nói 30 ca trong khi thực tế là 34, người đọc nhật ký chấm có thể so nhầm con số.
  Căn cứ: Chỉ là ghi chú lệch số, không ảnh hưởng kết quả chấm và sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hardcoded absolute path to the main checkout, unlike the git-common-dir pattern used elsewhere in the same diff**
  Người dùng thấy gì: Lệnh đo phút giữ khoá chỉ chạy đúng mặc định trên máy này, và tên người dùng máy lộ trong mã công khai.
  Căn cứ: Nhẹ: chạy được khi chỉ đường dẫn thủ công, chỉ lộ tên tài khoản máy chứ không lộ khoá hay dữ liệu.
  file: `scripts/do-phut-s4.mjs`
  severity: low
  Đề xuất: known-limits

- **Trần 2 cụm của --chay-trong đếm cả container của test (tiền tố dài hơn), mà lượt thật không bao giờ dọn chúng: container test mồ côi làm mọi lượt chấm chờ 900s rồi thoát 4**
  Người dùng thấy gì: Nếu bộ test của công cụ bị ngắt giữa chừng và để sót hai container, mọi lượt chấm sau đó chờ 15 phút rồi đỏ mà không nêu đúng nguyên nhân.
  Căn cứ: Hiếm gặp và người vận hành tự xoá container sót được, nhưng khi gặp sẽ mất thời gian tìm nguyên nhân.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Dòng «ca dữ liệu thật» báo lần xanh cũ mà không nhắc các lần ĐỎ mới hơn trong sổ**
  Người dùng thấy gì: Nếu soát dữ liệu thật hằng ngày đỏ nhiều ngày liền, báo cáo chấm vẫn chỉ nói lần xanh cũ, người ký có thể tưởng dữ liệu thật vẫn ổn.
  Căn cứ: Che mất một lỗi thật khiến người ký tin sai, nhưng không mất dữ liệu và sửa là việc nhỏ.
  file: `scripts/suite-neu-doi.mjs`
  severity: medium
  Đề xuất: new-contract

- **Khoá --chay-trong còn lại mà không có tệp pid thì không bao giờ được gỡ: mọi lượt sau thoát 4**
  Người dùng thấy gì: Hiếm khi, nếu lượt chấm bị tắt đúng một khoảnh khắc, mọi lượt sau bị kẹt cho tới khi có người xoá tay một thư mục khoá.
  Căn cứ: Xác suất rất thấp, không mất dữ liệu và xoá một thư mục là hết kẹt.
  file: `db/db-thu.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): phần chay-nua.mjs của E2c chỉ grep mã nguồn**
  Người dùng thấy gì: Một ca kiểm chỉ đọc chữ trong mã chứ không chạy thật, nên có thể báo xanh dù cách chia hai nửa suite bị sai.
  Căn cứ: Lượt chạy dài thật vẫn bắt được lỗi này nên rủi ro thấp, và gia cố ca test là việc tách riêng.
  file: `scripts/pipeline-that.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (kiểm chuỗi có mặt trong khi lời hứa là quan hệ): «DB trống có bảng của migration cuối» chỉ kiểm sale_offers và số bảng > 50**
  Người dùng thấy gì: Ca kiểm có thể không phát hiện nếu cụm dùng một lần dừng ở một migration giữa chừng.
  Căn cứ: Công cụ dựng DB đã chạy hết migration qua đường CI nên rủi ro thấp, chỉ là kiểm chưa chặt.
  file: `scripts/db-thu-trong.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
