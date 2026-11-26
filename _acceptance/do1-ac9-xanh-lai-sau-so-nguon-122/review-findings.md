# Review findings: do1-ac9-xanh-lai-sau-so-nguon-122 (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **s4-args.json mới sinh lại khai round 2 trong khi vòng 2 đã chấm xong (BLOCKED); lượt kế sẽ ghi đè lẫn số vòng**
  Người dùng thấy gì: Lượt chấm kế tiếp có thể ghi số vòng 2 lần nữa, làm sổ chấm lẫn kết quả của hai vòng khác nhau. Người đọc sổ phải tự phân biệt vòng nào là vòng nào. Việc sửa ca kiểm thử của sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ làm rối sổ ghi chép của quy trình nghiệm thu, không mất dữ liệu và không ảnh hưởng người dùng cuối; chỉ cần đổi số vòng trước khi chấm lại là xong, rất rẻ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/s4-args.json`
  severity: medium
  Đề xuất: known-limits

- **E5 đòi pipeline_that `fail 0` toàn suite nhưng chính lượt chạy lại trên M5 đã đỏ 1 ca ngoài phạm vi (ON22-AC-10), nên E5 chắc chắn REJECT trên máy chấm đó**
  Người dùng thấy gì: Nếu chấm lại trên máy M5, phép kiểm toàn bộ bộ test sẽ đỏ vì một ca không liên quan, nên kết luận có thể là từ chối oan dù bản sửa đúng. Người dùng không thấy gì khác, chỉ là việc nghiệm thu bị chậm hoặc phải chạy trên máy khác.
  Căn cứ: Hậu quả chỉ là kết luận nghiệm thu sai tạm thời trên một máy, tự khắc phục bằng cách chấm trên máy có đủ cấu hình; không ảnh hưởng dữ liệu hay người dùng cuối.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Probe đối chứng ghi tệp tạm khớp glob `scripts/*.test.mjs`, và lối thoát process.exit(3) trong try bỏ qua finally nên tệp tạm bị bỏ lại (r1)**
  Người dùng thấy gì: Khi chạy kiểm chứng, có thể có tệp tạm bị bỏ lại hoặc lẫn vào các lượt kiểm chạy song song, làm một lượt khác báo đỏ nhầm. Chỉ ảnh hưởng người chạy kiểm chứng, không ảnh hưởng người dùng sản phẩm.
  Căn cứ: Hậu quả nhẹ và chỉ gặp khi chạy kiểm chứng; xoá tệp thừa hoặc chạy lại là xong, không mất hay lộ dữ liệu, sửa sau cũng rẻ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lượt B so với origin/main nên sẽ tự đỏ sau khi nhánh này được gộp (r1)**
  Người dùng thấy gì: Sau khi bản sửa được gộp, chạy lại bước kiểm chứng này sẽ báo đỏ dù không có gì hỏng. Người kiểm lại về sau có thể tưởng nhầm là có lỗi.
  Căn cứ: Chỉ gây báo đỏ giả khi chạy lại sau gộp, không ảnh hưởng người dùng hay dữ liệu; chỉ cần ghi chú là đủ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

⚠ Cụm ngoài vùng phủ: 2/2 lỗi rơi vào file không bộ đo nào phủ (_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/s4-args.json, _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

