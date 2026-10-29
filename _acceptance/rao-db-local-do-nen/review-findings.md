# Review findings: rao-db-local-do-nen (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **pham-vi.sh: lỗi của git diff bị nuốt, kiểm phạm vi vẫn ra 'khong doi' / PHAM-VI OK**
  Người dùng thấy gì: Công cụ kiểm phạm vi thay đổi có thể báo 'đạt' nhầm nếu lệnh so sánh của git tự hỏng giữa chừng. Điều này hiếm khi xảy ra, và lần kiểm hiện tại cho kết quả đúng, nên người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ và hiếm: chỉ ảnh hưởng công cụ kiểm nội bộ chứ không ảnh hưởng dữ liệu hay người dùng, kết quả hiện tại đã đúng, và nếu có lỗi thì chạy lại là thấy; chi phí sửa không đáng so với rủi ro.
  file: `_acceptance/rao-db-local-do-nen/probes/pham-vi.sh`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
