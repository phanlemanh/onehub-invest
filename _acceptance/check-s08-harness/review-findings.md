# Review findings: check-s08-harness (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC — 4/4 eval đạt `expected`, kể cả các vế should-NOT-fire)

## Ngoài hợp đồng

không có

## Đã soát, không phải finding

Phạm vi soát: `git diff origin/main...HEAD` (một dòng ở `pipeline/scripts/check-s08-inventory.mjs`, khối `cs8h_*` ở
`_acceptance/config.yaml`, hồ sơ này).

- Danh sách chép đủ. Soát mọi import tương đối của chuỗi tệp chép: `sync-pii.test.mjs` nhập `./import-airbnb.mjs` và
  `./sync-cloud.mjs`; `import-airbnb.mjs` nhập `./import-s08-row.mjs`; `sync-cloud.mjs` nhập `./lib/tier-a-guard.mjs`
  (symlink `lib/`), và `lib/tier-a-guard.mjs` nhập `./mask-source-names.mjs` trong cùng `lib/`; `import-s08-row.mjs`
  không nhập gì. Không có import động hay đọc tệp tương đối trong `sync-pii.test.mjs`. Không tệp nào còn thiếu.
- Không che lỗi khác. `sync-pii.test` trong thư mục tạm cho 8 ca, 8 xanh, 0 bỏ qua — trùng khớp lượt chạy tại chỗ.
  M1 vẫn đỏ đúng ca `FILL không chứa stg_s08_inventory`. Baseline chỉ hỏng ở `Cannot find module …/import-s08-row.mjs`.
- Probe có răng: đột biến M1 vô hại, script của main, cây trước 26/10 cho baseline, tệp ngoài phạm vi, sửa mã sản phẩm
  và đổi dòng thứ hai trong script kiểm — mỗi ca làm đúng probe tương ứng đỏ (chi tiết ở Analyst của evidence-report).
- Lệch main: origin/main tiến thêm PR #199 sau merge-base; không chạm bốn tệp chép, `lib/` chỉ thêm tệp ngoài chuỗi
  nạp; script HEAD chạy trên `pipeline/` của origin/main vẫn PASS; `git merge-tree` sạch.
- Danh sách chép tĩnh sẽ vỡ lại nếu một tệp trong chuỗi thêm import tương đối mới. Hợp đồng đã khai việc đổi cách dựng
  thư mục tạm là ngoài phạm vi (giữ hình dạng đã ký), nên không phải finding vòng này.
- Ca DB của `sync-pii.test` tự bỏ qua khi DB local tắt; ca đó không liên quan M0/M1 (ca S08 là ca tĩnh) và là nếp có
  sẵn trên main.
- `scope.sh` lọc dòng diff bằng `^[+-][^+-]`, nên dòng thêm trống hoặc bắt đầu bằng `-`/`+` không được đếm. Không ảnh
  hưởng kết quả vòng này (diff thật 1 xoá/1 thêm, đã đối chiếu `git diff` trực tiếp).
