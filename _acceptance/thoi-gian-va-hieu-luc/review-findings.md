# Review findings: thoi-gian-va-hieu-luc (round 2)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bước trang-thai-chao vào cloud-sync.sh nhưng 059 chưa áp lên DB local thì bước đỏ ở mọi lượt**
  Người dùng thấy gì: Nếu mã được gộp mà bản cập nhật cấu trúc dữ liệu chưa được áp trên máy thu, mỗi lượt đồng bộ lên cloud sẽ báo lỗi cho tới khi có người áp.
  Căn cứ: Chỉ là lỗi tạm thời trong khoảng giữa gộp và triển khai, không mất hay lộ dữ liệu, tự hết khi áp bản cập nhật, ghi thứ tự triển khai là đủ.
  file: `scripts/cloud-sync.sh`
  severity: low
  Đề xuất: known-limits

- **Bất biến «chỉ resolve_offer_status ghi offer_status» không có máy kiểm như năm cột PL15**
  Người dùng thấy gì: Sau này nếu ai đó vô tình ghi thẳng trạng thái chào của tin mà không qua bước phân xử, hệ thống sẽ không tự báo và lịch sử có thể có dòng đổi trạng thái giả.
  Căn cứ: Hiện chưa có lỗi nào xảy ra, rủi ro chỉ phát sinh khi code đổi sau này, nên làm thành việc riêng sau, không chặn bản này.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: new-contract

- **Probe mgn_mu (man-gan-nhan-mu E5) vỡ sau 059: INSERT field_assertions thiếu observed_at**
  Người dùng thấy gì: Kiểm tra cũ của tính năng gắn nhãn mù sẽ báo đỏ khi chạy lại, dù tính năng đó không hỏng, gây nhầm lẫn cho người nghiệm thu sau.
  Căn cứ: Chỉ làm một lệnh kiểm cũ báo đỏ giả, không ảnh hưởng người dùng hay dữ liệu, và sửa rất rẻ khi cổng đó được chạy lại.
  file: `_acceptance/man-gan-nhan-mu/probes/mu.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có finding.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
