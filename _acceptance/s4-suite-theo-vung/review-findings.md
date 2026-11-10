# Review findings: s4-suite-theo-vung (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **paths của E6 thiếu tệp probe mà lệnh E6 chạy (kho đang bật stale_scope: paths) (r1)**
  Người dùng thấy gì: Sửa tệp kiểm tra cấu hình thì hồ sơ nghiệm thu không bị đánh dấu cũ, nên có thể có bằng chứng lỗi thời mà không ai thấy.
  Căn cứ: Hậu quả nhẹ, chỉ ảnh hưởng độ tươi của hồ sơ nội bộ, không mất dữ liệu và sửa sau rất rẻ.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Chú thích s4v_keo ghi «ma trận 18 ô», còn test và eval là 24 ô (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng ghi chú trong cấu hình nói sai số ô kiểm tra, người đọc có thể hiểu nhầm nhưng không ảnh hưởng hoạt động.
  Căn cứ: Chỉ là chữ chú thích, không ảnh hưởng người dùng, sửa lúc nào cũng được.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Đổi tên/di chuyển tệp ra khỏi vùng làm suite bị bỏ qua sai (git diff --name-only bật dò rename nên chỉ in đường đích) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi một nhánh chuyển tệp từ module này sang module khác, lượt chấm có thể bỏ qua bộ kiểm của module cũ và để lọt lỗi.
  Căn cứ: Lỗi lọt chỉ ở ca hiếm là di chuyển tệp, vẫn còn CI chạy đủ bộ kiểm hứng lại, và sửa rẻ.
  file: `scripts/suite-neu-doi.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bước chép .env nuốt lỗi git ls-files: không chép gì mà vẫn thoát 0 (r1)**
  Người dùng thấy gì: Nếu việc chép tệp cấu hình thất bại âm thầm, môi trường chấm báo dựng xong nhưng sau đó các bộ kiểm đỏ khó hiểu.
  Căn cứ: Chỉ xảy ra khi cấu hình đường dẫn sai, tự lộ ra ở lượt chấm và chạy lại là xong, không mất dữ liệu.
  file: `scripts/dung-worktree-cham.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ca «chạy lại không đổi» chỉ đo việc stdout vắng chữ «chép/nối/sinh», mà chưa lần nào kiểm lần chạy đầu có in các chữ đó (r1)**
  Người dùng thấy gì: Phép kiểm chạy lại không đổi gì có thể xanh dù không chứng minh được điều đó, nên một thay đổi sau này có thể lọt.
  Căn cứ: Chỉ là công cụ nội bộ, hậu quả nhỏ, người dùng cuối không bị ảnh hưởng và gia cố test rẻ.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình) trong probe: so hai kết quả grep có thể cùng rỗng nên vẫn xanh (r1)**
  Người dùng thấy gì: Phép kiểm cấu hình giữ nguyên có thể báo xanh mà thực ra không so gì cả nếu định dạng tệp đổi.
  Căn cứ: Rủi ro thấp vì còn kiểm khác che phần lớn, chỉ là công cụ nội bộ và sửa rẻ.
  file: `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (không round-trip với bên đọc): S4V-AC-6 đọc config bằng bộ tách regex tự viết, không dùng resolveConfigKey/resolveConfigList của kit, là bộ mà s4-args và repin-lane thật sự dùng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Test cấu hình có thể xanh trong khi công cụ thật đọc cấu hình khác đi sau này, làm lượt chấm chạy sai lệnh.
  Căn cứ: Hiện tại đã kiểm tay là đúng, rủi ro chỉ khi cấu hình bị sửa lạ, lượt chấm lỗi sẽ thấy ngay và sửa rẻ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
