## Trong hợp đồng

- **E9 (s16_soat) đang đỏ: bộ soát tên nguồn thật bắt nhầm token đã có sẵn trên main ở dòng package.json bị sửa**
  AC: AC-9
  file: `pipeline/lib/s16-soat.test.mjs:115`
  severity: medium
  source: bugs
  detail: Chạy `node --test pipeline/lib/s16-soat.test.mjs` (đúng lệnh executor `s16_soat` của E9 trong _acceptance/config.yaml) trên máy này thì ca «DA33-AC-9 tệp hàng này thêm hay đổi không mang tên nguồn thật» FAIL, kết quả thật là `[["pipeline/package.json", 1]]`. Nguyên nhân: `dongLo` quét NGUYÊN dòng «+» của `git diff -U0`. Nhánh sửa dòng `"test": ...` của pipeline/package.json bằng cách nối thêm `'tests/import-s16.test.mjs'`, nên cả dòng hiện thành «+». Đã đối chiếu (không in giá trị): token trúng dài 12 ký tự, lấy từ source_registry, và đã có sẵn trong pipeline/package.json của origin/main. Đoạn mới thêm không chứa token. Như vậy mọi lần sửa một dòng có sẵn token đều làm thước đỏ giả, và E9 không xanh. Ở máy không có DB hay snapshot (CI), ca này `t.skip` nên không soát gì. Cách sửa: chỉ quét phần chữ mới thêm (so với dòng «-» tương ứng), hoặc loại các token đã có trong cùng tệp ở merge-base.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **import-s16 bỏ qua quy tắc tiêu thụ của DATA-CONTRACT: không kiểm sha256 của tệp, không kiểm schemaVersion**
  Người dùng thấy gì: Tệp thu về bị hỏng, bị chép thêm hoặc thuộc phiên bản chưa duyệt vẫn có thể được nạp vào dữ liệu mã căn của chủ đầu tư mà không ai biết.
  Căn cứ: Nguồn mã căn này được tin nhất nên dữ liệu sai sẽ lan vào danh bạ, nhưng việc thuộc làn thu và bước tích hợp riêng, sửa sau không đắt và chưa có dữ liệu thật bị nhiễm.
  file: `pipeline/import-s16.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5: tuyên quét cả lớp bảng cấm nhưng chỉ thử 2 trong 5 phần tử (đếm length thay cho ma trận)**
  Người dùng thấy gì: Phép thử chặn dữ liệu nhạy cảm rời máy chỉ kiểm hai trong năm bảng cấm, nên đổi nhầm tên một bảng còn lại có thể không bị phát hiện.
  Căn cứ: Đây là chỗ hở của phép thử chứ chưa phải lỗi chạy thật, không làm mất hay lộ dữ liệu ngay, và bổ sung ca thử sau rất rẻ.
  file: `pipeline/lib/s16-soat.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: soát token S16 trong thẻ chỉ có vế âm, không cấy token để thử bộ dò**
  Người dùng thấy gì: Phép kiểm thẻ duyệt không lộ mã căn có thể vẫn xanh dù bộ dò bị hỏng, vì chưa từng thử cho nó bắt một mã được cấy vào.
  Căn cứ: Không có dữ liệu nào bị mất hay lộ từ chỗ này, và bộ dò chính đã có ca thử riêng ở nơi khác nên rủi ro thấp, thêm ca dương sau là rẻ.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: dữ liệu soát là Map viết tay theo đúng khuôn soatDuLieu đọc, không lấy từ đường dựng data của syncOnce**
  Người dùng thấy gì: Chưa có phép thử nào chứng minh bước chặn mã nhạy cảm thật sự chạy trước khi gửi lên cloud, nên nếu ai lỡ gỡ bước đó thì kiểm thử vẫn xanh.
  Căn cứ: Hậu quả nặng nếu xảy ra vì dữ liệu nhạy cảm có thể lên cloud, nhưng hiện chưa thấy bước chặn bị gỡ; người dùng không tự gỡ được nếu đã lộ, nên nên ghi rõ giới hạn và bổ sung phép thử đầu-cuối sớm.
  file: `pipeline/lib/s16-soat.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture stg S16 cho AC-4…AC-8 chèn tay theo khuôn bộ dựng đọc, không qua dongS16/napS16**
  Người dùng thấy gì: Các phép thử dựng toà và căn chạy trên dữ liệu dựng tay, chưa đi qua đường ghi thật của pha một, nên chưa được chứng minh cho riêng khuôn đó.
  Căn cứ: Dữ liệu thật vẫn được đo riêng ở bước dữ liệu thật, không có gì mất hay lộ, và dựng lại sau dễ nên chỉ cần ghi là giới hạn đã biết.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: kiểm «url không còn host» chỉ có vế âm, không ca dương nào chứng regex bắt được**
  Người dùng thấy gì: Phép kiểm đường dẫn đã bỏ tên miền gốc có thể vẫn xanh dù bộ dò viết sai, vì chưa có ca chứng minh nó bắt được tên miền còn sót.
  Căn cứ: Hậu quả nhẹ vì chỉ là một phép kiểm phụ, tên miền còn sót sẽ bị bộ soát tên nguồn khác chặn trước khi rời máy, nên không đáng mở việc sửa.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
