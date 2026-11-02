# Review findings: seller-ref-theo-nguoi-gui (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **seller_ref (người gửi bài neo) và seller_name có thể chỉ hai người khác nhau trên cùng một tin, contract không khai báo**
  Người dùng thấy gì: Ở tin có nhiều người cùng gửi, mã người đăng và tên người đăng trên cùng một tin có thể thuộc hai người khác nhau. Hiện chưa màn hình nào hiển thị ghép hai thứ này nên người dùng chưa thấy sai.
  Căn cứ: Hậu quả nhẹ vì chưa nơi nào hiển thị mã cạnh tên, không mất hay lộ dữ liệu, và có thể xử lý sau khi có màn hình đầu tiên đọc hai thông tin này cùng nhau.
  file: `pipeline/transform-fb.mjs`
  severity: low
  Đề xuất: known-limits

- **sender_id không thuần số nhưng tận cùng bằng chữ số lên cloud chỉ còn phần số cuối, không bị NULL**
  Người dùng thấy gì: Một số mã người gửi trộn chữ và số, khi lên cloud chỉ còn vài chữ số cuối, nên có thể hiện sai người hoặc hai người khác nhau bị trùng mã. Hiện chỉ khoảng một giá trị như vậy.
  Căn cứ: Ảnh hưởng nhỏ (khoảng một giá trị), không lộ tên nguồn hay dữ liệu nhạy cảm, và chưa màn hình nào đọc cột này; sửa đúng chỗ là việc ở lớp đồng bộ cloud, nên tách riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — đo hằng số/chỉ dẫn thay vì đầu ra: đối chứng E5 «leak gate bắt 'ct:1'» chỉ khớp regex với một chuỗi viết tay**
  Người dùng thấy gì: Bài kiểm tra chứng minh cổng chặn lộ dữ liệu sẽ bắt giá trị thô chỉ so mẫu với một chuỗi viết sẵn, chưa chạy cổng thật. Nếu cổng hỏng, bài kiểm này vẫn báo xanh.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp vì bản thân cổng vẫn chạy ở mỗi lần đồng bộ; chỉ làm bằng chứng nghiệm thu yếu hơn nên có thể ghi nhận và củng cố sau với chi phí thấp.
  file: `pipeline/scripts/seller-ref.itest.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
