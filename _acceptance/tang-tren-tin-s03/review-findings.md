# Review findings: tang-tren-tin-s03

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DQ s03-floor-fill báo 'skip' thay vì 'fail' khi bộ đọc tầng hỏng hoàn toàn**
  Người dùng thấy gì: Nếu bộ đọc tầng hỏng hẳn, bảng kiểm chất lượng dữ liệu vẫn chỉ ghi bỏ qua thay vì báo đỏ, nên việc mất toàn bộ thông tin tầng của tin căn hộ có thể không bị phát hiện ngay. Người dùng cuối chưa thấy lỗi trực tiếp, chỉ là tin thiếu tầng.
  Căn cứ: Hậu quả nhẹ vì chỉ thiếu cảnh báo, không mất hay lộ dữ liệu; chạy lại bộ đọc là có lại tầng, và việc ghi chú giới hạn này rẻ hơn nhiều so với sửa.
  file: `pipeline/sql/450_dq_checks.sql`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): mau_ignored của E11 kiểm .gitignore của checkout chính, không phải của cây đang kiểm**
  Người dùng thấy gì: Phép kiểm xem tệp đáp án đọc tay có bị kho bỏ qua hay không có thể xanh nhầm nếu nhánh này lỡ làm hỏng luật bỏ qua. Khi đó tệp mẫu có nguy cơ bị đưa nhầm lên kho công khai.
  Căn cứ: Chỉ xảy ra khi luật bỏ qua bị sửa hỏng, điều hiếm và dễ thấy khi xem diff; tệp mẫu không chứa chữ bài nguồn nên rủi ro thấp, và sửa sau không tốn kém.
  file: `pipeline/scripts/do-tang-tren-tin.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
