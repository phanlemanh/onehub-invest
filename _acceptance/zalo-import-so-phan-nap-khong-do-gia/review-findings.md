# Review findings: zalo-import-so-phan-nap-khong-do-gia (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **zalo-import-job-lan.test.mjs không dọn thư mục tạm cha: mỗi lần chạy để lại một thư mục zalo-lan-***
  Người dùng thấy gì: Mỗi lần chạy bài kiểm tra này, máy để lại một thư mục rỗng trong vùng tạm. Người dùng sản phẩm không bị ảnh hưởng, chỉ tốn chút chỗ trên máy dev.
  Căn cứ: Hậu quả rất nhẹ, không mất hay lộ dữ liệu, hệ điều hành tự dọn vùng tạm và sửa không đem lại lợi ích gì cho người dùng.
  file: `scripts/zalo-import-job-lan.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hồ sơ trước transform-zalo-boc-job-run vẫn mô tả E5 theo merge-base mà vòng này đã bỏ**
  Người dùng thấy gì: Hồ sơ nghiệm thu của vòng trước còn mô tả cách so cũ, nên người đọc sau này có thể hiểu nhầm cách phép kiểm đang hoạt động. Sản phẩm chạy bình thường, chỉ tài liệu nội bộ lệch.
  Căn cứ: Chỉ gây hiểu nhầm cho người đọc hồ sơ, không ảnh hưởng người dùng hay dữ liệu, và có thể ghi chú lại bất cứ lúc nào.
  file: `_acceptance/transform-zalo-boc-job-run/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Test làn đỏ giả khi ZCode sửa đúng dòng vòng thử của phần nạp (SUA_GOC đọc từ tệp bọc ở HEAD)**
  Người dùng thấy gì: Nếu sau này làn thu thập sửa đúng dòng thử lại khi nạp, bộ kiểm tra của làn này sẽ báo đỏ oan, đúng loại báo động giả mà vòng này muốn loại bỏ. Người dùng sản phẩm không thấy gì, nhưng người làm việc sẽ bị chặn vô cớ khi hợp nhất.
  Căn cứ: Chưa xảy ra và không động tới dữ liệu người dùng, nhưng sẽ lặp lại đúng cái đau của vòng này nếu làn thu thập đổi dòng đó, và sửa lúc này rẻ hơn sửa sau khi đã bị chặn.
  file: `scripts/zalo-import-job-lan.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **after() chỉ gỡ worktree, bỏ sót thư mục mkdtemp cha nên mỗi lần chạy để lại một thư mục zalo-lan-***
  Người dùng thấy gì: Bài kiểm tra để lại thư mục tạm rỗng sau mỗi lần chạy, và nếu bước sao chép dở dang lỗi thì còn sót cả bản sao dở. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ tốn chỗ trên máy dev, không mất hay lộ dữ liệu và người làm tự xoá được bất cứ lúc nào.
  file: `scripts/zalo-import-job-lan.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): ZL-AC-1 kiểm «không dùng merge-base» bằng doesNotMatch, không có đối chứng dương, và chỉ quét thân ca**
  Người dùng thấy gì: Phép kiểm xác nhận không còn dùng cách so cũ chỉ là tìm chữ trong mã nguồn, nên nếu sau này cách so cũ lén quay lại ở chỗ khác thì có thể không bị phát hiện. Sản phẩm hiện tại vẫn đúng.
  Căn cứ: Rủi ro chỉ là bỏ sót một lỗi tương lai trong công cụ kiểm tra nội bộ, không ảnh hưởng người dùng, và hành vi chính đã có phép kiểm riêng.
  file: `scripts/zalo-import-job-lan.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
