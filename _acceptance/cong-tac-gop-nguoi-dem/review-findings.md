# Review findings: cong-tac-gop-nguoi-dem (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước nap-lai-nguoi xoá dòng ops_audit (bảng audit) để ép công tắc về tắt**
  Người dùng thấy gì: Công cụ kiểm thử có xoá một dòng nhật ký bật/tắt, nhưng chỉ trong lượt thử trên bản sao dữ liệu rồi lùi lại hết. Nhật ký thật của người dùng không bị ảnh hưởng.
  Căn cứ: Không mất hay lộ dữ liệu thật vì lệnh chỉ chạy trên DB thử và luôn lùi lại; chỉ lệch nếp nhật ký chỉ-thêm trong mã kiểm thử, sửa sau cũng rẻ.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm âm một mình: «số merged trước = sau» của CTG E9 không thể đỏ dưới --thu, và không có kiểm nào trên kq.gop**
  Người dùng thấy gì: Bài kiểm lệnh dựng tay khi công tắc tắt có thể vẫn xanh dù bộ dựng lỡ gộp, vì nó chỉ dựa vào nhãn tự báo. Các bài kiểm khác vẫn bắt được việc gộp nhầm khi công tắc tắt.
  Căn cứ: Rủi ro nhẹ vì các bài kiểm khác đã phủ việc không gộp khi tắt; đây chỉ là một lớp bảo vệ yếu hơn mong muốn, không mất dữ liệu, có thể bổ sung sau với chi phí thấp.
  file: `pipeline/scripts/danh-ba-nguoi.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
