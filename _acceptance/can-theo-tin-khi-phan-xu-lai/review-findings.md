# Review findings: can-theo-tin-khi-phan-xu-lai (round 4)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E5 'expected' trong evals.yaml lệch với răng ap-hai-lan.mjs sau commit 886fed1e**
  Người dùng thấy gì: Phần mô tả bài kiểm ghi hơi khác cách bài kiểm thật chạy. Người dùng cuối không thấy gì khác, chỉ người ký đọc mô tả có thể hiểu sai.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, chỉ là câu chữ mô tả; sửa lại sau rất rẻ và không mất gì.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **E5 expected vẫn đòi oneinvest can-theo-tin:* = 0, trong khi răng đã đổi sang so trước = sau**
  Người dùng thấy gì: Mô tả bài kiểm còn đòi con số cũ, nên sau khi bản sửa lên máy thu thật, người chấm theo mô tả có thể tưởng bài kiểm sai dù không có lỗi gì.
  Căn cứ: Chỉ gây hiểu nhầm cho người đọc tài liệu, không mất hay lộ dữ liệu; tự sửa được bằng cách chỉnh câu mô tả.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Phép kiểm 'bản chép thiếu bảng' không bắt được trường hợp pg_dump chết giữa phần dữ liệu; DB thử bị bỏ lại khi db-thu.sh thất bại**
  Người dùng thấy gì: Khi máy quá tải, bài kiểm có thể báo xanh trên bản chép dở và để lại vài cơ sở dữ liệu thử thừa trên máy. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng máy kiểm nội bộ, không đụng dữ liệu thật; DB thử thừa xoá tay được, lỗi hiếm nên sửa không đáng công.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion chỉ âm tính, không có đối chứng dương): phép «DB oneinvest không bị chạm» của E5 không thể đỏ**
  Người dùng thấy gì: Bài kiểm xác nhận dữ liệu dùng chung không bị đụng đến có thể không phát hiện nếu có ai lỡ áp bản sửa lên đó. Việc áp lên máy thu thật vẫn do Mạnh duyệt riêng và có sao lưu trước.
  Căn cứ: Rủi ro thấp vì bước áp thật đã có người duyệt và sao lưu, nên nếu lỡ chạm vẫn khôi phục được; ghi nhận giới hạn là đủ.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo đúng khuôn bên đọc): ca gieo căn lệch của E5 ghi thẳng bản ghi tin và đề xuất 'applied'**
  Người dùng thấy gì: Một ca thử dùng dữ liệu gieo tay nên chỉ chứng tỏ bản sửa nhận đúng dạng dữ liệu do người viết tạo ra. Dạng dữ liệu thật vẫn được kiểm ở bài khác.
  Căn cứ: Không ảnh hưởng người dùng vì ca sinh lệch bằng đường thật đã có bài kiểm riêng; sửa thêm tốn công mà ít thêm bảo đảm.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
