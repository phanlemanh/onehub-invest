# Review findings: sellers-them-dong-lai (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bản đột biến tạm được ghi vào cây mã nguồn pipeline/, và .gitignore không chặn**
  Người dùng thấy gì: Nếu chạy kiểm thử mà bị ngắt giữa chừng, một tệp mã tạm có thể nằm lại trong thư mục và vô tình bị đưa vào lần commit. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi kiểm thử bị ngắt, không mất hay lộ dữ liệu, và người làm tự xoá tệp thừa được ngay.
  file: `pipeline/scripts/bait-gap-sellers.test.mjs`
  severity: low
  Đề xuất: known-limits

- **sellersThieu khác phạm vi với dungNguoi: mọi nguồn trong sale_offers, so SĐT thô, trong khi bộ dựng chỉ đọc S03/S05/S06, bỏ tin có originating_system_key NULL và trim SĐT**
  Người dùng thấy gì: Với một số tin hiếm (nguồn ngoài ba nguồn hiện dùng, tin thiếu khoá, số điện thoại có khoảng trắng), báo cáo có thể báo mãi là còn người bán thiếu dù chạy lại nhiều lần. Dữ liệu hiện tại chưa gặp trường hợp này.
  Căn cứ: Hiện chưa có dòng dữ liệu nào bị ảnh hưởng, chỉ gây cảnh báo thừa chứ không mất hay sai dữ liệu, và sửa sau vẫn rẻ khi có thêm nguồn mới.
  file: `pipeline/lib/danh-ba-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
