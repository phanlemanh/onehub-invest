# Review findings: e4b-danh-sach-tin-nhanh (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca AC-4/AC-3/AC-7 ghim cứng vào gốc nhánh e21a151e nhưng nằm trong suite chạy mỗi lượt, nên lần sửa hợp lệ sau này sẽ làm suite đỏ**
  Người dùng thấy gì: Tính năng chạy đúng cho người dùng hôm nay. Nhưng về sau, khi đội cố ý đổi cách danh sách tin hoạt động, bộ kiểm tra sẽ báo đỏ dù không có lỗi thật, và phải có người gỡ hoặc sửa các ca so sánh cũ mới tiếp tục được.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; chỉ làm chậm đội phát triển ở vòng sau, và người sửa tự gỡ được khi chạm vào đúng chỗ đó nên ghi lại hạn chế là đủ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
