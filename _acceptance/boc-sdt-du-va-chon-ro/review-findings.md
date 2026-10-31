# Review findings: boc-sdt-du-va-chon-ro (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **do-boc-sdt.mjs đọc stg_zalo_posts trực tiếp, bỏ qua lib/test-posts.mjs (định nghĩa duy nhất của kênh + post thử)**
  Người dùng thấy gì: Công cụ đo có thể đếm cả bài thử, nên con số kiểm tra hơi lệch so với tập bài thật. Người dùng cuối không bị ảnh hưởng, chỉ báo cáo nghiệm thu có thể nhiễu.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng số đo nội bộ, không làm mất hay sai dữ liệu của người dùng. Sửa sau rẻ và không rủi ro.
  file: `pipeline/scripts/do-boc-sdt.mjs`
  severity: medium
  Đề xuất: known-limits

- **DUOI_SO_LE bỏ luôn SĐT hợp lệ khi ngay sau số là dấu tách rồi một chữ số đứng riêng ("0912345678. 3 tầng", "0912345678 2 ngủ")**
  Người dùng thấy gì: Một số tin có SĐT đứng ngay trước một con số rời, ví dụ số tầng hay số phòng ngủ, sẽ bị mất số điện thoại. Tin đó có thể hiện không có SĐT hoặc chọn nhầm số khác, và người dùng không tự sửa được.
  Căn cứ: Mất số liên hệ âm thầm trên tin thật là hậu quả khá nặng, và dạng câu này khá phổ biến. Sửa cần cân giữa việc loại số 11 chữ số và việc giữ số hợp lệ, nên nên làm thành việc riêng có đo đạc.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
