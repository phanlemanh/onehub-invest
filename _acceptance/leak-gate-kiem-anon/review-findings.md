# Review findings: leak-gate-kiem-anon

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mỗi cặp role×quan hệ chỉ in MỘT đường cấp và một lệnh gỡ; khi quyền mở qua nhiều đường, chạy nguyên văn lệnh gỡ không làm lượt kế xanh như sổ vận hành hứa**
  Người dùng thấy gì: Nếu quyền đọc công khai bị mở qua nhiều đường cùng lúc, chạy đúng lệnh gỡ được in ra có thể chưa làm lượt đồng bộ kế tiếp xanh lại. Người vận hành phải gỡ thêm vài lượt, nhưng dữ liệu vẫn không bị lộ.
  Căn cứ: Hậu quả nhẹ vì cổng vẫn dừng an toàn, không lộ dữ liệu, người vận hành tự gỡ được bằng cách lặp lại lệnh gỡ mới; chỉ tốn thêm vài vòng đồng bộ và tình huống nhiều đường cùng mở khá hiếm.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Lệnh «gỡ:» chỉ nhắm MỘT đường cấp mỗi (role, quan hệ); quyền mở qua nhiều đường hoặc qua chuỗi role lồng nhau thì chạy đúng lệnh in ra vẫn không xanh**
  Người dùng thấy gì: Khi quyền đọc công khai đến qua nhiều đường hoặc qua chuỗi nhóm lồng nhau, lệnh gỡ mà hệ thống gợi ý có thể không có tác dụng và cổng cứ đỏ mãi với cùng một lệnh. Dữ liệu không bị lộ, nhưng người vận hành phải tự dò ra đường cấp thật.
  Căn cứ: Không lộ dữ liệu vì cổng vẫn dừng, và người vận hành tự gỡ được bằng cách tra tay đường cấp; chỉ gây mất thời gian xử lý ở tình huống hiếm (chuỗi nhóm lồng nhau), sửa sau không đắt nhưng cũng chưa cấp bách.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên đo LỚP «không thuộc extension postgis» nhưng chỉ có một điểm-case khác TÊN, nhánh pg_depend không bao giờ được chạy tới**
  Người dùng thấy gì: Phép thử hiện chưa chứng minh được việc cổng chỉ bỏ qua ba quan hệ PostGIS khi chúng thật sự thuộc extension. Nếu có ai gỡ một trong ba quan hệ ấy khỏi extension rồi cấp quyền đọc công khai, cổng có thể không phát hiện.
  Căn cứ: Tình huống cần có người cố tình gỡ quan hệ khỏi extension rồi mở quyền, cực hiếm trên cloud thật; hậu quả nếu xảy ra là lộ dữ liệu của chỉ ba quan hệ hệ thống, và thêm một ô thử về sau không tốn kém.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
