# Review findings: s03-len-nhanh-nac-1 (round 4)

## Trong hợp đồng

Không có finding nào map vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **buoc_nhanh tự chép lại logic job_run/dòng ghim JOB FAIL thay vì dùng bộ chạy chung job-step.sh**
  Người dùng thấy gì: Lượt nạp nhanh hiện chạy đúng. Nhưng nếu sau này đổi cách báo lỗi chung của các job thì lượt nhanh có thể báo lệch mà không ai hay.
  Căn cứ: Chưa gây lỗi nào với người dùng, chỉ làm việc sửa sau này dễ sót; ghi lại để nhớ khi đụng tới cách báo lỗi chung.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Lượt nhanh coi refresh-bait-gap là «một giao dịch, lùi trọn» nhưng bước này commit ba giao dịch nối nhau, nên khi đụng khoá phần đầu đã ghi**
  Người dùng thấy gì: Khi lượt nhanh đụng khoá ở giữa bước làm tươi, một phần dữ liệu đã cập nhật còn phần danh bạ người bị bỏ lặng lẽ. Phần bỏ sẽ được làm lại ở lượt sau.
  Căn cứ: Hậu quả nhẹ vì lượt sau tự bù, không mất dữ liệu; chỉ lời giải thích trong hồ sơ cần sửa cho đúng.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): chiều đỏ SK-AC-3 chỉ đo «chưa xong trong 20 s», không có đối chứng rằng lượt không khoá xong dưới 20 s**
  Người dùng thấy gì: Bài kiểm tra về việc lượt nhanh bị treo khi có khoá có thể xanh dù khoá không có tác dụng, nếu lượt thật vốn chạy chậm. Sản phẩm không sai, chỉ là bằng chứng kiểm chưa chặt.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp; phần dương của ca đã chạy xong và chứng minh hành vi chính, nên ghi lại và siết bài kiểm sau là đủ.
  file: `scripts/zalo-import-job-khoa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

