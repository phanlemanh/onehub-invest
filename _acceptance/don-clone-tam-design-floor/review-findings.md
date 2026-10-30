# Review findings: don-clone-tam-design-floor (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 (assert «chuỗi có mặt» trong khi lời hứa là quan hệ): AC-5 coi ca bị chuyển thành SKIP/TODO là ca «còn»**
  Người dùng thấy gì: Bộ kiểm tra «không hạ thước» có thể vẫn báo xanh nếu ai đó tắt một ca test cũ bằng cách đánh dấu bỏ qua, miễn là tên ca còn đó. Chỉ ảnh hưởng độ chặt của bộ test nội bộ, không ảnh hưởng người dùng cuối hay dữ liệu.
  Căn cứ: Đây là kẽ hở về độ chặt của công cụ kiểm tra nội bộ, không làm mất hay lộ dữ liệu của ai, và chỉ xảy ra khi có người chủ ý tắt ca test, nên ghi lại là giới hạn đã biết là đủ; hợp đồng cũng chưa hứa điều này.
  file: `scripts/design-floor/tmp-sach.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
