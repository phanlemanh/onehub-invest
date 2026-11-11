## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chốt «TRAN BI DOI» so mọi số >1 với merge-base origin/main, sau khi gộp thành rào vĩnh viễn trong bộ chung**
  Người dùng thấy gì: Sau khi gộp, nhánh sau nào sửa hai tệp đối chiếu này, dù chỉ thêm một ca hay đổi một con số không phải trần, có thể làm bộ kiểm chung báo đỏ giả. Người làm sẽ phải dừng lại tìm nguyên nhân, nhưng không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ làm chậm người phát triển các nhánh sau, không mất hay lộ dữ liệu, và đèn đỏ giả dễ nhận ra; ghi hạn chế rồi chỉnh khi thật sự gặp thì rẻ hơn sửa ngay.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Cổng Phạm vi được niêm khi thẻ còn cờ đỏ «chưa tra tri thức» và chưa có gap-probe hay dòng descope**
  Người dùng thấy gì: Cổng Phạm vi được duyệt khi thẻ vẫn ghi còn thiếu bước tra cứu và phản biện độc lập. Người dùng cuối không thấy gì, nhưng bộ thẻ duyệt kém tin cậy hơn một chút.
  Căn cứ: Đây là thiếu sót về hồ sơ quy trình chứ không phải lỗi sản phẩm, nên chỉ cần ghi nhận; không có hậu quả cho người dùng và không cần mở việc riêng.
  file: `_acceptance/app-test-chap-chon-e4b-sap/card.html`
  severity: medium
  Đề xuất: known-limits

- **SCB-AC-2 mặc định so mọi số trong hai tệp test với gốc nhánh và luôn chạy, nên sẽ đỏ giả ở mọi nhánh sau có thêm hoặc sửa một số bất kỳ trong hai tệp**
  Người dùng thấy gì: Nhánh về sau sửa hai tệp đối chiếu này có thể gặp báo đỏ giả ở bộ kiểm chung dù trần thời gian không đổi. Chỉ làm vướng người phát triển.
  Căn cứ: Hậu quả nhẹ, chỉ gây báo động giả khi kiểm thử, không ảnh hưởng người dùng và dễ tự gỡ khi gặp; sửa ngay không đáng chi phí.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: đối chứng «ca thứ năm» trong SCB-AC-1 chỉ dùng notDeepEqual**
  Người dùng thấy gì: Phép thử của bộ đếm ca bỏ qua có thể không bắt được một số kiểu hỏng của chính nó. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là độ chặt của công cụ kiểm thử nội bộ; phép đếm dòng bỏ qua ở đầu ra thật vẫn bắt lỗi, nên rủi ro thấp.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: ca đối chứng được viết khớp sẵn regex của demCaBoQua**
  Người dùng thấy gì: Nếu ai đó thêm một ca bỏ qua theo cách viết khác, bộ đếm có thể không phát hiện. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Rủi ro thấp vì số dòng bỏ qua ở kết quả chạy thật vẫn lộ ca thừa; chỉ cần ghi hạn chế, sửa sau vẫn rẻ.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
