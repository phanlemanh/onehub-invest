# Review findings: loc-enrich-thu-ops-audit

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **evals.yaml mô tả chiều đỏ và tên ca không khớp test thật (E1, E3, E5 và khối chú thích đầu tệp)**
  Người dùng thấy gì: Người đối chiếu bằng chứng nghiệm thu có thể không tìm thấy tên hai ca kiểm và hiểu sai phần nào được thử đột biến. Nhật ký thao tác của người dùng vẫn lọc đúng.
  Căn cứ: Chỉ lệch chữ trong tài liệu nghiệm thu, nhẹ, không mất hay lộ dữ liệu của người dùng; người đọc tự tra lại được và sửa sau rất rẻ.
  file: `_acceptance/loc-enrich-thu-ops-audit/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): ma trận người gọi của LA-AC-4 bỏ sót vai owner và user trong BAC_VAI**
  Người dùng thấy gì: Phép kiểm quyền chỉ phủ sáu loại người gọi đã thống nhất, chưa thử riêng vai chủ sở hữu và vai người dùng thường. Thay đổi lần này chỉ thêm một điều kiện lọc chỉ đọc nên quyền truy cập không bị đụng tới.
  Căn cứ: Rủi ro thấp vì thay đổi không chạm phần kiểm quyền, nên khả năng ai đó xem được nhật ký ngoài ý muốn rất nhỏ; mở rộng ma trận tốn công mà ít thêm giá trị.
  file: `app/tests/audit-loc.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm-tính-một-mình): chiều đỏ của LA-AC-3 không có đối chứng dương về mã trạng thái hay các dòng còn lại**
  Người dùng thấy gì: Phép thử đột biến của ca lọc action có thể báo đỏ vì lý do khác với lý do mong muốn, chẳng hạn route lỗi thay vì lọc sai tiền tố. Hành vi lọc nhật ký cho người dùng vẫn được kiểm ở chiều xanh.
  Căn cứ: Chỉ làm bằng chứng đỏ kém chặt, không ảnh hưởng dữ liệu hay người dùng cuối, và chiều xanh vẫn bắt được route hỏng; siết thêm sau rất rẻ.
  file: `app/tests/audit-loc.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
