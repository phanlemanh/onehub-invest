# Review findings: pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích lược đồ ci-bo-qua.json chưa thêm khoá may_thu**
  Người dùng thấy gì: Phần ghi chú mô tả danh sách ca bỏ qua chưa nhắc tới khoá mới, nên người đọc sau có thể không biết khoá ấy có và có nghĩa gì. Chạy thật không bị ảnh hưởng.
  Căn cứ: Chỉ là thiếu ghi chú, không sai kết quả chạy nào, và sửa lúc nào cũng rẻ.
  file: `scripts/lib/ci-can-du-lieu.mjs`
  severity: low
  Đề xuất: known-limits

- **E6 không chứng minh được máy chấm là máy thu: máy thiếu tệp vai cũng đạt**
  Người dùng thấy gì: Phép kiểm báo đạt cả trên máy không có tệp cấu hình vai, nên nó chưa chứng minh được đang chạy đúng trên Mac mini. Lượt soát hằng ngày vẫn chạy đủ ca.
  Căn cứ: Không làm mất dữ liệu và không đổi cách chạy thật; chỉ làm bằng chứng yếu hơn mức mong muốn.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **E6 (ht33_may_thu) báo xanh trên mọi máy thiếu tệp hai-may.env, nên không chứng minh được máy chấm là máy thu**
  Người dùng thấy gì: Một máy lạ hoặc máy mất tệp cấu hình cũng được báo là máy thu trong lượt chấm. Hệ quả là bằng chứng nghiệm thu kém chắc, nhưng người dùng không thấy khác biệt khi dùng.
  Căn cứ: Rủi ro chỉ ở độ tin của bằng chứng, người ký có thể tự kiểm máy chấm; sửa sau không tốn kém.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **chay-that: nếu mọi mục bị lọc may_thu thì tập chạy rỗng, node --test tự quét chạy toàn bộ test trong pipeline/**
  Người dùng thấy gì: Nếu sau này mọi ca đều đánh dấu chỉ máy thu, máy phát triển sẽ chạy cả bộ test thay vì dừng lại. Hiện chưa xảy ra.
  Căn cứ: Chưa có tình huống thật dẫn tới, kết quả chỉ là chạy nhiều hơn chứ không mất dữ liệu, và dễ sửa khi cần.
  file: `pipeline/chay-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: E5 chỉ đòi «không có CI=true», không đòi dòng CI= có mặt**
  Người dùng thấy gì: Phép kiểm hồ sơ chạy trên M5 có thể bỏ lọt một hồ sơ thiếu dòng về môi trường. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm hồ sơ nghiệm thu lỏng hơn một chút; người ký vẫn đọc được hồ sơ, sửa sau rẻ.
  file: `_acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — chiều đỏ của kiem-m5.sh không ghim thông điệp dù lời hứa là «gọi tên thứ đó»**
  Người dùng thấy gì: Khi hồ sơ M5 sai, công cụ kiểm có báo đỏ nhưng chưa chắc ghi rõ sai ở đâu. Chỉ ảnh hưởng người soát nội bộ.
  Căn cứ: Hậu quả nhẹ, chỉ khó đọc lỗi hơn; không mất dữ liệu và sửa sau không đắt.
  file: `_acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — HT33-AC-4: chay-that thoát 2 nhưng không ghim stderr, không đối chứng dương cho chay-that**
  Người dùng thấy gì: Bài test có thể không phân biệt được lý do chạy dừng, nên có khả năng bỏ lọt một lỗi khác cũng làm dừng. Người dùng không thấy khác biệt.
  Căn cứ: Chỉ làm test kém chặt, không ảnh hưởng dữ liệu hay cách chạy; bổ sung sau rẻ.
  file: `scripts/vai-may.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

⚠ Cụm ngoài vùng phủ: 4/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
