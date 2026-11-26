## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe C now depends on pipeline/do-hang-ngay.mjs, but E2's `paths` does not list that file**
  Người dùng thấy gì: Nếu tệp ghi dữ liệu hằng ngày đổi sau này, bằng chứng nghiệm thu của ca này có thể vẫn được coi là còn mới dù đã cũ. Người dùng cuối không bị ảnh hưởng, chỉ có người làm nghiệm thu bị.
  Căn cứ: Hậu quả nhẹ, chỉ làm bằng chứng có thể cũ mà không báo; không mất dữ liệu, sửa sau rẻ bằng cách thêm một dòng khai báo.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

- **process.exit(3) trong khối try bỏ qua finally nên tệp tạm còn lại, và npm test của pipeline sẽ chạy chúng**
  Người dùng thấy gì: Nếu bước kiểm đối chứng dừng giữa chừng, nó có thể để lại vài tệp thử trên máy người chạy. Những lần chạy bộ kiểm thử sau đó sẽ đỏ mà khó biết vì sao cho tới khi xoá các tệp này.
  Căn cứ: Chỉ xảy ra khi mẫu mã đã lệch, không ảnh hưởng dữ liệu hay người dùng cuối, và người chạy tự xoá được các tệp thừa; sửa sau rẻ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **paths của E2 thiếu pipeline/do-hang-ngay.mjs, tệp mà probe đột biến nay phụ thuộc**
  Người dùng thấy gì: Nếu tệp ghi dữ liệu hằng ngày đổi, bằng chứng của ca này không tự bị đánh dấu cũ để chạy lại. Người dùng cuối không thấy gì, chỉ người nghiệm thu có thể tin vào bằng chứng đã cũ.
  Căn cứ: Hậu quả nhẹ và chỉ ở khâu nghiệm thu nội bộ; không mất hay lộ dữ liệu, thêm một dòng khai báo là xong.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe đối chứng ghi tệp tạm khớp glob `scripts/*.test.mjs`, và lối thoát process.exit(3) trong try bỏ qua finally nên tệp tạm bị bỏ lại (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi chạy kiểm chứng, có thể có tệp tạm bị bỏ lại hoặc lẫn vào các lượt kiểm chạy song song, làm một lượt khác báo đỏ nhầm. Chỉ ảnh hưởng người chạy kiểm chứng, không ảnh hưởng người dùng sản phẩm.
  Căn cứ: Hậu quả nhẹ và chỉ gặp khi chạy kiểm chứng; xoá tệp thừa hoặc chạy lại là xong, không mất hay lộ dữ liệu, sửa sau cũng rẻ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lượt B so với origin/main nên sẽ tự đỏ sau khi nhánh này được gộp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi bản sửa được gộp, chạy lại bước kiểm chứng này sẽ báo đỏ dù không có gì hỏng. Người kiểm lại về sau có thể tưởng nhầm là có lỗi.
  Căn cứ: Chỉ gây báo đỏ giả khi chạy lại sau gộp, không ảnh hưởng người dùng hay dữ liệu; chỉ cần ghi chú là đủ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
