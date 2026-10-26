# Review findings: import-s08 (round 1)

Phạm vi đọc: `git diff origin/main...HEAD -- pipeline scripts/s08-danh-muc` (merge-base `8fc9603d`). Gồm nhánh S08 trong
`pipeline/import-airbnb.mjs`, `pipeline/import-s08-row.mjs`, hai test và mode `nap-hai-lan`/`nguon-duy-nhat` của
`scripts/s08-danh-muc/acceptance.mjs`. Phiên chấm không viết mã này và không sửa tệp sản phẩm hay harness. Phép thử `s08Num` dưới đây
chỉ dùng chuỗi tự đặt, không đọc dữ liệu thật.

## Trong hợp đồng

(không có finding nào map được vào AC. E1–E7 đều đạt, xem evidence-report.md)

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng; người quyết, máy không sửa.

- **OOC-1: Mỗi item danh mục `project_catalog` sinh một dòng cảnh báo «state lạ» khi nạp snapshot thật**
  Người dùng thấy gì: Người vận hành nạp snapshot S08 thật và thấy hàng trăm dòng «bỏ item S08 state lạ 'catalog' …» lẫn trong log.
  Dòng tổng chỉ đếm «+N detail bỏ», không đếm số item danh mục bị bỏ. Cảnh báo thật về state lạ (nguồn đổi enum) sẽ chìm giữa các dòng
  này.
  Căn cứ: Nhánh S08 chỉ bỏ im lặng `state === "detail"`; mọi state khác `notSold|sold` đều đi vào `console.warn`. Collector ghi
  `meta.state: "catalog"` cho từng dự án khi `S08_PROJECTS=all`. Theo số đếm của bộ kiểm snapshot-that (20011 item, 19669 căn), có 342
  item không phải căn, ước khoảng một nửa là item danh mục. Snapshot giả của `nap-hai-lan` không có item `project_catalog`, nên eval
  không chạm tới đường này.
  file: `pipeline/import-airbnb.mjs`
  severity: low
  Đề xuất: sửa trong vòng này hoặc PL11. Bỏ `project_catalog` im lặng và đếm vào dòng tổng như detail, kèm một item catalog trong
  snapshot giả của `nap-hai-lan`.

- **OOC-2: `s08Num` biến vài chuỗi rác thành số**
  Người dùng thấy gì: Hiện chưa thấy gì. Nếu bản ghi S08 có diện tích hoặc giá dạng chuỗi chỉ có khoảng trắng, hoặc dùng dấu phẩy phân
  cách hàng nghìn, `stg_s08_inventory` sẽ chứa số sai (0, hoặc 1.5 thay cho 1500) thay vì NULL.
  Căn cứ: Phép thử `s08Num` bằng chuỗi tự đặt cho kết quả: `" "` → 0, `"1,500"` → 1.5, `"0x10"` → 16, `"1e3"` → 1000. Hàm chỉ thay
  dấu phẩy đầu tiên rồi gọi `Number()`. AC-2 chỉ đòi các ca đã khai (`'100,5'`, `'2'`, `'S'`, `''`, `'2PN'`, giá rác), và các ca đó đều
  đúng. Chưa biết dữ liệu thật có những dạng trên hay không. Phiên chấm không đọc snapshot thật.
  file: `pipeline/import-s08-row.mjs`
  severity: low
  Đề xuất: known-limits. Cách sửa rẻ là `trim()` rồi chỉ nhận chuỗi khớp `^-?\d+([.,]\d+)?$`. Có thể thêm vào `snapshot-that` một
  dòng chỉ in số đếm các chuỗi số có hơn một dấu phẩy hoặc chỉ có khoảng trắng.
