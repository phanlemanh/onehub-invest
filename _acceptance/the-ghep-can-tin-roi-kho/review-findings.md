# Review findings: the-ghep-can-tin-roi-kho (round 1)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Itest RK-AC-9 (a) sẽ đỏ giả khi kho thật đã có thẻ máy rút mà tin quay lại**
  Người dùng thấy gì: Sau khi tính năng chạy thật, bài kiểm tra trên kho thật có thể báo đỏ nhầm dù hệ thống hoạt động đúng. Người dùng cuối không bị ảnh hưởng, chỉ người vận hành có thể mất công điều tra một cảnh báo giả.
  Căn cứ: Không mất hay lộ dữ liệu, chỉ gây báo động giả cho người chạy kiểm tra, và có thể sửa sau khi thấy nó xảy ra.
  file: `agent/tests/judge-roi-kho.itest.ts`
  severity: low
  Đề xuất: known-limits

- **Dòng «cặp needs_llm chưa có thẻ» đếm cả cặp rời kho mà máy cố ý không sinh thẻ**
  Người dùng thấy gì: Dòng tổng kết có thể luôn hiện một số khác 0 cho các cặp bị bỏ có chủ đích, nên người vận hành dễ tưởng còn cặp bị sót. Dữ liệu và thẻ duyệt không bị ảnh hưởng.
  Căn cứ: Chỉ là con số dễ gây hiểu lầm khi đọc, không ảnh hưởng dữ liệu hay người duyệt, và hợp đồng đã chủ động để lại như vậy.
  file: `agent/scripts/judge-run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): lượt 2 của RK-AC-9 nhánh (b) không có đối chứng đỏ và không ghim thông điệp**
  Người dùng thấy gì: Nếu sau này lượt chạy lại rút trùng thẻ, bài kiểm tra vẫn báo đỏ nhưng thông báo không nói rõ thẻ nào. Người dùng không bị ảnh hưởng, chỉ khó tìm lỗi hơn.
  Căn cứ: Chỉ làm chẩn đoán lỗi khó hơn trong tình huống hiếm, không gây mất dữ liệu, và công sửa không tương xứng.
  file: `agent/tests/judge-roi-kho.itest.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính một mình): bộ đếm lời gọi queryPair của RK-AC-6 không có đối chứng dương**
  Người dùng thấy gì: Một bài kiểm tra có thể xanh dù không thật sự chứng minh được là hệ thống tránh gọi bước chấm cho cặp rời kho. Người dùng không thấy hậu quả trực tiếp.
  Căn cứ: Các kiểm tra khác của cùng ca vẫn bắt được hành vi sai chính, nên rủi ro bỏ sót thấp và công thêm đối chứng không đáng.
  file: `agent/tests/judge-run.test.ts`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
