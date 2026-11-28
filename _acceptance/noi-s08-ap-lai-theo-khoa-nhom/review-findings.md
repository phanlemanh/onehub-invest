# Review findings: noi-s08-ap-lai-theo-khoa-nhom

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe bat-bien-that chép lại câu SQL của docLink thay vì dùng hàm của lệnh luật**
  Người dùng thấy gì: Phép kiểm tự động dựng bảng nhóm bằng một bản chép riêng. Nếu sau này cách lọc thật đổi, phép kiểm có thể so sai mà vẫn báo xanh. Người dùng chưa bị ảnh hưởng gì ở hiện tại.
  Căn cứ: Hôm nay hai bản cho cùng kết quả nên không ai thấy lỗi, và chỉ thành vấn đề khi có người đổi luật sau này; sửa lúc đó vẫn rẻ.
  file: `_acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe AC-4 chọn mẫu không kiểm nhóm chỉ có một nút S08 hay tên đã có hậu tố _TT, nên có thể FAIL giả**
  Người dùng thấy gì: Khi dữ liệu thay đổi, phép kiểm áp lần hai có thể báo hỏng dù luật vẫn đúng, gây mất thời gian tra lỗi. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây báo động giả cho người kiểm chứ không làm sai hay mất dữ liệu, và chạy lại hay chọn mẫu khác là qua được.
  file: `_acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/ap-lan-hai-ban-chep.mjs`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: «PASS ba bất biến» của E3 không có đối chứng dương cho chính bộ đếm, và cũng xanh trên mã trước DA65**
  Người dùng thấy gì: Phép đo trên dữ liệu thật báo xanh nhưng sẽ không bật đỏ chắc chắn nếu bộ đếm hỏng, nên chưa chứng minh được riêng phần này. Luật chính vẫn có phép thử đỏ và xanh trên dự án giả.
  Căn cứ: Rủi ro là bỏ sót lỗi mà không mất dữ liệu, vì ca chính đã có đối chứng riêng; dữ liệu hôm nay không có ca vi phạm nên kết quả xanh vẫn đúng.
  file: `_acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
