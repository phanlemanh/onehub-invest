# Review findings: thuoc-lech-ma-nguon-va-lich-s05 (round 1)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kiểm TL-AC-2 đúng chỉ vì S10, S11 đang lỗi độ tươi, không phải vì mã có hai chữ số**
  Người dùng thấy gì: Bài kiểm báo cáo ngày hiện xanh. Nhưng nếu sau này S10, S11 được khai hạn độ tươi và thu đúng hạn, bài kiểm có thể đỏ oan dù báo cáo vẫn đúng, gây mất thời gian tìm lỗi không có.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ có thể báo đỏ nhầm cho đội khi cấu hình đổi; bài kiểm sửa lại được rẻ và đúng lúc đó.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **TL-AC-2 assumes S10+ sources are always unhealthy: the test fails once they get an SLO and are fresh**
  Người dùng thấy gì: Khi S10, S11 được khai hạn độ tươi và thu đúng hạn, bài kiểm báo cáo ngày có thể đỏ dù báo cáo đúng. Người dùng không thấy gì, chỉ đội phát triển bị báo lỗi giả.
  Căn cứ: Hậu quả nhẹ, chỉ là báo đỏ nhầm trong kiểm tra nội bộ, không mất hay lộ dữ liệu, và dễ gỡ khi gặp.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
