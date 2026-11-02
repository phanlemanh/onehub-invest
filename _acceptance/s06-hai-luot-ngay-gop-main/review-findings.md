## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1, E2, E3 khai paths thiếu chính tệp răng rang/lich-chotot.mjs, lệch mẫu các hồ sơ có răng trong _acceptance/**
  Người dùng thấy gì: Danh sách tệp theo dõi của bộ kiểm lịch chạy S06 thiếu một tệp. Người dùng không bị ảnh hưởng gì, lịch chạy hai lượt mỗi ngày vẫn được kiểm đúng.
  Căn cứ: Chỉ là chỗ khai báo nội bộ của bộ kiểm, cổng nghiệm thu vẫn cho kết quả đúng, người dùng không thấy gì và sửa lúc nào cũng rẻ.
  file: `_acceptance/s06-hai-luot-ngay-gop-main/evals.yaml`
  severity: low
  Đề xuất: wont-fix

- **Lệnh cài và đầu script vẫn ghi chỉ chạy 05:30 sau khi plist có hai mốc, và không có sổ nào theo dõi việc sửa**
  Người dùng thấy gì: Khi cài lại, thông báo của máy vẫn nói thu thập S06 chỉ chạy 05:30 mỗi ngày, dù thực tế đã chạy hai lượt lúc 05:30 và 14:00. Người vận hành có thể hiểu nhầm lịch nhưng lịch chạy thật vẫn đúng.
  Căn cứ: Chỉ sai chữ thông báo, không mất hay lộ dữ liệu, lịch chạy thật đúng; sửa sau rẻ, chỉ cần chuyển cho làn thu thập cùng lúc sửa tài liệu lịch.
  file: `scripts/install-chotot-daily.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

