# Review findings: app-test-chap-chon-e4b-sap (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rào 'TRAN BI DOI' khoá mọi hằng số của hai tệp test trong bộ chung, không chỉ trần đã ký**
  Người dùng thấy gì: Sau khi gộp, người sửa hai tệp đối chiếu có thể bị báo đỏ giả trong bộ test chung dù không nới trần nào. Việc này chỉ làm chậm người làm, không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ gây báo đỏ giả cho người phát triển, không mất dữ liệu, người sửa tự gỡ được bằng cách chỉnh lại phép kiểm khi gặp.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Phép kiểm 'hằng trần không đổi so với gốc nhánh' so mọi con số trong cả tệp và chạy mãi trong bộ chung, nên sẽ đỏ 'TRAN BI DOI' với mọi sửa sau này chạm số**
  Người dùng thấy gì: Các lần sửa test sau này có chạm một con số bất kỳ có thể bị chặn bởi báo đỏ giả ở bộ test chung. Người dùng cuối không thấy gì, nhưng đội làm việc mất thời gian gỡ.
  Căn cứ: Hậu quả nhẹ và chỉ nội bộ, không ảnh hưởng dữ liệu hay người dùng, sửa sau rẻ khi thực sự gặp.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — Đo CHỈ DẪN thay vì ĐẦU RA: SCB-AC-1 đếm ca bỏ qua bằng regex trên mã nguồn, không đọc kết quả node:test**
  Người dùng thấy gì: Phép kiểm tự động có thể không phát hiện nếu một ca bị bỏ qua bằng cách khác với cách đã khai. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ là khoảng hở trong lưới an toàn nội bộ của test, không làm hỏng chức năng nào, và đầu ra thật vẫn được người kiểm tra xem.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét LỚP «đúng bốn ca của bộ chung» nhưng chỉ quét hai tệp và một cơ chế**
  Người dùng thấy gì: Nếu sau này có thêm ca bị bỏ qua ở tệp test khác, phép kiểm này sẽ không báo. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Rủi ro chỉ là sót phát hiện trong tương lai ở test nội bộ, không mất dữ liệu, và có thể mở rộng phạm vi quét sau với chi phí thấp.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: đối chứng «ca thứ năm» chỉ dùng notDeepEqual, không ghim kết quả**
  Người dùng thấy gì: Phép thử đối chứng có thể qua dù bộ đếm nhận sai, nên độ tin cậy của lưới kiểm giảm nhẹ. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Hậu quả rất nhẹ và chỉ nội bộ test, không đụng dữ liệu hay người dùng, sửa sau rẻ.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
