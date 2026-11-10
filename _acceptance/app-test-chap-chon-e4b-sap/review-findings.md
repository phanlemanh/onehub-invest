## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hồ sơ ghi trần CGT-DC đã ký là 600 giây và 'không nới', nhưng mã đang chạy ở 1200 giây và bộ canh mới lại khoá cứng 1200 giây**
  Người dùng thấy gì: Hồ sơ nói phép đo đối chiếu giá tốt bị giới hạn 600 giây, nhưng thực tế máy cho phép tới 1200 giây. Người ký có thể tưởng giới hạn chặt hơn thực tế.
  Căn cứ: Chỉ là lệch con số trong tài liệu, không ảnh hưởng người dùng cuối, và ghi chú lại rất rẻ.
  file: `_acceptance/app-test-chap-chon-e4b-sap/contract.md`
  severity: medium
  Đề xuất: known-limits

- **Gate 1 đã niêm dù thẻ có cờ đỏ chặn Cổng Phạm vi: thiếu dòng «Đã tra tri thức» và thiếu gap-probe hoặc descope**
  Người dùng thấy gì: Thẻ duyệt phạm vi được ký khi còn cờ cảnh báo chưa xử lý, nên người ký thiếu một lượt phản biện độc lập. Người dùng cuối không thấy ảnh hưởng gì.
  Căn cứ: Chỉ là thiếu bước quy trình nội bộ, không mất dữ liệu, có thể ghi chú lại và bổ sung sau.
  file: `_acceptance/app-test-chap-chon-e4b-sap/card.html`
  severity: medium
  Đề xuất: known-limits

- **Bộ canh «TRAN BI DOI» so mọi số trong cả hai tệp test, không riêng hằng trần, và chạy mãi trong bộ chung**
  Người dùng thấy gì: Sau này, sửa bất kỳ con số nào trong hai tệp kiểm thử đó cũng có thể làm bộ kiểm đỏ giả dù không nới trần nào. Người dùng cuối không bị ảnh hưởng, chỉ làm chậm đội phát triển.
  Căn cứ: Báo đỏ giả gây phiền nhưng không làm hỏng sản phẩm, và người làm sau gỡ được bằng cách thu hẹp phép so.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hồ sơ khẳng định «giữ trần 600 giây» cho CGT-DC, nhưng mã đang chạy với trần 1.200 giây**
  Người dùng thấy gì: Tài liệu thiết kế nói giới hạn thời gian 600 giây nhưng máy đang áp 1200 giây, nên mô tả không khớp thực tế. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Sai lệch chỉ nằm ở tài liệu, không mất dữ liệu, sửa lời hoặc ghi chú rất rẻ.
  file: `docs/superpowers/specs/2026-11-10-app-test-chap-chon-e4b-sap-design.md`
  severity: medium
  Đề xuất: known-limits

- **Ca SCB-AC-2 so hằng số với merge-base nên thành chốt chặn vĩnh viễn: sau khi gộp, mọi nhánh sửa một số trong hai tệp test đều đỏ «TRAN BI DOI»**
  Người dùng thấy gì: Các nhánh làm việc sau này có thể bị báo đỏ giả khi sửa hai tệp kiểm thử, làm chậm việc giao tính năng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả chỉ là phiền toái cho người phát triển, tự gỡ được bằng cách sửa phép so, không rủi ro dữ liệu.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): đối chứng «ca thứ năm» chỉ notDeepEqual, không ghim kết quả dương**
  Người dùng thấy gì: Một phép kiểm tự thử có thể vẫn xanh dù bộ đếm hỏng, nên độ tin cậy của bộ kiểm thấp hơn vẻ ngoài. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Mức nhẹ, chỉ làm yếu một lớp kiểm phụ và có thể siết lại sau với chi phí thấp.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): SCB-AC-1 đọc mã nguồn và package.json, không đọc kết quả bỏ qua thật**
  Người dùng thấy gì: Một lớp kiểm phụ chỉ nhìn vào mã chứ không nhìn kết quả chạy thật, nên có thể bỏ sót một cách bỏ qua ca khác thường. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Đã có lớp kiểm khác đọc đầu ra thật, nên rủi ro thấp và chỉ cần ghi lại hạn chế.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
