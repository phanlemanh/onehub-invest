# Review findings: thu-danh-muc-ocp1 (round 1)

Phạm vi đọc: `git diff origin/main...HEAD -- collector pipeline scripts/s08-danh-muc` (merge-base `8fc9603d`). Gồm
`collector/src/collectors/s08-danh-muc.ts`, test S08, `collector/package.json`, `collector/docs/DATA-CONTRACT.md`, `storage.ts`,
`types.ts` và `scripts/s08-danh-muc/acceptance.mjs`. Phiên chấm không viết mã này và không sửa tệp sản phẩm hay harness. Phiên chấm
không mở snapshot thật hay bộ mẫu. Mọi số liệu về dữ liệu thật dưới đây lấy từ dòng đếm do bộ kiểm in.

## Trong hợp đồng

(không có finding nào map được vào AC. E1–E9 đều đạt, xem evidence-report.md)

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng; người quyết, máy không sửa.

- **OOC-1: Thu toàn danh mục (`S08_PROJECTS=all`) dừng im lặng khi API trả mã lỗi, ra lượt thu rỗng mà không báo**
  Người dùng thấy gì: Người vận hành chạy lượt thu tuần khi token đã hết hạn. Lượt thu kết thúc như bình thường, với 0 dự án, 0 item,
  coverage `failed: 0`, và không có lỗi nào. Có thể có một snapshot rỗng; không có tín hiệu nào cho biết cần đăng nhập lại.
  Căn cứ: `fetchProjectCatalog` thoát vòng lặp khi gặp `code !== 1`, `data` không phải mảng hoặc mảng rỗng
  (`if (j.code !== 1 || !Array.isArray(j.data) || j.data.length === 0) break;`), và chỉ ném lỗi khi HTTP không ok. Ca test của
  `fetchPage` mô phỏng đúng tình huống token hết hạn: HTTP 200 kèm thân `code: 401`. `fetchPage` và `fetchProjectDetail` ném lỗi trong
  tình huống đó; trang danh mục thì không. AC-4 và E4 chỉ đo `fetchPage`/`fetchProjectDetail`.
  file: `collector/src/collectors/s08-danh-muc.ts`
  severity: medium
  Đề xuất: sửa trong vòng này. Nếu trang 1 trả `code≠1` thì ném lỗi giống `fetchPage`, kèm một ca test mô phỏng HTTP 200 với
  `code: 401` ở endpoint danh mục. Mảng rỗng ở trang sau vẫn là hết danh sách.

- **OOC-2: Kind `project_catalog` chưa khai trong DATA-CONTRACT v4, và item danh mục trùng sourceId với item chi tiết**
  Người dùng thấy gì: Người viết bước tiêu thụ đọc DATA-CONTRACT (giao diện collector↔pipeline, luật 4). Mục v4 chỉ khai kind
  `inventory_unit` với state `notSold|sold|detail`. Snapshot thật lại có thêm item `project_catalog` mang state `catalog`. Item danh
  mục và item chi tiết của cùng một dự án dùng cùng một sourceId.
  Căn cứ: Ở nhánh `S08_PROJECTS=all`, collector đẩy item `kind: "project_catalog"`, `meta.state: "catalog"`, sourceId
  `sha256("S08|project|" + id)`. Item chi tiết của cùng dự án dùng đúng công thức sourceId đó, với `kind: "inventory_unit"`. Mục v4 của
  DATA-CONTRACT không nhắc `project_catalog` hay state `catalog`. Mục này ghi sourceId là `sha256(S08|project|product_code)`, không nói
  mã bị cắt còn 32 ký tự hex. Theo số đếm của bộ kiểm snapshot-that (20011 item, 19669 căn), có 342 item không phải căn.
  file: `collector/docs/DATA-CONTRACT.md`
  severity: medium
  Đề xuất: bổ sung mục v4 trước khi merge. v4 chưa lên main nên không cần tăng lên v5. Mục v4 cần khai `project_catalog` (state
  `catalog`, payload đã lọc liên hệ), khai rõ item chi tiết là siêu dữ liệu dự án, công thức sourceId thật (cắt 32 hex), và việc
  catalog với chi tiết dùng chung sourceId. Cách khác là tách tiền tố sourceId cho hai loại.

- **OOC-3: Payload danh sách căn ghi nguyên văn, không qua bộ lọc khoá liên hệ**
  Người dùng thấy gì: Hiện chưa thấy gì; bộ kiểm snapshot-that đếm 0 trường liên hệ trong snapshot thật. Nếu nguồn S08 thêm khoá liên
  hệ (nhân viên kinh doanh, người giữ chỗ) vào bản ghi căn, khoá đó sẽ vào raw và `stg_s08_inventory.payload` mà không có bước máy nào
  chặn.
  Căn cứ: `stripPersonData` chỉ áp lên item chi tiết và item danh mục. `toRawItems` ghi `payload: u` nguyên vẹn, đúng như AC-1 đòi. Chú
  thích trong mã dựa vào việc endpoint không trả `contact_data`. Bộ đếm `demPii` của snapshot-that khớp đúng một danh sách tên khoá cố
  định; collector lọc theo regex `/contact/i`. Hai thước không cùng tập khoá: ví dụ khoá `contact_phone` bị collector lọc ở chi tiết
  nhưng không được `demPii` đếm.
  file: `collector/src/collectors/s08-danh-muc.ts`
  severity: low
  Đề xuất: known-limits. Muốn chặn bằng máy thì áp `stripPersonData` trong `toRawItems`, sửa AC-1 thành «payload nguyên vẹn trừ khoá
  liên hệ», và cho `demPii` dùng cùng regex với collector.

- **OOC-4: Chú thích test S08 vẫn ghi fixture là dữ liệu API thật**
  Người dùng thấy gì: Người đọc kho công khai thấy đầu `s08-danh-muc.test.ts` ghi «Fixture = dữ liệu API thật» và «tsc không chép JSON
  sang dist». Câu đầu gợi rằng tệp fixture trong kho là dữ liệu thật của S08, trong khi bản v2 đã thay bằng fixture giả. Câu sau không
  còn đúng, vì `build`/`test` giờ có `cp -R` fixture sang `dist`.
  Căn cứ: Phần Context của hợp đồng ghi bản đầu bị chặn vì fixture là dữ liệu thật, và v2 dùng fixture giả (project_id ≥ 900000, E5
  xác nhận). Chú thích từ bản đầu chưa được sửa theo.
  file: `collector/src/test/s08-danh-muc.test.ts`
  severity: low
  Đề xuất: sửa chú thích thành «fixture giả, id ≥ 900000». Câu về dist có thể bỏ.
