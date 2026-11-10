# Review findings: do-hieu-qua-hang-ngay (round 5)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **TRUNG_TRON cho SDT không bao giờ khớp; nhãn cấu trúc ghép (a:b, a-b) không còn bắt định danh LABELER**
  Người dùng thấy gì: Bộ kiểm tra chặn lộ số điện thoại hoặc mã người gắn nhãn trong số liệu đo còn một kẽ hở với dạng chuỗi ghép. Hiện chưa có đường nào đưa các thông tin đó vào, nên chưa có gì bị lộ.
  Căn cứ: Chưa có dữ liệu nào bị lộ và hiện không có đường đưa thông tin nhạy cảm vào, nên hậu quả hiện tại gần như bằng không; ghi lại để theo dõi là đủ.
  file: `pipeline/lib/do-hang-ngay.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình), oracle lấy từ chính code đang kiểm: vòng «Tự soát» đúng theo cách dựng, không có đối chứng dương**
  Người dùng thấy gì: Một bài tự kiểm trong bộ test có thể báo xanh dù bộ chặn rò có lỗi, vì thiếu ca thử chứng minh nó biết báo đỏ. Người dùng không thấy ảnh hưởng trực tiếp, chỉ giảm độ tin cậy của lưới an toàn.
  Căn cứ: Không ảnh hưởng số liệu hay người dùng cuối, chỉ làm lưới kiểm thử yếu hơn; bổ sung ca đối chứng sau cũng rẻ và không gấp.
  file: `pipeline/scripts/do-hang-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): ca «Khắc» trong danh sách tên không phân biệt được gì vì latThat không có khoá `khac`**
  Người dùng thấy gì: Một ca thử về tên «Khắc» trong bộ test không thực sự kiểm được điều nó tuyên bố. Sản phẩm vẫn chạy bình thường, chỉ là độ phủ kiểm thử mỏng hơn ghi chú.
  Căn cứ: Chỉ là một ca thử thừa tác dụng, không gây mất hay lộ dữ liệu, và bổ sung sau không tốn kém.
  file: `pipeline/scripts/do-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): TRUNG_TRON khai hai định danh {LABELER, SDT} nhưng chỉ có ca dương cho LABELER**
  Người dùng thấy gì: Bộ test chưa có ca nào kiểm việc chặn số điện thoại lọt vào số liệu đo, nên nếu nhánh này hỏng sau này sẽ không ai biết ngay. Hiện chưa có số điện thoại nào bị lộ.
  Căn cứ: Rủi ro chỉ là không phát hiện sớm nếu sau này có thay đổi gây lộ; hiện chưa có lộ nào và việc bổ sung test rẻ, làm sau được.
  file: `pipeline/scripts/do-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

