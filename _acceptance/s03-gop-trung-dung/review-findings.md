# Review findings: s03-gop-trung-dung (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 (quan hệ đo bằng kết quả không phân biệt): E5 coi luong7 xanh là bằng chứng 'bản chép app khớp pipeline', nhưng fixture luong7 không có ca phân biệt lọc cũ với lọc mới**
  Người dùng thấy gì: Cột «S03 — bài nhận» trên bảng Luồng 7 ngày ở trang Thu thập có thể vẫn đếm theo cách lọc nguồn cũ mà bài kiểm tra không báo. Khi có nguồn thu thật mang tên khác, số đếm trên bảng có thể lệch nhẹ so với số bài mà bước xử lý đêm thật sự đọc.
  Căn cứ: Chỉ là con số hiển thị trên trang vận hành nội bộ, không làm mất hay sai dữ liệu, và lệch chỉ xảy ra với tên nguồn lạ nên nhẹ; chỉ cần ghi lại để tránh tin nhầm là bảng đã được kiểm.
  file: `_acceptance/s03-gop-trung-dung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận viết trước nhưng chỉ có một assert gộp): GT-AC-5 kiểm S03_POSTS_SQL bằng tổng số đếm, không kiểm từng phần tử của ma trận 10 hàng**
  Người dùng thấy gì: Bài kiểm tra chỉ so tổng số bài đếm được, nên nếu câu đếm cùng lúc đếm nhầm một bài và bỏ sót một bài khác thì vẫn báo xanh. Trường hợp này hiếm và chỉ làm con số hiển thị sai chứ không làm hỏng dữ liệu.
  Căn cứ: Rủi ro thấp vì cần hai lỗi bù trừ nhau đúng lúc mới lọt, hậu quả chỉ là một con số trên trang vận hành, và người dùng không mất dữ liệu nào; ghi lại là đủ.
  file: `pipeline/scripts/gop-trung-s03.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

